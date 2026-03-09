export type EmailProvider = 'gmail' | 'outlook';
export type EmailDirection = 'incoming' | 'outgoing';

export interface EmailAccount {
  id: string;
  tenant_id: string;
  user_id: string;
  provider: EmailProvider;
  email_address: string;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
}

export interface SyncedEmail {
  id: string;
  tenant_id: string;
  account_id: string;
  provider_message_id: string | null;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  from_email: string;
  to_emails: string[];
  cc_emails: string[];
  bcc_emails: string[];
  thread_id: string | null;
  direction: EmailDirection;
  is_read: boolean;
  is_starred: boolean;
  is_opened: boolean;
  opened_at: string | null;
  sent_at: string;
  synced_at: string;
  attachments?: EmailAttachment[];
  record_links?: EmailRecordLink[];
}

export interface EmailRecordLink {
  id: string;
  email_id: string;
  record_id: string;
  module_name: string;
  created_at: string;
}

export interface EmailAttachment {
  id: string;
  email_id: string;
  file_name: string;
  file_url: string | null;
  content_type: string | null;
  size: number;
  created_at: string;
}

export interface EmailThread {
  thread_id: string;
  subject: string;
  emails: SyncedEmail[];
  last_email_at: string;
  participant_emails: string[];
}
