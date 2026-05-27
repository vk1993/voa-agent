#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { VoxaNetworkStack } from "../lib/voxa-network-stack";
import { VoxaTelephonyStack } from "../lib/voxa-telephony-stack";

const app = new cdk.App();

const networkStack = new VoxaNetworkStack(app, "VoxaNetworkStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || "123456789012",
    region: process.env.CDK_DEFAULT_REGION || "ap-south-1",
  },
  description: "Voxa Enterprise Private Networking VPC Stack",
});

new VoxaTelephonyStack(app, "VoxaTelephonyStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || "123456789012",
    region: process.env.CDK_DEFAULT_REGION || "ap-south-1",
  },
  vpc: networkStack.vpc,
  lambdaSecurityGroup: networkStack.lambdaSecurityGroup,
  rdsSecurityGroup: networkStack.rdsSecurityGroup,
  redisSecurityGroup: networkStack.redisSecurityGroup,
  envName: "production",
  description: "Voxa Decoupled Telephony and Real-Time Voice Webhook Processing Infrastructure Stack",
});
