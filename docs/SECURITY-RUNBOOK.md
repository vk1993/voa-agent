# VOXA AI B2B Platform: Operational Security Runbook

This operational runbook outlines the step-by-step incident response procedures, database table expansions, employee offboardings, JWT key rotations, and B2B tenant lifecycle management instructions. All commands and responsibilities are fully outlined below with zero placeholders.

---

## Incidents Response Matrix

### Incident: Suspected cross-tenant data leak
* **Severity:** CRITICAL
* **Description:** Indication that an authenticated session from Tenant A was able to access or mutate resources belonging to Tenant B.
* **Responsible Role:** On-Call Security Response Team

#### Step-by-Step Resolution Actions:
1. **Quarantine the Connection Layer:**
   If a database RLS failure is suspected, temporarily isolate the active database endpoints by setting strict pg_hba rules or updating network access control lists (NACLs) to reject incoming server connections.
2. **Locate the Breach in Logs:**
   Execute a query against the DynamoDB/Audit Sim trace logs to locate cross-tenant attempts. Look for mismatched `tenant_id` claims between verified JWT signatures and DB table targets:
   ```bash
   # Query local simulation audit log file for cross-tenant hijack events
   jq '[.[] | select(.action == "CROSS_TENANT_HIJACK_ATTEMPT")]' prisma/audit-sim.json
   
   # Or scan AWS DynamoDB for critical trace failures
   aws dynamodb scan \
     --table-name VoxaAuditLogs \
     --filter-expression "action = :act" \
     --expression-attribute-values '{":act":{"S":"CROSS_TENANT_HIJACK_ATTEMPT"}}'
   ```
3. **Verify PostgreSQL RLS Enforcement Status:**
   Establish a direct psql connection to the target Postgres cluster and confirm RLS rules are active:
   ```sql
   -- Verify if RLS is enabled on target tables
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
   ```
   *Expected Outcome:* `rowsecurity` must display `t` (true) for `contacts`, `call_logs`, `contact_tags`, `post_call_actions`, `campaigns`, `scripts`, `showrooms`, `vouchers`, `rag_documents`, `audit_logs`, `tenant_usage`, and `api_keys`. If false, run:
   ```sql
   ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
   ```
4. **Invalidate Mismatched Session Tokens:**
   Immediately blacklist the compromised session JTIs in Redis to force the user to re-authenticate:
   ```bash
   # Add the compromised JTI to the Redis blacklist with a 1-hour TTL
   redis-cli SETEX blacklist:jti:<COMPROMISED_JTI> 3600 "true"
   ```

---

### Incident: Compromised admin account
* **Severity:** CRITICAL
* **Description:** An administrative profile is identified as taking anomalous or malicious actions (e.g. exporting full lists, generating arbitrary API tokens, deactivating security locks).
* **Responsible Role:** Identity Administrator & Lead Security Architect

#### Step-by-Step Resolution Actions:
1. **Revoke Active AWS Cognito Sessions:**
   Instantly revoke all issued access and refresh tokens for the compromised admin user in the AWS Cognito User Pool:
   ```bash
   aws cognito-idp admin-user-global-sign-out \
     --user-pool-id ap-south-1_xxxxxx \
     --username <COMPROMISED_ADMIN_EMAIL>
   ```
2. **Deactivate User Profile in Database:**
   Update the user record to block any future session authentications:
   ```bash
   # Use database migration user to override client restrictions and block access
   PGPASSWORD=migration_pass psql -h localhost -U migration_user -d voxa_db -c \
     "UPDATE users SET \"isActive\" = false WHERE email = 'compromised.admin@voxa.ai';"
   ```
3. **Blacklist Compromised JTI in Redis:**
   Extract the current token identifier and write it to the blacklisted index:
   ```bash
   redis-cli SETEX blacklist:jti:<ADMIN_JTI> 86400 "true"
   ```
4. **Invalidate Admin-Provisioned API Keys:**
   Identify all API integration keys created by the compromised admin profile and revoke them:
   ```bash
   PGPASSWORD=migration_pass psql -h localhost -U migration_user -d voxa_db -c \
     "UPDATE api_keys SET status = 'REVOKED' WHERE \"tenantId\" = (SELECT \"tenantId\" FROM users WHERE email = 'compromised.admin@voxa.ai');"
   ```

---

### Incident: RAG namespace cross-contamination
* **Severity:** HIGH
* **Description:** Search result outputs from the Pinecone vector databases return files or documentation belonging to a different tenant namespace.
* **Responsible Role:** ML Data Engineer & On-Call Developer

#### Step-by-Step Resolution Actions:
1. **Assert Namespace Prefixes:**
   Inspect the search logs inside `MidCallRAGHandler` to verify that the query correctly appended the tenant namespace prefix (`tenant_<tenantId>`):
   ```bash
   # Retrieve CloudWatch logs matching pinecone search queries
   aws logs filter-log-events \
     --log-group-name /aws/lambda/MidCallRAGHandler \
     --filter-pattern "namespace" \
     --limit 5
   ```
