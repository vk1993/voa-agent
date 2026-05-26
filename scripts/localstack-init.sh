#!/bin/bash
echo "Initializing VOXA Local AWS services..."

# 1. Create SQS Queues
awslocal sqs create-queue --queue-name voxa-call-ended-queue
awslocal sqs create-queue --queue-name voxa-call-ended-dlq

# 2. Create mock secret inside AWS Secrets Manager
awslocal secretsmanager create-secret \
    --name voxa/production/secrets \
    --description "VOXA Production Mock Secrets for Local Testing" \
    --secret-string '{"CALENDLY_TOKEN":"mock_calendly_pat_token","WHATSAPP_TOKEN":"mock_whatsapp_cloud_token","WHATSAPP_PHONE_ID":"1234567890","PINECONE_API_KEY":"mock_pinecone_api_key","TWILIO_AUTH_TOKEN":"mock_twilio_auth_token","TWILIO_ACCOUNT_SID":"mock_twilio_account_sid","OPENAI_API_KEY":"mock_openai_api_key"}'

# 3. Create mock DynamoDB Table for Immutable Audit Trail
awslocal dynamodb create-table \
    --table-name VoxaAuditLogs \
    --attribute-definitions AttributeName=tenant_id,AttributeType=S AttributeName=timestamp,AttributeType=S \
    --key-schema AttributeName=tenant_id,KeyType=HASH AttributeName=timestamp,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST

# 4. Create mock DynamoDB Table for AI Persistent Memory Event Store
awslocal dynamodb create-table \
    --table-name LeadEvents \
    --attribute-definitions AttributeName=contact_id,AttributeType=S AttributeName=timestamp,AttributeType=S \
    --key-schema AttributeName=contact_id,KeyType=HASH AttributeName=timestamp,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST

# 5. Pre-seed mock timeline events for client Priya Nair ('c1') to test chronological replaying
awslocal dynamodb put-item \
    --table-name LeadEvents \
    --item '{"contact_id": {"S": "c1"}, "timestamp": {"S": "2026-05-20T10:00:00Z"}, "eventType": {"S": "PreferenceExtracted"}, "payload": {"S": "{\"trait\":\"Material\",\"value\":\"Gloss Acrylic\",\"confidence\":0.95}"}}'

awslocal dynamodb put-item \
    --table-name LeadEvents \
    --item '{"contact_id": {"S": "c1"}, "timestamp": {"S": "2026-05-20T10:02:00Z"}, "eventType": {"S": "ObjectionRaised"}, "payload": {"S": "{\"objection\":\"Holding off until Whitefield modular kitchen possession is final\",\"responseStrategized\":\"Emphasized booking design early to secure custom factory carpenters before peak season\"}"}}'

echo "VOXA Local AWS initialization complete!"
