
-- Fix email_record_links RLS to check tenant via parent email
DROP POLICY "Allow all on email_record_links" ON public.email_record_links;
CREATE POLICY "Tenant isolation on email_record_links"
  ON public.email_record_links FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.emails e WHERE e.id = email_record_links.email_id AND e.tenant_id = 't1'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.emails e WHERE e.id = email_record_links.email_id AND e.tenant_id = 't1'
  ));

-- Fix email_attachments RLS to check tenant via parent email
DROP POLICY "Allow all on email_attachments" ON public.email_attachments;
CREATE POLICY "Tenant isolation on email_attachments"
  ON public.email_attachments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.emails e WHERE e.id = email_attachments.email_id AND e.tenant_id = 't1'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.emails e WHERE e.id = email_attachments.email_id AND e.tenant_id = 't1'
  ));
