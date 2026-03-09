-- Modules table
CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 't1',
  name text NOT NULL,
  slug text NOT NULL,
  icon text NOT NULL DEFAULT 'Boxes',
  color text NOT NULL DEFAULT '#7C3AED',
  description text NOT NULL DEFAULT '',
  is_system boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on modules" ON public.modules
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()::text))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()::text));

-- Allow anon/service access for now (no auth yet fully wired)
CREATE POLICY "Public read modules" ON public.modules
  FOR SELECT USING (true);

-- Fields table
CREATE TABLE public.module_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  tenant_id text NOT NULL DEFAULT 't1',
  name text NOT NULL,
  label text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  is_required boolean NOT NULL DEFAULT false,
  options_json jsonb DEFAULT '[]'::jsonb,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.module_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on module_fields" ON public.module_fields
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()::text))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()::text));

CREATE POLICY "Public read module_fields" ON public.module_fields
  FOR SELECT USING (true);

-- Module relationships table  
CREATE TABLE public.module_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 't1',
  from_module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  to_module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  relationship_type text NOT NULL DEFAULT 'one_to_many',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.module_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on module_relationships" ON public.module_relationships
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()::text))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()::text));

CREATE POLICY "Public read module_relationships" ON public.module_relationships
  FOR SELECT USING (true);

-- Indexes
CREATE INDEX idx_modules_tenant ON public.modules(tenant_id);
CREATE INDEX idx_module_fields_module ON public.module_fields(module_id);
CREATE INDEX idx_module_relationships_from ON public.module_relationships(from_module_id);
CREATE INDEX idx_module_relationships_to ON public.module_relationships(to_module_id);