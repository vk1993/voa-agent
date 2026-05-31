from aws_cdk import (
    Stack,
    Duration,
    CfnOutput,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_dynamodb as dynamodb,
    aws_sqs as sqs,
    aws_lambda as _lambda,
    aws_lambda_event_sources as lambda_events,
    aws_secretsmanager as secretsmanager,
    aws_s3 as s3,
    aws_events as events,
    aws_events_targets as targets,
    aws_rds as rds,
    aws_ecr as ecr,
    aws_elasticloadbalancingv2 as elbv2,
    aws_servicediscovery as sd,
    aws_cognito as cognito,
    aws_cloudfront as cf,
    aws_cloudfront_origins as origins,
    RemovalPolicy
)
from constructs import Construct

class VoxaStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # =========================================================================
        # 1. DynamoDB Table (Memory Store)
        # =========================================================================
        table = dynamodb.Table(self, "LeadEventsTable",
            table_name="LeadEvents",
            partition_key=dynamodb.Attribute(name="contact_id", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="timestamp", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN
        )

        # =========================================================================
        # 2. S3 Bucket (Fine-Tuning Dataset)
        # =========================================================================
        bucket = s3.Bucket(self, "RecordingsBucket",
            bucket_name=f"voxa-recordings-{self.account}-{self.region}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN
        )

        # =========================================================================
        # 3. Secrets Manager
        # =========================================================================
        secret = secretsmanager.Secret(self, "VoxaSecrets",
            secret_name="VOXA_SECRETS"
        )

        # =========================================================================
        # 4. VPC for Fargate
        # =========================================================================
        vpc = ec2.Vpc(self, "VoxaVpc",
            max_azs=2,
            nat_gateways=1
        )

        # Security group for RDS
        db_sg = ec2.SecurityGroup(self, "DbSecurityGroup",
            vpc=vpc,
            description="Allow PostgreSQL from ECS and Lambda",
        )
        db_sg.add_ingress_rule(
            ec2.Peer.ipv4(vpc.vpc_cidr_block),
            ec2.Port.tcp(5432),
            "Allow PostgreSQL from VPC"
        )

        # =========================================================================
        # RDS Production Hardening (PostgreSQL 16)
        # =========================================================================
        db_instance = rds.DatabaseInstance(self, "VoxaPostgres",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_16
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T4G, ec2.InstanceSize.SMALL  # upgraded from MICRO
            ),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[db_sg],
            database_name="voxa_prod",
            credentials=rds.Credentials.from_generated_secret("voxa_admin"),
            multi_az=True,                            # enabled for production
            storage_encrypted=True,
            deletion_protection=True,                 # enabled for production
            storage_type=rds.StorageType.GP3,         # upgraded from GP2
            allocated_storage=200,                    # upgraded from 100
            backup_retention=Duration.days(7),
            preferred_backup_window="01:00-02:00",
            preferred_maintenance_window="Mon:03:00-Mon:04:00",
            cloudwatch_logs_exports=["postgresql", "upgrade"],
            removal_policy=RemovalPolicy.SNAPSHOT,
        )

        CfnOutput(self, "DbEndpoint",
            value=db_instance.db_instance_endpoint_address,
            description="RDS PostgreSQL endpoint"
        )

        # =========================================================================
        # ECR Repositories
        # =========================================================================
        nextjs_repo = ecr.Repository(self, "NextjsRepo",
            repository_name="voxa-nextjs",
            removal_policy=RemovalPolicy.RETAIN,
            lifecycle_rules=[ecr.LifecycleRule(max_image_count=10)]
        )
        fastify_repo = ecr.Repository(self, "FastifyRepo",
            repository_name="voxa-fastify",
            removal_policy=RemovalPolicy.RETAIN,
            lifecycle_rules=[ecr.LifecycleRule(max_image_count=10)]
        )
        agent_repo = ecr.Repository(self, "AgentRepo",
            repository_name="voxa-agent",
            removal_policy=RemovalPolicy.RETAIN,
            lifecycle_rules=[ecr.LifecycleRule(max_image_count=10)]
        )

        CfnOutput(self, "NextjsRepoUri", value=nextjs_repo.repository_uri)
        CfnOutput(self, "FastifyRepoUri", value=fastify_repo.repository_uri)
        CfnOutput(self, "AgentRepoUri", value=agent_repo.repository_uri)

        # =========================================================================
        # Cognito User Pool Configuration
        # =========================================================================
        user_pool = cognito.UserPool(self, "VoxaUserPool",
            user_pool_name="voxa-users",
            self_sign_up_enabled=False,    # invite-only
            sign_in_aliases=cognito.SignInAliases(email=True),
            standard_attributes=cognito.StandardAttributes(
                email=cognito.StandardAttribute(required=True, mutable=True)
            ),
            custom_attributes={
                "role": cognito.StringAttribute(mutable=True),
                "tenantId": cognito.StringAttribute(mutable=True),
            },
            password_policy=cognito.PasswordPolicy(
                min_length=8, require_uppercase=True,
                require_digits=True, require_symbols=False,
            ),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            removal_policy=RemovalPolicy.RETAIN,
        )

        app_client = user_pool.add_client("VoxaAppClient",
            user_pool_client_name="voxa-web",
            generate_secret=False,   # set True if using server-side flow
            auth_flows=cognito.AuthFlow(
                user_password=True,
                user_srp=True,
            ),
        )

        CfnOutput(self, "UserPoolId",   value=user_pool.user_pool_id)
        CfnOutput(self, "UserPoolArn",  value=user_pool.user_pool_arn)
        CfnOutput(self, "AppClientId",  value=app_client.user_pool_client_id)
        CfnOutput(self, "JwksUrl",
            value=f"https://cognito-idp.{self.region}.amazonaws.com/{user_pool.user_pool_id}/.well-known/jwks.json"
        )

        # =========================================================================
        # ECS Fargate Cluster
        # =========================================================================
        cluster = ecs.Cluster(self, "VoxaCluster", vpc=vpc)

        # Service Discovery Namespace
        namespace = sd.PrivateDnsNamespace(self, "VoxaNamespace",
            name="voxa.internal",
            vpc=vpc,
        )

        # SQS Queue for Worker
        queue = sqs.Queue(self, "PostCallQueue",
            queue_name="voxa-post-call-queue",
            visibility_timeout=Duration.seconds(300),
            retention_period=Duration.days(14)
        )

        # =========================================================================
        # Fastify ECS Fargate Service
        # =========================================================================
        fastify_task = ecs.FargateTaskDefinition(self, "FastifyTask",
            memory_limit_mib=1024,
            cpu=512,
        )
        fastify_container = fastify_task.add_container("FastifyContainer",
            image=ecs.ContainerImage.from_ecr_repository(fastify_repo, tag="latest"),
            logging=ecs.LogDrivers.aws_logs(stream_prefix="Fastify"),
            environment={
                "NODE_ENV":          "production",
                "SERVER_PORT":       "8080",
                "VOXA_SECRETS_ARN":  secret.secret_arn,
                "AWS_REGION":        self.region,
                "INTERNAL_API_KEY":  "{{resolve:secretsmanager:VOXA_SECRETS:SecretString:INTERNAL_API_KEY}}",
                "RECORDINGS_BUCKET_NAME": bucket.bucket_name,
                "DATABASE_URL":      f"postgresql://voxa_admin:{db_instance.secret.secret_value_from_json('password').unsafe_unwrap()}@{db_instance.db_instance_endpoint_address}:5432/voxa_prod"
            },
            health_check=ecs.HealthCheck(
                command=["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
                interval=Duration.seconds(30),
                timeout=Duration.seconds(10),
                retries=3,
            )
        )
        fastify_container.add_port_mappings(ecs.PortMapping(container_port=8080))
        secret.grant_read(fastify_task.task_role)
        bucket.grant_read_write(fastify_task.task_role)
        db_instance.grant_connect(fastify_task.task_role)

        fastify_service = ecs.FargateService(self, "FastifyService",
            cluster=cluster, task_definition=fastify_task,
            desired_count=2, min_healthy_percent=50,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
        )

        # Register Fastify under Service Discovery (fastify.voxa.internal)
        fastify_service.enable_cloud_map(
            cloud_map_namespace=namespace,
            name="fastify",
        )

        # =========================================================================
        # Next.js ECS Fargate Service
        # =========================================================================
        nextjs_task = ecs.FargateTaskDefinition(self, "NextjsTask",
            memory_limit_mib=2048,
            cpu=1024,
        )
        nextjs_container = nextjs_task.add_container("NextjsContainer",
            image=ecs.ContainerImage.from_ecr_repository(nextjs_repo, tag="latest"),
            logging=ecs.LogDrivers.aws_logs(stream_prefix="Nextjs"),
            environment={
                "NODE_ENV":                  "production",
                "PORT":                      "3000",
                "VOXA_SECRETS_ARN":          secret.secret_arn,
                "AWS_REGION":                self.region,
                "FASTIFY_INTERNAL_URL":      "http://fastify.voxa.internal:8080",
                "UPSTASH_REDIS_REST_URL":    "{{resolve:secretsmanager:VOXA_SECRETS:SecretString:UPSTASH_REDIS_REST_URL}}",
                "UPSTASH_REDIS_REST_TOKEN":  "{{resolve:secretsmanager:VOXA_SECRETS:SecretString:UPSTASH_REDIS_REST_TOKEN}}",
                "JWT_SECRET":                "{{resolve:secretsmanager:VOXA_SECRETS:SecretString:JWT_SECRET}}",
                "COGNITO_USER_POOL_ID":      "{{resolve:secretsmanager:VOXA_SECRETS:SecretString:COGNITO_USER_POOL_ID}}",
                "COGNITO_CLIENT_ID":         "{{resolve:secretsmanager:VOXA_SECRETS:SecretString:COGNITO_CLIENT_ID}}",
                "NEXT_PUBLIC_APP_URL":        "https://app.voxa.ai",
                "RECORDINGS_BUCKET_NAME":    bucket.bucket_name,
                "AWS_SES_REGION":            "ap-south-1",
                "SES_FROM_EMAIL":            "noreply@voxa.ai",
                "DATABASE_URL":              f"postgresql://voxa_admin:{db_instance.secret.secret_value_from_json('password').unsafe_unwrap()}@{db_instance.db_instance_endpoint_address}:5432/voxa_prod"
            },
            health_check=ecs.HealthCheck(
                command=["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"],
                interval=Duration.seconds(30),
                timeout=Duration.seconds(10),
                retries=3,
            )
        )
        nextjs_container.add_port_mappings(ecs.PortMapping(container_port=3000))
        secret.grant_read(nextjs_task.task_role)
        bucket.grant_read_write(nextjs_task.task_role)

        nextjs_service = ecs.FargateService(self, "NextjsService",
            cluster=cluster, task_definition=nextjs_task,
            desired_count=2, min_healthy_percent=50,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
        )

        # =========================================================================
        # Python Telephony Agent ECS Fargate Service (Internal Load Balanced)
        # =========================================================================
        agent_task = ecs.FargateTaskDefinition(self, "AgentTask",
            memory_limit_mib=2048,
            cpu=1024
        )
        agent_container = agent_task.add_container("AgentContainer",
            image=ecs.ContainerImage.from_ecr_repository(agent_repo, tag="latest"),
            logging=ecs.LogDrivers.aws_logs(stream_prefix="Agent"),
            environment={
                "VOXA_SECRETS_ARN":      secret.secret_arn,
                "PINECONE_INDEX":        "voxa-index",
                "POST_CALL_QUEUE_URL":   queue.queue_url,
                "AWS_REGION":            self.region,
                "FASTIFY_INTERNAL_URL":  "http://fastify.voxa.internal:8080",
                "DATABASE_URL":          f"postgresql://voxa_admin:{db_instance.secret.secret_value_from_json('password').unsafe_unwrap()}@{db_instance.db_instance_endpoint_address}:5432/voxa_prod"
            }
        )
        agent_container.add_port_mappings(ecs.PortMapping(container_port=8000))
        secret.grant_read(agent_task.task_role)
        db_instance.grant_connect(agent_task.task_role)

        # Load balancer & Service (Keep Fargate ALB service but marked internal)
        agent_service = ecs_patterns.ApplicationLoadBalancedFargateService(self, "AgentService",
            cluster=cluster,
            task_definition=agent_task,
            public_load_balancer=False, # Internal — Next.js and external ALB proxy to it
            assign_public_ip=False,
            task_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            )
        )

        # Register Agent under Service Discovery (agent.voxa.internal)
        agent_service.service.enable_cloud_map(
            cloud_map_namespace=namespace,
            name="agent",
        )

        # =========================================================================
        # Shared Application Load Balancer & Routing
        # =========================================================================
        alb = elbv2.ApplicationLoadBalancer(self, "VoxaALB",
            vpc=vpc,
            internet_facing=True,
        )

        # Target Groups
        nextjs_tg = elbv2.ApplicationTargetGroup(self, "NextjsTG",
            vpc=vpc, port=3000, protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[nextjs_service.load_balancer_target(
                container_name="NextjsContainer", container_port=3000
            )],
            health_check=elbv2.HealthCheck(path="/api/health", healthy_http_codes="200"),
        )
        fastify_tg = elbv2.ApplicationTargetGroup(self, "FastifyTG",
            vpc=vpc, port=8080, protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[fastify_service.load_balancer_target(
                container_name="FastifyContainer", container_port=8080
            )],
            health_check=elbv2.HealthCheck(path="/health", healthy_http_codes="200"),
        )
        agent_tg = elbv2.ApplicationTargetGroup(self, "AgentTG",
            vpc=vpc, port=8000, protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[agent_service.service.load_balancer_target(
                container_name="AgentContainer", container_port=8000
            )],
            health_check=elbv2.HealthCheck(path="/health", healthy_http_codes="200"),
        )

        # HTTP Listener
        main_listener = alb.add_listener("MainListener", port=80,
            default_target_groups=[nextjs_tg]  # Next.js is default
        )

        # Fastify Path Patterns: /contacts* and /tenant*
        main_listener.add_target_groups("FastifyRule",
            target_groups=[fastify_tg],
            conditions=[elbv2.ListenerCondition.path_patterns([
                "/contacts*", "/tenant*"
            ])],
            priority=10,
        )

        # Python Agent Path Patterns: /webhook*, /turn*, and /outbound*
        main_listener.add_target_groups("AgentRule",
            target_groups=[agent_tg],
            conditions=[elbv2.ListenerCondition.path_patterns([
                "/webhook*", "/turn*", "/outbound*"
            ])],
            priority=20,
        )

        CfnOutput(self, "AlbDns", value=alb.load_balancer_dns_name)

        # =========================================================================
        # CloudFront Distribution
        # =========================================================================
        distribution = cf.Distribution(self, "VoxaCdn",
            default_behavior=cf.BehaviorOptions(
                origin=origins.LoadBalancerV2Origin(alb,
                    protocol_policy=cf.OriginProtocolPolicy.HTTP_ONLY,
                    http_port=80,
                ),
                viewer_protocol_policy=cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cf.CachePolicy.CACHING_DISABLED,  # SSR — no caching
                origin_request_policy=cf.OriginRequestPolicy.ALL_VIEWER,
                allowed_methods=cf.AllowedMethods.ALLOW_ALL,
            ),
            additional_behaviors={
                # Static assets — long cache
                "/_next/static/*": cf.BehaviorOptions(
                    origin=origins.LoadBalancerV2Origin(alb,
                        protocol_policy=cf.OriginProtocolPolicy.HTTP_ONLY),
                    cache_policy=cf.CachePolicy.CACHING_OPTIMIZED,
                    viewer_protocol_policy=cf.ViewerProtocolPolicy.HTTPS_ONLY,
                ),
            },
            price_class=cf.PriceClass.PRICE_CLASS_200,  # includes India/Asia
            comment="VOXA platform CDN",
        )

        CfnOutput(self, "CloudFrontUrl",
            value=f"https://{distribution.distribution_domain_name}"
        )

        # =========================================================================
        # Lambda Worker (Post-Call Processing)
        # =========================================================================
        worker_lambda = _lambda.DockerImageFunction(self, "WorkerLambda",
            code=_lambda.DockerImageCode.from_image_asset(
                directory="../python",
                file="worker/Dockerfile",
                cmd=["post_call.handler"]
            ),
            memory_size=1024,
            timeout=Duration.seconds(300),
            environment={
                "VOXA_SECRETS_ARN":      secret.secret_arn,
                "PINECONE_INDEX":        "voxa-index",
                "DATABASE_URL":          f"postgresql://voxa_admin:{db_instance.secret.secret_value_from_json('password').unsafe_unwrap()}@{db_instance.db_instance_endpoint_address}:5432/voxa_prod"
            }
        )
        
        # Grant permissions to worker
        queue.grant_consume_messages(worker_lambda)
        worker_lambda.add_event_source(lambda_events.SqsEventSource(queue))
        table.grant_read_write_data(worker_lambda)
        secret.grant_read(worker_lambda)
        db_instance.grant_connect(worker_lambda)

        # =========================================================================
        # Fine-Tuning Cron Job (EventBridge -> Lambda)
        # =========================================================================
        fine_tuning_lambda = _lambda.DockerImageFunction(self, "FineTuningLambda",
            code=_lambda.DockerImageCode.from_image_asset(
                directory="../python",
                file="worker/Dockerfile",
                cmd=["fine_tuning.handler"]
            ),
            memory_size=2048,
            timeout=Duration.minutes(15),
            environment={
                "VOXA_SECRETS_ARN":      secret.secret_arn,
                "RECORDINGS_BUCKET":     bucket.bucket_name,
                "DATABASE_URL":          f"postgresql://voxa_admin:{db_instance.secret.secret_value_from_json('password').unsafe_unwrap()}@{db_instance.db_instance_endpoint_address}:5432/voxa_prod"
            }
        )
        table.grant_read_data(fine_tuning_lambda)
        bucket.grant_write(fine_tuning_lambda)
        secret.grant_read(fine_tuning_lambda)
        db_instance.grant_connect(fine_tuning_lambda)

        # Run weekly on Sunday 2 AM UTC
        rule = events.Rule(self, "WeeklyFineTuningRule",
            schedule=events.Schedule.cron(minute="0", hour="2", week_day="SUN")
        )
        rule.add_target(targets.LambdaFunction(fine_tuning_lambda))

        # =========================================================================
        # Prisma VPC Migration Runner Lambda function
        # =========================================================================
        migrate_fn = _lambda.Function(self, "MigrateFn",
            runtime=_lambda.Runtime.NODEJS_20_X,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
const { execSync } = require("child_process");
exports.handler = async () => {
  execSync("npx prisma migrate deploy", { stdio: "inherit",
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL } });
  return { statusCode: 200, body: "Migrations complete" };
};
"""),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            environment={
                "DATABASE_URL": f"postgresql://voxa_admin:{db_instance.secret.secret_value_from_json('password').unsafe_unwrap()}@{db_instance.db_instance_endpoint_address}:5432/voxa_prod"
            },
            timeout=Duration.minutes(5),
            memory_size=512,
        )

        db_instance.grant_connect(migrate_fn)
        CfnOutput(self, "MigrateFnArn", value=migrate_fn.function_arn)
