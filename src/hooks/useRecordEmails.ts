import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { SyncedEmail } from '@/lib/email-sync-types';
import { useToast } from '@/hooks/use-toast';

export function useRecordEmails(recordId: string) {
  const [emails, setEmails] = useState<SyncedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEmails = useCallback(async () => {
    if (!recordId) {
      setEmails([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: links, error: linksError } = await api.get('/api/email_record_links', { record_id: recordId });
    if (linksError || !links || (links as any[]).length === 0) {
      setEmails([]);
      setLoading(false);
      return;
    }
    const emailIds = (links as any[]).map((l: any) => l.email_id);
    const emailsList: SyncedEmail[] = [];
    for (const eid of emailIds) {
      const { data: emailData } = await api.get('/api/emails', { id: eid });
      if (emailData) emailsList.push(emailData as SyncedEmail);
    }
    emailsList.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
    setEmails(emailsList);
    setLoading(false);
  }, [recordId]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const linkEmailToRecord = useCallback(
    async (emailId: string, moduleName: string) => {
      const { error } = await api.post('/api/email_record_links', {
        email_id: emailId,
        record_id: recordId,
        module_name: moduleName,
      });
      if (error) {
        toast({ title: 'Error', description: 'Failed to link email', variant: 'destructive' });
        return false;
      }
      fetchEmails();
      return true;
    },
    [recordId, fetchEmails, toast]
  );

  const unlinkEmail = useCallback(
    async (emailId: string) => {
      const { error } = await api.delete('/api/email_record_links', { email_id: emailId, record_id: recordId });
      if (error) {
        toast({ title: 'Error', description: 'Failed to unlink email', variant: 'destructive' });
        return false;
      }
      fetchEmails();
      return true;
    },
    [recordId, fetchEmails, toast]
  );

  return { emails, loading, refetch: fetchEmails, linkEmailToRecord, unlinkEmail };
}

export function useActiveEmailAccount() {
  const [account, setAccount] = useState<{ id: string; email_address: string; provider: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/email_accounts').then(({ data }) => {
      const list = (data || []) as any[];
      const active = list.find((a: any) => a.is_active);
      setAccount(active ? { id: active.id, email_address: active.email_address, provider: active.provider } : null);
      setLoading(false);
    });
  }, []);

  return { account, loading };
}