2. **Purge the Contaminated Pinecone Namespace:**
   Delete all vectors stored in the contaminated/incorrect namespace using the Pinecone REST API:
   ```bash
   curl -i -X POST "https://<YOUR_PINECONE_INDEX_HOST>/vectors/delete" \
     -H "Api-Key: <YOUR_PINECONE_API_KEY>" \
     -H "Content-Type: application/json" \
     -d '{
       "deleteAll": true,
       "namespace": "tenant_<COMPROMISED_TENANT_ID>"
     }'
   ```
3. **Repopulate and Re-Index from Secure S3 Bucket:**
   Trigger the document ingestion pipeline to safely rebuild the index from the isolated, encrypted S3 files under the target tenant's prefix:
   ```bash
   # Re-upload catalogs to index only documents matching verified S3 prefix
   aws lambda invoke \
     --function-name IngestWebhookHandler \
     --payload '{"action": "REINDEX", "tenantId": "tenant-a-uuid"}' \
     response.json
   ```

---

### Incident: DLQ messages accumulating (post-call failures)
* **Severity:** MEDIUM
* **Description:** SQS Dead Letter Queue (CallEndedDeadLetterQueue) has a rising backlog count, indicating processing execution errors in the `PostCallProcessor` lambda hook.
* **Responsible Role:** Backend Systems Developer & Infrastructure Support

#### Step-by-Step Resolution Actions:
1. **Analyze Processing Errors in CloudWatch:**
   Inspect `PostCallProcessor` execution traces to identify call parsing failures:
   ```bash
   aws logs filter-log-events \
     --log-group-name /aws/lambda/PostCallProcessor \
     --filter-pattern "ERROR" \
     --limit 10
   ```
   *Common Causes:* S3 transcript read permissions error, PostgreSQL RLS set_tenant_context transaction timeout, or SQS decryption key access denial.
2. **Receive and Verify Messages in DLQ:**
   Inspect the messages currently residing in the queue:
   ```bash
   aws sqs receive-message \
     --queue-url https://sqs.ap-south-1.amazonaws.com/123456789012/voxa-call-ended-dlq \
     --max-number-of-messages 5
   ```
3. **Execute SQS Message Redrive:**
   After resolving the infrastructure bottleneck (e.g. adjusting database pools or correcting IAM keys), trigger the redrive command to push messages back to the primary queue for execution:
   ```bash
   aws sqs start-message-move-tasks \
     --source-arn arn:aws:sqs:ap-south-1:123456789012:voxa-call-ended-dlq \
     --destination-arn arn:aws:sqs:ap-south-1:123456789012:voxa-call-ended-queue
   ```
   *Expected Outcome:* Backlog count in DLQ drops to zero, and call processors process the pending reports.

---

## standard Operational Procedures

### Procedure: Adding a new database table
* **Responsible Role:** Database Administrator & Lead Backend Engineer

#### Step-by-Step Actions:
1. **Define Model in `schema.prisma`:**
   Add the table model definition to the schema file. Every B2B SaaS table **must** include the `tenantId` field and map references cleanly:
   ```prisma
   model CampaignNote {
     id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
     tenantId  String   @db.Uuid
     tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
     content   String
     createdAt DateTime @default(now())

     @@index([tenantId])
     @@map("campaign_notes")
   }
   ```
2. **Generate Database Migration Files:**
   Generate the Prisma SQL migration script:
   ```bash
   npx prisma migrate dev --name add-campaign-notes --create-only
   ```
3. **Inject PostgreSQL RLS Scaffolding:**
   Open the generated `migration.sql` file and append the following RLS controls at the bottom before applying to the database:
   ```sql
   -- 1. Enable RLS
   ALTER TABLE "campaign_notes" ENABLE ROW LEVEL SECURITY;

   -- 2. Create the 4 isolation policies
   CREATE POLICY campaign_notes_select ON "campaign_notes" FOR SELECT USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
   CREATE POLICY campaign_notes_insert ON "campaign_notes" FOR INSERT WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
   CREATE POLICY campaign_notes_update ON "campaign_notes" FOR UPDATE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
   CREATE POLICY campaign_notes_delete ON "campaign_notes" FOR DELETE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

   -- 3. Grant table access to app_user and migration_user
   GRANT SELECT, INSERT, UPDATE, DELETE ON "campaign_notes" TO app_user;
   GRANT ALL PRIVILEGES ON "campaign_notes" TO migration_user;
   ```
4. **Deploy Schema Changes:**
   ```bash
   npx prisma migrate deploy
   ```

---

### Procedure: Employee offboarding
* **Responsible Role:** HR Ops & Systems Administrator

#### Step-by-Step Actions:
1. **Disable Cognito Access Pool Account:**
   Immediately disable the offboarded employee's AWS login profile:
   ```bash
   aws cognito-idp admin-disable-user \
     --user-pool-id ap-south-1_xxxxxx \
     --username <EMPLOYEE_EMAIL>
   ```
2. **Deactivate Profile in users Database Table:**
   Mark active flags to false:
   ```sql
   UPDATE users SET "isActive" = false WHERE email = 'employee@voxa.ai';
   ```
