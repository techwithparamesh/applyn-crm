
CREATE TABLE public.import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 't1',
  module_id text NOT NULL,
  file_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  total_rows integer NOT NULL DEFAULT 0,
  processed_rows integer NOT NULL DEFAULT 0,
  success_rows integer NOT NULL DEFAULT 0,
  failed_rows integer NOT NULL DEFAULT 0,
  column_mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE public.import_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  row_data jsonb DEFAULT '{}'::jsonb,
  error_message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on import_jobs" ON public.import_jobs FOR ALL
  USING (tenant_id = 't1') WITH CHECK (tenant_id = 't1');

CREATE POLICY "Tenant isolation on import_errors" ON public.import_errors FOR ALL
  USING (EXISTS (SELECT 1 FROM public.import_jobs j WHERE j.id = import_errors.job_id AND j.tenant_id = 't1'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.import_jobs j WHERE j.id = import_errors.job_id AND j.tenant_id = 't1'));

CREATE INDEX idx_import_jobs_tenant ON public.import_jobs(tenant_id);
CREATE INDEX idx_import_errors_job ON public.import_errors(job_id);
