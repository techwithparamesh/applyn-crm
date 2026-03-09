import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface WhatsAppAccount {
  id: string;
  tenant_id: string;
  display_phone_number: string;
  phone_number_id: string;
  business_account_id: string;
  is_active: boolean;
  is_connected: boolean;
  created_at: string;
}

export interface WhatsAppConversation {
  id: string;
  tenant_id: string;
  contact_phone: string;
  contact_name: string | null;
  contact_id: string | null;
  last_message: string | null;
  last_message_at: string;
  unread_count: number;
  account_id: string;
  record_id: string | null;
  module_name: string | null;
  created_at: string;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  direction: string;
  content: string;
  media_url: string | null;
  status: string;
  sent_at: string;
  template_name: string | null;
  error_message: string | null;
  tenant_id: string;
}

export function useWhatsAppAccount() {
  const [account, setAccount] = useState<WhatsAppAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('whatsapp_accounts')
      .select('*')
      .eq('is_connected', true)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching WhatsApp account:', error);
    }
    setAccount(data as WhatsAppAccount | null);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAccount(); }, [fetchAccount]);

  const connectAccount = useCallback(async (phoneNumberId: string, businessAccountId: string, accessToken: string, displayPhoneNumber: string) => {
    const { data, error } = await supabase
      .from('whatsapp_accounts')
      .insert({
        phone_number_id: phoneNumberId,
        business_account_id: businessAccountId,
        access_token: accessToken,
        display_phone_number: displayPhoneNumber,
        is_connected: true,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Connection failed', description: error.message, variant: 'destructive' });
      return null;
    }
    setAccount(data as WhatsAppAccount);
    toast({ title: 'WhatsApp Connected', description: 'Your WhatsApp Business account is now connected.' });
    return data;
  }, [toast]);

  const disconnectAccount = useCallback(async () => {
    if (!account) return;
    await supabase.from('whatsapp_accounts').update({ is_connected: false }).eq('id', account.id);
    setAccount(null);
    toast({ title: 'Disconnected', description: 'WhatsApp account disconnected.' });
  }, [account, toast]);

  return { account, loading, connectAccount, disconnectAccount, refetch: fetchAccount };
}

export function useWhatsAppConversations(accountId: string | undefined) {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!accountId) { setConversations([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('account_id', accountId)
      .order('last_message_at', { ascending: false });

    if (error) console.error('Error fetching conversations:', error);
    setConversations((data || []) as WhatsAppConversation[]);
    setLoading(false);
  }, [accountId]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Realtime subscription
  useEffect(() => {
    if (!accountId) return;
    const channel = supabase
      .channel('whatsapp-conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations' }, () => {
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [accountId, fetchConversations]);

  return { conversations, loading, refetch: fetchConversations };
}

export function useWhatsAppMessages(conversationId: string | undefined) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) { setMessages([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true });

    if (error) console.error('Error fetching messages:', error);
    setMessages((data || []) as WhatsAppMessage[]);
    setLoading(false);
  }, [conversationId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`whatsapp-messages-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as WhatsAppMessage]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  return { messages, loading, refetch: fetchMessages };
}

export function useWhatsAppSend(accountId: string | undefined) {
  const { toast } = useToast();

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!accountId) return null;

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: conversationId,
        direction: 'outgoing',
        content,
        status: 'sent',
        message_type: 'text',
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Send failed', description: error.message, variant: 'destructive' });
      return null;
    }

    // Update conversation last_message
    await supabase.from('whatsapp_conversations').update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    }).eq('id', conversationId);

    return data;
  }, [accountId, toast]);

  const createConversation = useCallback(async (phone: string, contactName?: string) => {
    if (!accountId) return null;

    // Try to find CRM contact by phone
    let contactId: string | null = null;
    let resolvedName = contactName || null;

    const { data: records } = await supabase
      .from('crm_records')
      .select('id, values')
      .limit(100);

    if (records) {
      for (const record of records) {
        const vals = record.values as Record<string, any>;
        const phoneFields = ['phone', 'mobile', 'whatsapp', 'phone_number'];
        for (const field of phoneFields) {
          if (vals[field] && normalizePhone(vals[field]) === normalizePhone(phone)) {
            contactId = record.id;
            resolvedName = vals['name'] || vals['full_name'] || vals['first_name'] || resolvedName;
            break;
          }
        }
        if (contactId) break;
      }
    }

    const { data, error } = await supabase
      .from('whatsapp_conversations')
      .insert({
        account_id: accountId,
        contact_phone: phone,
        contact_name: resolvedName,
        contact_id: contactId,
        record_id: contactId,
        last_message: '',
        last_message_at: new Date().toISOString(),
        unread_count: 0,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
    return data as WhatsAppConversation;
  }, [accountId, toast]);

  return { sendMessage, createConversation };
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '');
}
