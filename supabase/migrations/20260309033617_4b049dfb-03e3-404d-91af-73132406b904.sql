-- Add soft-delete to crm_records
ALTER TABLE public.crm_records ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Create record_tags table
CREATE TABLE public.record_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES public.crm_records(id) ON DELETE CASCADE,
  tag text NOT NULL,
  color text NOT NULL DEFAULT 'blue',
  tenant_id text NOT NULL DEFAULT 't1',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(record_id, tag)
);

ALTER TABLE public.record_tags ENABLE ROW LEVEL SECURITY;

-- RLS: use security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

CREATE POLICY "Tenant isolation on record_tags" ON public.record_tags
  FOR ALL USING (tenant_id = public.get_user_tenant_id(auth.uid()::text))
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()::text));

CREATE POLICY "Public read record_tags" ON public.record_tags
  FOR SELECT USING (true);

-- Update crm_records RLS to use the function too  
DROP POLICY IF EXISTS "Service role full access on crm_records" ON public.crm_records;

CREATE POLICY "Tenant access on crm_records" ON public.crm_records
  FOR ALL USING (tenant_id = public.get_user_tenant_id(auth.uid()::text) OR tenant_id = 't1')
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()::text) OR tenant_id = 't1');

-- Index for faster queries
CREATE INDEX idx_crm_records_module ON public.crm_records(module_id, tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_record_tags_record ON public.record_tags(record_id);