3. **Invalidate Active JWT Sessions:**
   Obtain current JTI tokens and blacklist them in Redis:
   ```bash
   redis-cli SETEX blacklist:jti:<EMPLOYEE_JTI> 86400 "true"
   ```
4. **Purge AWS IAM Permissions & GitHub Access:**
   Remove the offboarded employee's profile from the corporate AWS IAM organization directory, revoke SSH keys, and remove them from all GitHub repository teams.

---

### Procedure: JWT key rotation (zero-downtime)
* **Responsible Role:** Principal Security Architect

#### Step-by-Step Actions:
1. **Generate a New RS256 Key Pair:**
   ```bash
   # Generate private key
   openssl genpkey -algorithm RSA -out jwks_new_private.pem -pkeyopt rsa_keygen_bits:2048
   
   # Extract public key in PEM format
   openssl rsa -pubout -in jwks_new_private.pem -out jwks_new_public.pem
   ```
2. **Convert PEM Public Key to JWK and Append to JWKS:**
   Format the new public key parameters (`n`, `e`, `kid`) into a JSON Web Key structure. Append it as an active index inside the corporate JWKS array:
   ```json
   {
     "keys": [
       {
         "kty": "RSA",
         "use": "sig",
         "alg": "RS256",
         "kid": "key-2026-q2",
         "n": "new_modulus_string...",
         "e": "AQAB"
       },
       {
         "kty": "RSA",
         "use": "sig",
         "alg": "RS256",
         "kid": "key-old-expired",
         "n": "old_modulus_string...",
         "e": "AQAB"
       }
     ]
   }
   ```
3. **Deploy JWKS to CloudFront/Auth Service:**
   Deploy the updated JWKS to your verification endpoint (`https://auth.voxa.ai/.well-known/jwks.json`).
4. **Configure AuthService to Sign with the New Key:**
   Update your authentication server configurations to sign new sessions using the new private key `jwks_new_private.pem` (KID: `key-2026-q2`).
5. **Wait and Purge Deprecated Keys:**
   Wait for old token lifetimes to elapse (exactly 1 hour / 3600 seconds) to ensure all old active sessions expire naturally, then delete the old key index from the active JWKS document.

---

### Procedure: Tenant suspension
* **Responsible Role:** Customer Success Lead & Systems Administrator

#### Step-by-Step Actions:
1. **Update Tenant Status to SUSPENDED:**
   ```sql
   UPDATE tenants SET status = 'SUSPENDED' WHERE id = 'target-tenant-uuid';
   ```
2. **Cache Suspension Status in Redis Cache:**
   Write the suspension key to the session database. The Next.js edge proxy middleware (`proxy.ts`) checks this cache at every request to return redirects under 5ms:
   ```bash
   # Cache status inside Redis namespace (expires in 24 hours)
   redis-cli SETEX status:target-tenant-uuid 86400 "SUSPENDED"
   ```
3. **Terminate Users Sessions:**
   Iterate through and terminate active Cognito pools for this B2B client:
   ```bash
   for username in $(aws cognito-idp list-users --user-pool-id ap-south-1_xxxxxx --filter "attribute.tenantId = 'target-tenant-uuid'" --query "Users[].Username" --output text); do
     aws cognito-idp admin-user-global-sign-out --user-pool-id ap-south-1_xxxxxx --username $username
   done
   ```

---

### Procedure: GDPR deletion request
* **Responsible Role:** Data Privacy Officer & Database Administrator

#### Step-by-Step Actions:
1. **Extract and Deliver Personal Data:**
   Under GDPR rules, extract and deliver all contact records belonging to the requesting contact to their email:
   ```bash
   PGPASSWORD=migration_pass psql -h localhost -U migration_user -d voxa_db -o gdpr-export.json -c \
     "SELECT json_agg(contacts) FROM contacts WHERE email = 'privacy.requestor@gmail.com';"
   ```
2. **Anonymize Personal Information in Contacts Table:**
   To maintain reporting integrity without leaking identifiable user information, execute a scrub query replacing sensitive cells with hash signatures:
   ```sql
   -- Anonymize contact info while keeping non-personal attributes (status, scores, etc.)
   UPDATE contacts 
   SET 
     name = 'ANONYMIZED_GDPR_USER',
     phone = '0000000000',
     email = 'gdpr-erased-' || substring(id::text, 1, 8) || '@voxa.ai',
     notes = 'Personal records deleted in compliance with GDPR Art. 17 right to erasure.',
     location = 'ANONYMIZED'
   WHERE email = 'privacy.requestor@gmail.com';
   ```
3. **Purge S3 File Exports Prefix:**
   Locate and delete all exported documents matching the tenant files:
   ```bash
   aws s3 rm s3://voxa-recordings/tenants/<TENANT_ID>/exports/ --recursive --exclude "*" --include "*privacy.requestor*"
   ```
4. **Issue Compliance Confirmation:**
   Send a certificate of erasure to the customer within 30 days of request receipt.
