import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export interface VoxaNetworkStackProps extends cdk.StackProps {
  envName?: string;
}

export class VoxaNetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;
  public readonly rdsSecurityGroup: ec2.SecurityGroup;
  public readonly redisSecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: VoxaNetworkStackProps) {
    super(scope, id, props);

    const envName = props?.envName || "production";

    // 1. VPC Setup with 2 Availability Zones minimum
    this.vpc = new ec2.Vpc(this, "VoxaVpc", {
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: "isolated",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // 2. Lambda Security Group: Allow outbound 443 HTTPS for external APIs
    this.lambdaSecurityGroup = new ec2.SecurityGroup(this, "sg-lambda", {
      vpc: this.vpc,
      securityGroupName: `voxa-lambda-sg-${envName}`,
      description: "Allow outbound HTTPS traffic from Lambdas to external APIs",
      allowAllOutbound: true,
    });

    // 3. RDS Security Group: Allow inbound 5432 from Lambda only
    this.rdsSecurityGroup = new ec2.SecurityGroup(this, "sg-rds", {
      vpc: this.vpc,
      securityGroupName: `voxa-rds-sg-${envName}`,
      description: "Allow database connections from sg-lambda only",
      allowAllOutbound: false,
    });
    this.rdsSecurityGroup.addIngressRule(
      this.lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      "Allow PostgreSQL connections from Lambda security group"
    );

    // 4. Redis Security Group: Allow inbound 6379 from Lambda only
    this.redisSecurityGroup = new ec2.SecurityGroup(this, "sg-redis", {
      vpc: this.vpc,
      securityGroupName: `voxa-redis-sg-${envName}`,
      description: "Allow Redis cache connections from sg-lambda only",
      allowAllOutbound: false,
    });
    this.redisSecurityGroup.addIngressRule(
      this.lambdaSecurityGroup,
      ec2.Port.tcp(6379),
      "Allow Redis connections from Lambda security group"
    );

    // 5. ALB Security Group: Allow inbound 443 from internet
    this.albSecurityGroup = new ec2.SecurityGroup(this, "sg-alb", {
      vpc: this.vpc,
      securityGroupName: `voxa-alb-sg-${envName}`,
      description: "Allow inbound HTTPS traffic from the internet to ALB",
      allowAllOutbound: true,
    });
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "Allow inbound HTTPS"
    );

    // Outputs for verification and dynamic cross-referencing
    new cdk.CfnOutput(this, "VpcId", {
      value: this.vpc.vpcId,
      description: "VOXA Private VPC Identifier",
    });
  }
}
