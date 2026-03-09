
-- Create automation_logs table
CREATE TABLE public.automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  record_id uuid REFERENCES public.crm_records(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'success',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  tenant_id text NOT NULL DEFAULT 't1',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on automation_logs" ON public.automation_logs
  FOR ALL USING (tenant_id = public.get_user_tenant_id(auth.uid()::text) OR tenant_id = 't1')
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()::text) OR tenant_id = 't1');

CREATE INDEX idx_automation_logs_automation ON public.automation_logs(automation_id);
CREATE INDEX idx_automation_logs_record ON public.automation_logs(record_id);
