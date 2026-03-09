import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { EmailAccount, SyncedEmail, EmailThread, EmailAttachment } from '@/lib/email-sync-types';
import { useToast } from '@/hooks/use-toast';

export function useEmailAccounts() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await api.get('/api/email_accounts');
    if (error) toast({ title: 'Error', description: (error as any).message, variant: 'destructive' });
    else setAccounts((data || []) as EmailAccount[]);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const connectAccount = useCallback(
    async (provider: 'gmail' | 'outlook') => {
      toast({
        title: 'Email connection',
        description: 'Configure OAuth for ' + provider + ' in the server (e.g. POST /api/email/connect).',
      });
    },
    [toast]
  );

  const disconnectAccount = useCallback(
    async (accountId: string) => {
      const { error } = await api.patch(`/api/email_accounts/${accountId}`, { is_active: false });
      if (error) toast({ title: 'Error', description: (error as any).message, variant: 'destructive' });
      else {
        toast({ title: 'Disconnected', description: 'Email account disconnected.' });
        fetchAccounts();
      }
    },
    [toast, fetchAccounts]
  );

  const syncNow = useCallback(
    async (accountId: string) => {
      toast({ title: 'Syncing...', description: 'Configure email sync in the server (e.g. POST /api/email/sync).' });
      fetchAccounts();
    },
    [toast, fetchAccounts]
  );

  return { accounts, loading, connectAccount, disconnectAccount, syncNow, refetch: fetchAccounts };
}

export function useEmails(accountId?: string) {
  const [emails, setEmails] = useState<SyncedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchEmails = useCallback(async () => {
    if (!accountId) {
      setEmails([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await api.get('/api/emails', { account_id: accountId });
    if (error) toast({ title: 'Error', description: (error as any).message, variant: 'destructive' });
    else setEmails((data || []) as SyncedEmail[]);
    setLoading(false);
  }, [accountId, toast]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const filteredEmails = emails.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (e.subject || '').toLowerCase().includes(q) ||
      (e.from_email || '').toLowerCase().includes(q) ||
      (e.body_text || '').toLowerCase().includes(q) ||
      (Array.isArray(e.to_emails) && (e.to_emails as string[]).some((t: string) => t.toLowerCase().includes(q)))
    );
  });

  const markRead = useCallback(async (emailId: string) => {
    await api.patch(`/api/emails/${emailId}`, { is_read: true });
    setEmails((prev) => prev.map((e) => (e.id === emailId ? { ...e, is_read: true } : e)));
  }, []);

  const toggleStar = useCallback(async (emailId: string) => {
    const email = emails.find((e) => e.id === emailId);
    if (!email) return;
    const newVal = !email.is_starred;
    await api.patch(`/api/emails/${emailId}`, { is_starred: newVal });
    setEmails((prev) => prev.map((e) => (e.id === emailId ? { ...e, is_starred: newVal } : e)));
  }, [emails]);

  const deleteEmail = useCallback(
    async (emailId: string) => {
      const { error } = await api.delete(`/api/emails/${emailId}`);
      if (!error) {
        setEmails((prev) => prev.filter((e) => e.id !== emailId));
        toast({ title: 'Deleted', description: 'Email deleted.' });
      }
    },
    [toast]
  );

  const threads = groupIntoThreads(filteredEmails);

  return {
    emails: filteredEmails,
    threads,
    loading,
    searchQuery,
    setSearchQuery,
    markRead,
    toggleStar,
    deleteEmail,
    refetch: fetchEmails,
  };
}

function groupIntoThreads(emails: SyncedEmail[]): EmailThread[] {
  const threadMap = new Map<string, SyncedEmail[]>();
  for (const email of emails) {
    const key = (email as any).thread_id || email.id;
    if (!threadMap.has(key)) threadMap.set(key, []);
    threadMap.get(key)!.push(email);
  }
  return Array.from(threadMap.entries())
    .map(([thread_id, threadEmails]) => {
      threadEmails.sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
      const participants = new Set<string>();
      threadEmails.forEach((e) => {
        participants.add(e.from_email);
        (e.to_emails || []).forEach((t: string) => participants.add(t));
      });
      return {
        thread_id,
        subject: threadEmails[0].subject,
        emails: threadEmails,
        last_email_at: threadEmails[threadEmails.length - 1].sent_at,
        participant_emails: Array.from(participants),
      };
    })
    .sort((a, b) => new Date(b.last_email_at).getTime() - new Date(a.last_email_at).getTime());
}

export function useSendEmail() {
  const { toast } = useToast();
  const sendEmail = useCallback(
    async (params: {
      account_id: string;
      to: string[];
      cc?: string[];
      subject: string;
      body_html: string;
      body_text: string;
      thread_id?: string;
    }) => {
      toast({ title: 'Email', description: 'Configure send-email in the server (e.g. POST /api/email/send).' });
      return null;
    },
    [toast]
  );
  return { sendEmail };
}

export function useEmailAttachments(emailId: string) {
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  useEffect(() => {
    if (!emailId) return;
    api.get('/api/email_attachments', { email_id: emailId }).then(({ data }) => {
      setAttachments((data || []) as EmailAttachment[]);
    });
  }, [emailId]);
  return { attachments };
}
