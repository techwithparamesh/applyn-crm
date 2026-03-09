import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EmailAccount, SyncedEmail, EmailThread, EmailAttachment } from '@/lib/email-sync-types';
import { useToast } from '@/hooks/use-toast';

export function useEmailAccounts() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('email_accounts')
      .select('id, tenant_id, user_id, provider, email_address, is_active, last_sync_at, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setAccounts((data || []) as EmailAccount[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const connectAccount = useCallback(async (provider: 'gmail' | 'outlook') => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const redirectUri = `${window.location.origin}/email?connected=true`;

    // Call the connect-email edge function to get the OAuth URL
    const { data, error } = await supabase.functions.invoke('connect-email', {
      body: { provider, redirect_uri: redirectUri },
    });

    if (error) {
      toast({ title: 'Connection failed', description: error.message, variant: 'destructive' });
      return;
    }

    if (data?.auth_url) {
      window.location.href = data.auth_url;
    } else {
      toast({ title: 'Connection failed', description: 'No auth URL returned', variant: 'destructive' });
    }
  }, [toast]);

  const disconnectAccount = useCallback(async (accountId: string) => {
    const { error } = await supabase
      .from('email_accounts')
      .update({ is_active: false } as any)
      .eq('id', accountId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Disconnected', description: 'Email account disconnected.' });
      fetchAccounts();
    }
  }, [toast, fetchAccounts]);

  const syncNow = useCallback(async (accountId: string) => {
    toast({ title: 'Syncing...', description: 'Fetching new emails from your account.' });

    const { data, error } = await supabase.functions.invoke('sync-emails', {
      body: { account_id: accountId },
    });

    if (error) {
      toast({ title: 'Sync failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sync complete', description: `${data?.synced_count || 0} new emails synced.` });
      fetchAccounts();
    }
  }, [toast, fetchAccounts]);

  return { accounts, loading, connectAccount, disconnectAccount, syncNow, refetch: fetchAccounts };
}

export function useEmails(accountId?: string) {
  const [emails, setEmails] = useState<SyncedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('emails')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(200);

    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setEmails((data || []) as unknown as SyncedEmail[]);
    }
    setLoading(false);
  }, [accountId, toast]);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  const filteredEmails = emails.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.subject.toLowerCase().includes(q) ||
      e.from_email.toLowerCase().includes(q) ||
      (e.body_text || '').toLowerCase().includes(q) ||
      (e.to_emails || []).some((t: string) => t.toLowerCase().includes(q))
    );
  });

  const markRead = useCallback(async (emailId: string) => {
    await supabase.from('emails').update({ is_read: true } as any).eq('id', emailId);
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, is_read: true } : e));
  }, []);

  const toggleStar = useCallback(async (emailId: string) => {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;
    const newVal = !email.is_starred;
    await supabase.from('emails').update({ is_starred: newVal } as any).eq('id', emailId);
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, is_starred: newVal } : e));
  }, [emails]);

  const deleteEmail = useCallback(async (emailId: string) => {
    const { error } = await supabase.from('emails').delete().eq('id', emailId);
    if (!error) {
      setEmails(prev => prev.filter(e => e.id !== emailId));
      toast({ title: 'Deleted', description: 'Email deleted.' });
    }
  }, [toast]);

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
    const key = email.thread_id || email.id;
    if (!threadMap.has(key)) threadMap.set(key, []);
    threadMap.get(key)!.push(email);
  }

  return Array.from(threadMap.entries()).map(([thread_id, threadEmails]) => {
    threadEmails.sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
    const participants = new Set<string>();
    threadEmails.forEach(e => {
      participants.add(e.from_email);
      e.to_emails.forEach((t: string) => participants.add(t));
    });

    return {
      thread_id,
      subject: threadEmails[0].subject,
      emails: threadEmails,
      last_email_at: threadEmails[threadEmails.length - 1].sent_at,
      participant_emails: Array.from(participants),
    };
  }).sort((a, b) => new Date(b.last_email_at).getTime() - new Date(a.last_email_at).getTime());
}

export function useSendEmail() {
  const { toast } = useToast();

  const sendEmail = useCallback(async (params: {
    account_id: string;
    to: string[];
    cc?: string[];
    subject: string;
    body_html: string;
    body_text: string;
    thread_id?: string;
  }) => {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: params,
    });

    if (error) {
      toast({ title: 'Send failed', description: error.message, variant: 'destructive' });
      return null;
    }

    toast({ title: 'Email sent', description: `Email sent to ${params.to.join(', ')}` });
    return data;
  }, [toast]);

  return { sendEmail };
}

export function useEmailAttachments(emailId: string) {
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);

  useEffect(() => {
    if (!emailId) return;
    supabase
      .from('email_attachments')
      .select('*')
      .eq('email_id', emailId)
      .then(({ data }) => {
        setAttachments((data || []) as unknown as EmailAttachment[]);
      });
  }, [emailId]);

  return { attachments };
}
