import { useState, useCallback } from 'react';
import { Email, EmailConnection, EmailProvider } from '@/lib/email-types';
import { mockEmails, mockEmailConnection } from '@/lib/mock-emails';

export function useEmails(recordId: string) {
  const [emails, setEmails] = useState<Email[]>(
    mockEmails.filter((e) => e.recordId === recordId)
  );

  const sendEmail = useCallback((to: string, subject: string, body: string) => {
    const newEmail: Email = {
      id: `em-${Date.now()}`,
      tenantId: 't1',
      recordId,
      subject,
      body,
      direction: 'sent',
      from: mockEmailConnection.email,
      to,
      sentAt: new Date().toISOString(),
      isRead: true,
    };
    setEmails((prev) => [newEmail, ...prev]);
    return newEmail;
  }, [recordId]);

  return { emails, sendEmail };
}

export function useEmailConnection() {
  const [connection, setConnection] = useState<EmailConnection>(mockEmailConnection);

  const connect = useCallback((provider: EmailProvider, email: string) => {
    setConnection({
      id: `ec-${Date.now()}`,
      tenantId: 't1',
      provider,
      email,
      isConnected: true,
      connectedAt: new Date().toISOString(),
    });
  }, []);

  const disconnect = useCallback(() => {
    setConnection((prev) => ({ ...prev, isConnected: false, provider: 'none' }));
  }, []);

  return { connection, connect, disconnect };
}
