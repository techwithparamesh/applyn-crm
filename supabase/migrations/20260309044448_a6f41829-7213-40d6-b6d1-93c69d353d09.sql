
CREATE TABLE public.installed_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 't1',
  template_slug text NOT NULL,
  template_name text NOT NULL,
  installed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.installed_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on installed_templates" ON public.installed_templates
  FOR ALL USING ((tenant_id = get_user_tenant_id((auth.uid())::text)) OR (tenant_id = 't1'::text))
  WITH CHECK ((tenant_id = get_user_tenant_id((auth.uid())::text)) OR (tenant_id = 't1'::text));

CREATE UNIQUE INDEX idx_installed_templates_unique ON public.installed_templates(tenant_id, template_slug);
