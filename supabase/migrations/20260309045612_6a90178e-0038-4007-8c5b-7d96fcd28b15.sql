
-- Fix modules: replace inline profiles subquery with security definer function
DROP POLICY IF EXISTS "Tenant isolation on modules" ON public.modules;
CREATE POLICY "Tenant isolation on modules" ON public.modules
  FOR ALL
  USING ((tenant_id = get_user_tenant_id((auth.uid())::text)) OR (tenant_id = 't1'::text))
  WITH CHECK ((tenant_id = get_user_tenant_id((auth.uid())::text)) OR (tenant_id = 't1'::text));

-- Fix module_fields
DROP POLICY IF EXISTS "Tenant isolation on module_fields" ON public.module_fields;
CREATE POLICY "Tenant isolation on module_fields" ON public.module_fields
  FOR ALL
  USING ((tenant_id = get_user_tenant_id((auth.uid())::text)) OR (tenant_id = 't1'::text))
  WITH CHECK ((tenant_id = get_user_tenant_id((auth.uid())::text)) OR (tenant_id = 't1'::text));

-- Fix module_relationships
DROP POLICY IF EXISTS "Tenant isolation on module_relationships" ON public.module_relationships;
CREATE POLICY "Tenant isolation on module_relationships" ON public.module_relationships
  FOR ALL
  USING ((tenant_id = get_user_tenant_id((auth.uid())::text)) OR (tenant_id = 't1'::text))
  WITH CHECK ((tenant_id = get_user_tenant_id((auth.uid())::text)) OR (tenant_id = 't1'::text));
