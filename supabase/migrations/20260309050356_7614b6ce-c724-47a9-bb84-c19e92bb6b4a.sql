
-- Fix infinite recursion on profiles table RLS
DROP POLICY IF EXISTS "Users can read own tenant profiles" ON public.profiles;
CREATE POLICY "Users can read own tenant profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id((auth.uid())::text) OR user_id = (auth.uid())::text);
