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
