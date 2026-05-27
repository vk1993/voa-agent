"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoxaNetworkStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
class VoxaNetworkStack extends cdk.Stack {
    vpc;
    lambdaSecurityGroup;
    rdsSecurityGroup;
    redisSecurityGroup;
    albSecurityGroup;
    constructor(scope, id, props) {
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
        this.rdsSecurityGroup.addIngressRule(this.lambdaSecurityGroup, ec2.Port.tcp(5432), "Allow PostgreSQL connections from Lambda security group");
        // 4. Redis Security Group: Allow inbound 6379 from Lambda only
        this.redisSecurityGroup = new ec2.SecurityGroup(this, "sg-redis", {
            vpc: this.vpc,
            securityGroupName: `voxa-redis-sg-${envName}`,
            description: "Allow Redis cache connections from sg-lambda only",
            allowAllOutbound: false,
        });
        this.redisSecurityGroup.addIngressRule(this.lambdaSecurityGroup, ec2.Port.tcp(6379), "Allow Redis connections from Lambda security group");
        // 5. ALB Security Group: Allow inbound 443 from internet
        this.albSecurityGroup = new ec2.SecurityGroup(this, "sg-alb", {
            vpc: this.vpc,
            securityGroupName: `voxa-alb-sg-${envName}`,
            description: "Allow inbound HTTPS traffic from the internet to ALB",
            allowAllOutbound: true,
        });
        this.albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), "Allow inbound HTTPS");
        // Outputs for verification and dynamic cross-referencing
        new cdk.CfnOutput(this, "VpcId", {
            value: this.vpc.vpcId,
            description: "VOXA Private VPC Identifier",
        });
    }
}
exports.VoxaNetworkStack = VoxaNetworkStack;
