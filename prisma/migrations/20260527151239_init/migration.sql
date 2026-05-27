-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('PROVISIONING', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('STARTER', 'GROWTH', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SALES_AGENT', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'QUEUED', 'CALLED', 'BOOKED', 'CONVERTED', 'DND', 'DELETION_REQUESTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TagSource" AS ENUM ('AI_EXTRACTED', 'MANUAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CallOutcome" AS ENUM ('BOOKED', 'CALLBACK_REQUESTED', 'THINKING', 'NOT_INTERESTED', 'DND', 'NO_ANSWER', 'VOICEMAIL', 'ESCALATED', 'ERROR');

-- CreateEnum
CREATE TYPE "PostCallActionType" AS ENUM ('WHATSAPP_SHOWROOM', 'WHATSAPP_PORTFOLIO', 'SMS_OFFER', 'VOUCHER_SENT', 'CALLBACK_SCHEDULED', 'SALESPERSON_ALERT');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('WHATSAPP', 'SMS', 'EMAIL', 'INTERNAL');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_LOGIN', 'USER_LOGOUT', 'USER_LOGIN_FAILED', 'USER_INVITED', 'USER_DEACTIVATED', 'TOKEN_REVOKED', 'USER_ROLE_CHANGED', 'CONTACT_VIEWED', 'CONTACT_CREATED', 'CONTACT_UPDATED', 'CONTACT_DELETED', 'CONTACT_EXPORTED', 'CONTACTS_BULK_IMPORTED', 'CALL_INITIATED', 'CALL_COMPLETED', 'CALL_RECORDING_ACCESSED', 'CALL_TRANSCRIPT_ACCESSED', 'CAMPAIGN_CREATED', 'CAMPAIGN_LAUNCHED', 'CAMPAIGN_PAUSED', 'CAMPAIGN_DELETED', 'PRESIGNED_URL_GENERATED', 'DATA_EXPORT_REQUESTED', 'SENSITIVE_FIELD_ACCESSED', 'SKILL_PACK_UPLOADED', 'RAG_REINDEX_TRIGGERED', 'TENANT_SETTINGS_CHANGED', 'RATE_LIMIT_EXCEEDED', 'UNAUTHORIZED_TENANT_ACCESS_ATTEMPT', 'INVALID_TOKEN_USED');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'STARTER',
    "status" "TenantStatus" NOT NULL DEFAULT 'PROVISIONING',
    "customDomain" TEXT,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cognitoSub" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'SALES_AGENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" UUID NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "status" "ContactStatus" NOT NULL DEFAULT 'NEW',
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "bhkType" TEXT,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "assignedAgentId" UUID,
    "assignedShowroomId" UUID,
    "importedFrom" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contactId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "tagKey" TEXT NOT NULL,
    "tagValue" TEXT NOT NULL,
    "source" "TagSource" NOT NULL DEFAULT 'AI_EXTRACTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "campaignId" UUID,
    "callSid" TEXT,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "sentimentScore" DOUBLE PRECISION,
    "intentScore" INTEGER,
    "outcomeType" "CallOutcome" NOT NULL DEFAULT 'NO_ANSWER',
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "transcript" TEXT,
    "transcriptSummary" TEXT,
    "extractedEntities" JSONB,
    "objectionsRaised" JSONB,
    "recordingS3Path" TEXT,
    "assignedAgentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_call_actions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "callLogId" UUID,
    "actionType" "PostCallActionType" NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "contentSnapshot" JSONB,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_call_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "scriptId" UUID,
    "skillPackId" UUID,
    "maxConcurrency" INTEGER NOT NULL DEFAULT 5,
    "dailyStartTime" TEXT NOT NULL DEFAULT '09:00',
    "dailyEndTime" TEXT NOT NULL DEFAULT '21:00',
    "retryUnanswered" BOOLEAN NOT NULL DEFAULT true,
    "retryDelayHours" INTEGER NOT NULL DEFAULT 2,
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scripts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "sections" JSONB NOT NULL,
    "systemPrompt" TEXT,
    "guardrails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "showrooms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "phone" TEXT,
    "operatingHours" JSONB,
    "servicePincodes" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "showrooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "contactId" UUID,
    "campaignId" UUID,
    "discountType" TEXT NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "redeemedByAgentId" UUID,
    "revenueAttributed" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_packs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_skill_packs" (
    "tenantId" UUID NOT NULL,
    "skillPackId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customConfig" JSONB,
    "indexedAt" TIMESTAMP(3),
    "vectorCount" INTEGER NOT NULL DEFAULT 0,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_skill_packs_pkey" PRIMARY KEY ("tenantId","skillPackId")
);

-- CreateTable
CREATE TABLE "rag_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "docType" TEXT NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "vectorCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "indexedAt" TIMESTAMP(3),
    "errorMsg" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rag_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "userId" UUID,
    "userEmail" TEXT,
    "userRole" TEXT,
    "action" "AuditAction" NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_usage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "callMinutes" DECIMAL(10,3) NOT NULL,
    "costCogs" DECIMAL(10,4) NOT NULL,
    "costBilled" DECIMAL(10,4) NOT NULL,
    "inputTokens" BIGINT NOT NULL DEFAULT 0,
    "outputTokens" BIGINT NOT NULL DEFAULT 0,
    "cacheHits" INTEGER NOT NULL DEFAULT 0,
    "whatsappSent" INTEGER NOT NULL DEFAULT 0,
    "smsSent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "tenantId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_customDomain_key" ON "tenants"("customDomain");

-- CreateIndex
CREATE UNIQUE INDEX "users_cognitoSub_key" ON "users"("cognitoSub");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX "users_cognitoSub_idx" ON "users"("cognitoSub");

-- CreateIndex
CREATE INDEX "contacts_tenantId_idx" ON "contacts"("tenantId");

-- CreateIndex
CREATE INDEX "contacts_tenantId_status_idx" ON "contacts"("tenantId", "status");

-- CreateIndex
CREATE INDEX "contacts_tenantId_leadScore_idx" ON "contacts"("tenantId", "leadScore");

-- CreateIndex
CREATE INDEX "contacts_tenantId_assignedAgentId_idx" ON "contacts"("tenantId", "assignedAgentId");

-- CreateIndex
CREATE INDEX "contact_tags_tenantId_tagKey_tagValue_idx" ON "contact_tags"("tenantId", "tagKey", "tagValue");

-- CreateIndex
CREATE UNIQUE INDEX "contact_tags_contactId_tagKey_tagValue_key" ON "contact_tags"("contactId", "tagKey", "tagValue");

-- CreateIndex
CREATE INDEX "call_logs_tenantId_idx" ON "call_logs"("tenantId");

-- CreateIndex
CREATE INDEX "call_logs_tenantId_contactId_idx" ON "call_logs"("tenantId", "contactId");

-- CreateIndex
CREATE INDEX "call_logs_tenantId_createdAt_idx" ON "call_logs"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "call_logs_tenantId_leadScore_idx" ON "call_logs"("tenantId", "leadScore");

-- CreateIndex
CREATE INDEX "post_call_actions_tenantId_contactId_idx" ON "post_call_actions"("tenantId", "contactId");

-- CreateIndex
CREATE INDEX "campaigns_tenantId_idx" ON "campaigns"("tenantId");

-- CreateIndex
CREATE INDEX "campaigns_tenantId_status_idx" ON "campaigns"("tenantId", "status");

-- CreateIndex
CREATE INDEX "scripts_tenantId_idx" ON "scripts"("tenantId");

-- CreateIndex
CREATE INDEX "showrooms_tenantId_idx" ON "showrooms"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_code_key" ON "vouchers"("code");

-- CreateIndex
CREATE INDEX "vouchers_tenantId_idx" ON "vouchers"("tenantId");

-- CreateIndex
CREATE INDEX "vouchers_code_idx" ON "vouchers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "skill_packs_slug_key" ON "skill_packs"("slug");

-- CreateIndex
CREATE INDEX "tenant_skill_packs_tenantId_idx" ON "tenant_skill_packs"("tenantId");

-- CreateIndex
CREATE INDEX "rag_documents_tenantId_idx" ON "rag_documents"("tenantId");

-- CreateIndex
CREATE INDEX "rag_documents_tenantId_docType_idx" ON "rag_documents"("tenantId", "docType");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_createdAt_idx" ON "audit_logs"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_action_idx" ON "audit_logs"("tenantId", "action");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "tenant_usage_tenantId_periodStart_idx" ON "tenant_usage"("tenantId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_tenantId_idx" ON "api_keys"("tenantId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_assignedShowroomId_fkey" FOREIGN KEY ("assignedShowroomId") REFERENCES "showrooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_tags" ADD CONSTRAINT "contact_tags_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_call_actions" ADD CONSTRAINT "post_call_actions_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_call_actions" ADD CONSTRAINT "post_call_actions_callLogId_fkey" FOREIGN KEY ("callLogId") REFERENCES "call_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "scripts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scripts" ADD CONSTRAINT "scripts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showrooms" ADD CONSTRAINT "showrooms_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_skill_packs" ADD CONSTRAINT "tenant_skill_packs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_skill_packs" ADD CONSTRAINT "tenant_skill_packs_skillPackId_fkey" FOREIGN KEY ("skillPackId") REFERENCES "skill_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_usage" ADD CONSTRAINT "tenant_usage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row-Level Security (RLS) on multi-tenant tables
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "call_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contact_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "post_call_actions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "scripts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "showrooms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vouchers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rag_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_usage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "api_keys" ENABLE ROW LEVEL SECURITY;

-- 1. Contacts Policies
CREATE POLICY contacts_select ON "contacts" FOR SELECT USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY contacts_insert ON "contacts" FOR INSERT WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY contacts_update ON "contacts" FOR UPDATE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY contacts_delete ON "contacts" FOR DELETE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- 2. Call Logs Policies
CREATE POLICY call_logs_select ON "call_logs" FOR SELECT USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY call_logs_insert ON "call_logs" FOR INSERT WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY call_logs_update ON "call_logs" FOR UPDATE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY call_logs_delete ON "call_logs" FOR DELETE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- 3. Contact Tags Policies
CREATE POLICY contact_tags_select ON "contact_tags" FOR SELECT USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY contact_tags_insert ON "contact_tags" FOR INSERT WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY contact_tags_update ON "contact_tags" FOR UPDATE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY contact_tags_delete ON "contact_tags" FOR DELETE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- 4. Post Call Actions Policies
CREATE POLICY post_call_actions_select ON "post_call_actions" FOR SELECT USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY post_call_actions_insert ON "post_call_actions" FOR INSERT WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY post_call_actions_update ON "post_call_actions" FOR UPDATE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY post_call_actions_delete ON "post_call_actions" FOR DELETE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- 5. Campaigns Policies
CREATE POLICY campaigns_select ON "campaigns" FOR SELECT USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY campaigns_insert ON "campaigns" FOR INSERT WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY campaigns_update ON "campaigns" FOR UPDATE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY campaigns_delete ON "campaigns" FOR DELETE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- 6. Scripts Policies
CREATE POLICY scripts_select ON "scripts" FOR SELECT USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY scripts_insert ON "scripts" FOR INSERT WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY scripts_update ON "scripts" FOR UPDATE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY scripts_delete ON "scripts" FOR DELETE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- 7. Showrooms Policies
CREATE POLICY showrooms_select ON "showrooms" FOR SELECT USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY showrooms_insert ON "showrooms" FOR INSERT WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY showrooms_update ON "showrooms" FOR UPDATE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY showrooms_delete ON "showrooms" FOR DELETE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- 8. Vouchers Policies
CREATE POLICY vouchers_select ON "vouchers" FOR SELECT USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY vouchers_insert ON "vouchers" FOR INSERT WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY vouchers_update ON "vouchers" FOR UPDATE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY vouchers_delete ON "vouchers" FOR DELETE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- 9. RAG Documents Policies
CREATE POLICY rag_documents_select ON "rag_documents" FOR SELECT USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY rag_documents_insert ON "rag_documents" FOR INSERT WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY rag_documents_update ON "rag_documents" FOR UPDATE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY rag_documents_delete ON "rag_documents" FOR DELETE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- 10. Audit Logs Policies
CREATE POLICY audit_logs_select ON "audit_logs" FOR SELECT USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY audit_logs_insert ON "audit_logs" FOR INSERT WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY audit_logs_update ON "audit_logs" FOR UPDATE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY audit_logs_delete ON "audit_logs" FOR DELETE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- 11. Tenant Usage Policies
CREATE POLICY tenant_usage_select ON "tenant_usage" FOR SELECT USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY tenant_usage_insert ON "tenant_usage" FOR INSERT WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY tenant_usage_update ON "tenant_usage" FOR UPDATE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY tenant_usage_delete ON "tenant_usage" FOR DELETE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- 12. API Keys Policies
CREATE POLICY api_keys_select ON "api_keys" FOR SELECT USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY api_keys_insert ON "api_keys" FOR INSERT WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY api_keys_update ON "api_keys" FOR UPDATE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY api_keys_delete ON "api_keys" FOR DELETE USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- ─── IMMUTABILITY TRIGGER ON AUDIT LOGS ─────────────────
CREATE OR REPLACE FUNCTION protect_audit_logs()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_protect_audit_logs
BEFORE UPDATE OR DELETE ON "audit_logs"
FOR EACH ROW
EXECUTE FUNCTION protect_audit_logs();

-- ─── DATABASE ROLES & ACCESS PROVISIONS ─────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user WITH NOSUPERUSER NOCREATEDB NOCREATEROLE LOGIN;
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'migration_user') THEN
    CREATE ROLE migration_user WITH NOSUPERUSER NOCREATEDB NOCREATEROLE LOGIN BYPASSRLS;
  END IF;
END
$$;
