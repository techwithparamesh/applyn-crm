export type EmailDirection = 'sent' | 'received';

export type EmailProvider = 'gmail' | 'outlook' | 'none';

export interface Email {
  id: string;
  tenantId: string;
  recordId: string;
  subject: string;
  body: string;
  direction: EmailDirection;
  from: string;
  to: string;
  sentAt: string;
  isRead: boolean;
}

export interface EmailConnection {
  id: string;
  tenantId: string;
  provider: EmailProvider;
  email: string;
  isConnected: boolean;
  connectedAt: string;
}
