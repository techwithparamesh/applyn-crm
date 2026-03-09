
-- Email accounts table
CREATE TABLE public.email_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 't1',
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  email_address TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on email_accounts"
  ON public.email_accounts FOR ALL
  USING (tenant_id = 't1')
  WITH CHECK (tenant_id = 't1');

-- Emails table
CREATE TABLE public.emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 't1',
  account_id UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  provider_message_id TEXT,
  subject TEXT NOT NULL DEFAULT '',
  body_html TEXT,
  body_text TEXT,
  from_email TEXT NOT NULL,
  to_emails JSONB NOT NULL DEFAULT '[]'::jsonb,
  cc_emails JSONB NOT NULL DEFAULT '[]'::jsonb,
  bcc_emails JSONB NOT NULL DEFAULT '[]'::jsonb,
  thread_id TEXT,
  direction TEXT NOT NULL DEFAULT 'incoming' CHECK (direction IN ('incoming', 'outgoing')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_starred BOOLEAN NOT NULL DEFAULT false,
  is_opened BOOLEAN NOT NULL DEFAULT false,
  opened_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(account_id, provider_message_id)
);

ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on emails"
  ON public.emails FOR ALL
  USING (tenant_id = 't1')
  WITH CHECK (tenant_id = 't1');

-- Email to record links
CREATE TABLE public.email_record_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
  record_id TEXT NOT NULL,
  module_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_record_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on email_record_links"
  ON public.email_record_links FOR ALL
  USING (true)
  WITH CHECK (true);

-- Email attachments
CREATE TABLE public.email_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT,
  content_type TEXT,
  size INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on email_attachments"
  ON public.email_attachments FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for fast email search
CREATE INDEX idx_emails_thread_id ON public.emails(thread_id);
CREATE INDEX idx_emails_from ON public.emails(from_email);
CREATE INDEX idx_emails_account ON public.emails(account_id);
CREATE INDEX idx_emails_sent_at ON public.emails(sent_at DESC);
CREATE INDEX idx_email_record_links_record ON public.email_record_links(record_id);
CREATE INDEX idx_email_record_links_email ON public.email_record_links(email_id);
