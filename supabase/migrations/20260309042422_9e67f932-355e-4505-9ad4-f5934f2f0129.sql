
-- Dashboards table
CREATE TABLE public.dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 't1',
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on dashboards" ON public.dashboards
  FOR ALL USING ((tenant_id = get_user_tenant_id((auth.uid())::text)) OR (tenant_id = 't1'::text))
  WITH CHECK ((tenant_id = get_user_tenant_id((auth.uid())::text)) OR (tenant_id = 't1'::text));

-- Dashboard widgets table
CREATE TABLE public.dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id uuid NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  widget_type text NOT NULL DEFAULT 'metric_card',
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  order_index integer NOT NULL DEFAULT 0,
  col_span integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on dashboard_widgets" ON public.dashboard_widgets
  FOR ALL USING (EXISTS (SELECT 1 FROM dashboards d WHERE d.id = dashboard_widgets.dashboard_id AND ((d.tenant_id = get_user_tenant_id((auth.uid())::text)) OR (d.tenant_id = 't1'::text))))
  WITH CHECK (EXISTS (SELECT 1 FROM dashboards d WHERE d.id = dashboard_widgets.dashboard_id AND ((d.tenant_id = get_user_tenant_id((auth.uid())::text)) OR (d.tenant_id = 't1'::text))));

-- Reports table
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 't1',
  name text NOT NULL,
  module_id text NOT NULL,
  filters_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  group_by text NOT NULL DEFAULT '',
  metrics jsonb NOT NULL DEFAULT '[]'::jsonb,
  chart_type text NOT NULL DEFAULT 'bar',
  schedule_email text,
  schedule_cron text,
  is_dashboard_widget boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on reports" ON public.reports
  FOR ALL USING ((tenant_id = get_user_tenant_id((auth.uid())::text)) OR (tenant_id = 't1'::text))
  WITH CHECK ((tenant_id = get_user_tenant_id((auth.uid())::text)) OR (tenant_id = 't1'::text));

-- Indexes
CREATE INDEX idx_dashboard_widgets_dashboard_id ON public.dashboard_widgets(dashboard_id);
CREATE INDEX idx_reports_tenant_module ON public.reports(tenant_id, module_id);
