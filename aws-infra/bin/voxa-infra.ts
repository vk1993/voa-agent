#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { VoxaTelephonyStack } from "../lib/voxa-telephony-stack";

const app = new cdk.App();

new VoxaTelephonyStack(app, "VoxaTelephonyStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || "123456789012",
    region: process.env.CDK_DEFAULT_REGION || "us-east-1",
  },
  description: "Voxa Decoupled Telephony and Real-Time Voice Webhook Processing Infrastructure Stack",
});
