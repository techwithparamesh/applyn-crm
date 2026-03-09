
-- Roles table
CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 't1',
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on roles"
  ON public.roles FOR ALL
  USING (tenant_id = 't1')
  WITH CHECK (tenant_id = 't1');

-- Permissions reference table
CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name text NOT NULL,
  action text NOT NULL CHECK (action IN ('view', 'create', 'edit', 'delete', 'export', 'import')),
  UNIQUE (module_name, action)
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read permissions"
  ON public.permissions FOR SELECT
  USING (true);

-- Seed permissions for existing modules
INSERT INTO public.permissions (module_name, action)
SELECT module, act
FROM unnest(ARRAY['leads', 'contacts', 'deals', 'tasks', 'companies']) AS module,
     unnest(ARRAY['view', 'create', 'edit', 'delete', 'export', 'import']) AS act;

-- Role permissions junction
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  module_name text NOT NULL,
  action text NOT NULL CHECK (action IN ('view', 'create', 'edit', 'delete', 'export', 'import')),
  UNIQUE (role_id, module_name, action)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on role_permissions"
  ON public.role_permissions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.roles WHERE id = role_permissions.role_id AND tenant_id = 't1')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.roles WHERE id = role_permissions.role_id AND tenant_id = 't1')
  );

-- User roles junction
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  tenant_id text NOT NULL DEFAULT 't1',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on user_roles"
  ON public.user_roles FOR ALL
  USING (tenant_id = 't1')
  WITH CHECK (tenant_id = 't1');

-- Security definer function for permission checks (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.check_permission(
  _user_id text,
  _module_name text,
  _action text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    WHERE ur.user_id = _user_id
      AND rp.module_name = _module_name
      AND rp.action = _action
  )
$$;

-- Seed default roles
INSERT INTO public.roles (tenant_id, name, description) VALUES
  ('t1', 'Admin', 'Full access to all modules'),
  ('t1', 'Sales Manager', 'Manage leads, deals, and contacts'),
  ('t1', 'Sales Rep', 'View and create leads and deals'),
  ('t1', 'Viewer', 'Read-only access to all modules');

-- Seed admin role permissions (all permissions)
INSERT INTO public.role_permissions (role_id, module_name, action)
SELECT r.id, p.module_name, p.action
FROM public.roles r, public.permissions p
WHERE r.name = 'Admin' AND r.tenant_id = 't1';

-- Seed Sales Manager permissions
INSERT INTO public.role_permissions (role_id, module_name, action)
SELECT r.id, module, act
FROM public.roles r,
     unnest(ARRAY['leads', 'contacts', 'deals']) AS module,
     unnest(ARRAY['view', 'create', 'edit', 'delete']) AS act
WHERE r.name = 'Sales Manager' AND r.tenant_id = 't1';

-- Seed Sales Rep permissions
INSERT INTO public.role_permissions (role_id, module_name, action)
SELECT r.id, module, act
FROM public.roles r,
     unnest(ARRAY['leads', 'deals']) AS module,
     unnest(ARRAY['view', 'create']) AS act
WHERE r.name = 'Sales Rep' AND r.tenant_id = 't1';

-- Seed Viewer permissions (view only)
INSERT INTO public.role_permissions (role_id, module_name, action)
SELECT r.id, p.module_name, p.action
FROM public.roles r, public.permissions p
WHERE r.name = 'Viewer' AND r.tenant_id = 't1' AND p.action = 'view';

-- Assign Admin role to default user
INSERT INTO public.user_roles (user_id, role_id, tenant_id)
SELECT 'user-1', r.id, 't1'
FROM public.roles r
WHERE r.name = 'Admin' AND r.tenant_id = 't1';
