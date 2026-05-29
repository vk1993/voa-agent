-- Add set_tenant_context function to enforce RLS
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id uuid)
RETURNS void AS $$
BEGIN
  -- We set is_local to true so this configuration is scoped 
  -- only to the current transaction. This prevents leakage 
  -- across connection pooling in Prisma.
  PERFORM set_config('app.current_tenant_id', tenant_id::text, true);
END;
$$ LANGUAGE plpgsql;