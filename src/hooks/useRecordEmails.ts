import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
    
    // Get email IDs linked to this record
    const { data: links, error: linksError } = await supabase
      .from('email_record_links')
      .select('email_id')
      .eq('record_id', recordId);

    if (linksError) {
      console.error('Error fetching email links:', linksError);
      setLoading(false);
      return;
    }

    if (!links || links.length === 0) {
      setEmails([]);
      setLoading(false);
      return;
    }

    const emailIds = links.map(l => l.email_id);

    // Fetch the actual emails
    const { data: emailsData, error: emailsError } = await supabase
      .from('emails')
      .select('*')
      .in('id', emailIds)
      .order('sent_at', { ascending: false });

    if (emailsError) {
      console.error('Error fetching emails:', emailsError);
      toast({ title: 'Error', description: 'Failed to load emails', variant: 'destructive' });
    } else {
      setEmails((emailsData || []) as unknown as SyncedEmail[]);
    }
    setLoading(false);
  }, [recordId, toast]);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  const linkEmailToRecord = useCallback(async (emailId: string, moduleName: string) => {
    const { error } = await supabase
      .from('email_record_links')
      .insert({
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
  }, [recordId, fetchEmails, toast]);

  const unlinkEmail = useCallback(async (emailId: string) => {
    const { error } = await supabase
      .from('email_record_links')
      .delete()
      .eq('email_id', emailId)
      .eq('record_id', recordId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to unlink email', variant: 'destructive' });
      return false;
    }
    
    fetchEmails();
    return true;
  }, [recordId, fetchEmails, toast]);

  return { emails, loading, refetch: fetchEmails, linkEmailToRecord, unlinkEmail };
}

export function useActiveEmailAccount() {
  const [account, setAccount] = useState<{ id: string; email_address: string; provider: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('email_accounts')
      .select('id, email_address, provider')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setAccount(data);
        setLoading(false);
      });
  }, []);

  return { account, loading };
}
