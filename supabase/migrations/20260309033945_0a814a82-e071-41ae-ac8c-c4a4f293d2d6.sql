
-- Create pipelines table
CREATE TABLE public.pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 't1',
  module_id text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on pipelines" ON public.pipelines
  FOR ALL USING (tenant_id = public.get_user_tenant_id(auth.uid()::text) OR tenant_id = 't1')
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()::text) OR tenant_id = 't1');

CREATE POLICY "Public read pipelines" ON public.pipelines
  FOR SELECT USING (true);

-- Create pipeline_stages table
CREATE TABLE public.pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6B7280',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on pipeline_stages" ON public.pipeline_stages
  FOR ALL USING (EXISTS (SELECT 1 FROM public.pipelines p WHERE p.id = pipeline_stages.pipeline_id AND (p.tenant_id = public.get_user_tenant_id(auth.uid()::text) OR p.tenant_id = 't1')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pipelines p WHERE p.id = pipeline_stages.pipeline_id AND (p.tenant_id = public.get_user_tenant_id(auth.uid()::text) OR p.tenant_id = 't1')));

CREATE POLICY "Public read pipeline_stages" ON public.pipeline_stages
  FOR SELECT USING (true);

-- Indexes
CREATE INDEX idx_pipelines_module ON public.pipelines(module_id, tenant_id);
CREATE INDEX idx_pipeline_stages_pipeline ON public.pipeline_stages(pipeline_id, position);
