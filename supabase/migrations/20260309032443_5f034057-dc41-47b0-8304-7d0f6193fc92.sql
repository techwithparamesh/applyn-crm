-- Create tenants table
CREATE TABLE public.tenants (
  id text PRIMARY KEY DEFAULT ('t_' || encode(extensions.gen_random_bytes(8), 'hex')),
  name text NOT NULL DEFAULT '',
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tenant" ON public.tenants
  FOR SELECT USING (
    id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "Owner can update tenant" ON public.tenants
  FOR UPDATE USING (owner_id = auth.uid());

-- Update profiles RLS for auth-based access
DROP POLICY IF EXISTS "Tenant isolation on profiles" ON public.profiles;

CREATE POLICY "Users can read own tenant profiles" ON public.profiles
  FOR SELECT USING (
    tenant_id IN (SELECT p2.tenant_id FROM public.profiles p2 WHERE p2.user_id = auth.uid()::text)
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Service can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _tenant_id text;
BEGIN
  INSERT INTO public.tenants (name, owner_id)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)) || '''s Workspace', NEW.id)
  RETURNING id INTO _tenant_id;

  INSERT INTO public.profiles (user_id, email, name, tenant_id)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    _tenant_id
  );

  RETURN NEW;
END;
$$;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();