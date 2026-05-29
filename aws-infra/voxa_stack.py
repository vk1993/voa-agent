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
    aws_apigateway as apigw,
    aws_rds as rds,
    RemovalPolicy
)
from constructs import Construct

class VoxaStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # 1. DynamoDB Table (Memory Store)
        table = dynamodb.Table(self, "LeadEventsTable",
            table_name="LeadEvents",
            partition_key=dynamodb.Attribute(name="contact_id", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="timestamp", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN
        )

        # 2. S3 Bucket (Fine-Tuning Dataset)
        bucket = s3.Bucket(self, "RecordingsBucket",
            bucket_name=f"voxa-recordings-{self.account}-{self.region}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN
        )

        # 3. Secrets Manager
        secret = secretsmanager.Secret(self, "VoxaSecrets",
            secret_name="VOXA_SECRETS"
        )

        # 4. VPC for Fargate
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

        # RDS PostgreSQL 16
        db_instance = rds.DatabaseInstance(self, "VoxaPostgres",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_16
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO
            ),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[db_sg],
            database_name="voxa_prod",
            credentials=rds.Credentials.from_generated_secret("voxa_admin"),
            multi_az=False,             # set True for production
            storage_encrypted=True,
            deletion_protection=False,  # set True for production
            removal_policy=RemovalPolicy.SNAPSHOT,
        )

        CfnOutput(self, "DbEndpoint",
            value=db_instance.db_instance_endpoint_address,
            description="RDS PostgreSQL endpoint"
        )

        # 5. ECS Fargate Cluster & Service (The Agent)
        cluster = ecs.Cluster(self, "VoxaCluster", vpc=vpc)
        
        agent_task = ecs.FargateTaskDefinition(self, "AgentTask",
            memory_limit_mib=2048,
            cpu=1024
        )
        
        # We assume Docker image is built from python/ folder
        agent_container = agent_task.add_container("AgentContainer",
            image=ecs.ContainerImage.from_asset("../python", file="agent/Dockerfile"),
            logging=ecs.LogDrivers.aws_logs(stream_prefix="Agent"),
            environment={
                "VOXA_SECRETS_ARN": secret.secret_arn,
                "PINECONE_INDEX": "voxa-index",
            }
        )
        agent_container.add_port_mappings(ecs.PortMapping(container_port=8000))
        secret.grant_read(agent_task.task_role)

        # Load balancer & Service
        agent_service = ecs_patterns.ApplicationLoadBalancedFargateService(self, "AgentService",
            cluster=cluster,
            task_definition=agent_task,
            public_load_balancer=True,
            assign_public_ip=False,
            task_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            )
        )

        # 6. SQS Queue for Worker
        queue = sqs.Queue(self, "PostCallQueue",
            queue_name="voxa-post-call-queue",
            visibility_timeout=Duration.seconds(300),
            retention_period=Duration.days(14)
        )

        # 7. Lambda Worker (Post-Call Processing)
        worker_lambda = _lambda.DockerImageFunction(self, "WorkerLambda",
            code=_lambda.DockerImageCode.from_image_asset(
                directory="../python",
                file="worker/Dockerfile",
                cmd=["post_call.handler"]
            ),
            memory_size=1024,
            timeout=Duration.seconds(300),
            environment={
                "VOXA_SECRETS_ARN": secret.secret_arn,
                "PINECONE_INDEX": "voxa-index",
            }
        )
        
        # Grant permissions to worker
        queue.grant_consume_messages(worker_lambda)
        worker_lambda.add_event_source(lambda_events.SqsEventSource(queue))
        table.grant_read_write_data(worker_lambda)
        secret.grant_read(worker_lambda)

        # 8. Fine-Tuning Cron Job (EventBridge -> Lambda)
        fine_tuning_lambda = _lambda.DockerImageFunction(self, "FineTuningLambda",
            code=_lambda.DockerImageCode.from_image_asset(
                directory="../python",
                file="worker/Dockerfile",
                cmd=["fine_tuning.handler"]
            ),
            memory_size=2048,
            timeout=Duration.minutes(15),
            environment={
                "VOXA_SECRETS_ARN": secret.secret_arn,
                "RECORDINGS_BUCKET": bucket.bucket_name
            }
        )
        table.grant_read_data(fine_tuning_lambda)
        bucket.grant_write(fine_tuning_lambda)
        secret.grant_read(fine_tuning_lambda)

        # Run weekly on Sunday 2 AM UTC
        rule = events.Rule(self, "WeeklyFineTuningRule",
            schedule=events.Schedule.cron(minute="0", hour="2", week_day="SUN")
        )
        rule.add_target(targets.LambdaFunction(fine_tuning_lambda))
