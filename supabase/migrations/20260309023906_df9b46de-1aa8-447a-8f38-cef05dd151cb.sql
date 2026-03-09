
CREATE TABLE public.automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 't1',
  name text NOT NULL,
  module_id text NOT NULL,
  trigger_event text NOT NULL DEFAULT 'record_created',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.automation_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  operator text NOT NULL DEFAULT 'equals',
  value text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.automation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on automations" ON public.automations FOR ALL USING (tenant_id = 't1') WITH CHECK (tenant_id = 't1');

CREATE POLICY "Tenant isolation on automation_conditions" ON public.automation_conditions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.automations a WHERE a.id = automation_conditions.automation_id AND a.tenant_id = 't1'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.automations a WHERE a.id = automation_conditions.automation_id AND a.tenant_id = 't1'));

CREATE POLICY "Tenant isolation on automation_actions" ON public.automation_actions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.automations a WHERE a.id = automation_actions.automation_id AND a.tenant_id = 't1'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.automations a WHERE a.id = automation_actions.automation_id AND a.tenant_id = 't1'));

CREATE INDEX idx_automations_tenant ON public.automations(tenant_id);
CREATE INDEX idx_automations_module ON public.automations(module_id);
CREATE INDEX idx_automation_conditions_automation ON public.automation_conditions(automation_id);
CREATE INDEX idx_automation_actions_automation ON public.automation_actions(automation_id);
