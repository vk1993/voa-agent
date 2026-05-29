#!/usr/bin/env python3
import os
import aws_cdk as cdk
from voxa_stack import VoxaStack

app = cdk.App()
VoxaStack(app, "VoxaStack",
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'), 
        region=os.getenv('CDK_DEFAULT_REGION')
    ),
)
app.synth()
