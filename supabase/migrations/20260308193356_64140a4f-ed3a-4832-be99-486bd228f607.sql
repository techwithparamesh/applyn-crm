
-- API Keys table for tenant authentication
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 't1',
  key_name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE DEFAULT ('ak_' || encode(gen_random_bytes(24), 'hex')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- CRM Records table for API access
CREATE TABLE public.crm_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 't1',
  module_id TEXT NOT NULL,
  values JSONB NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL DEFAULT 'API',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS on these tables since they're accessed via API key auth in edge function
-- Edge function validates API key and scopes to tenant

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_records ENABLE ROW LEVEL SECURITY;

-- Allow edge functions (service role) full access
CREATE POLICY "Service role full access on api_keys" ON public.api_keys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on crm_records" ON public.crm_records FOR ALL USING (true) WITH CHECK (true);
