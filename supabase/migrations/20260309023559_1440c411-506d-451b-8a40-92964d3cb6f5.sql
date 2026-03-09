
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_accounts_tenant_email ON public.email_accounts(tenant_id, email_address);
