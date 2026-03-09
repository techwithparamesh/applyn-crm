import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { account_id } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch the account
    const { data: account, error: accErr } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', account_id)
      .single();

    if (accErr || !account) {
      throw new Error('Account not found');
    }

    // Check if token needs refresh
    let accessToken = account.access_token;
    if (new Date(account.token_expiry) <= new Date()) {
      accessToken = await refreshToken(account, supabase);
    }

    let syncedCount = 0;

    if (account.provider === 'gmail') {
      syncedCount = await syncGmail(accessToken, account, supabase);
    } else if (account.provider === 'outlook') {
      syncedCount = await syncOutlook(accessToken, account, supabase);
    }

    // Update last_sync_at
    await supabase
      .from('email_accounts')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', account_id);

    // Match emails to CRM records
    await matchEmailsToRecords(supabase, account_id);

    return new Response(JSON.stringify({ success: true, synced_count: syncedCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function refreshToken(account: any, supabase: any): Promise<string> {
  let tokenUrl: string;
  let body: Record<string, string>;

  if (account.provider === 'gmail') {
    tokenUrl = 'https://oauth2.googleapis.com/token';
    body = {
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      refresh_token: account.refresh_token,
      grant_type: 'refresh_token',
    };
  } else {
    tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    body = {
      client_id: Deno.env.get('MICROSOFT_CLIENT_ID')!,
      client_secret: Deno.env.get('MICROSOFT_CLIENT_SECRET')!,
      refresh_token: account.refresh_token,
      grant_type: 'refresh_token',
    };
  }

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  const data = await res.json();

  if (data.error) throw new Error(`Token refresh failed: ${data.error_description}`);

  const newExpiry = new Date(Date.now() + data.expires_in * 1000).toISOString();

  await supabase
    .from('email_accounts')
    .update({
      access_token: data.access_token,
      token_expiry: newExpiry,
      ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}),
    })
    .eq('id', account.id);

  return data.access_token;
}

async function syncGmail(accessToken: string, account: any, supabase: any): Promise<number> {
  // Get recent messages
  const listRes = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const listData = await listRes.json();

  if (!listData.messages) return 0;

  let synced = 0;
  for (const msg of listData.messages) {
    // Check if already synced
    const { data: existing } = await supabase
      .from('emails')
      .select('id')
      .eq('account_id', account.id)
      .eq('provider_message_id', msg.id)
      .maybeSingle();

    if (existing) continue;

    // Fetch full message
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const msgData = await msgRes.json();

    const headers = msgData.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const from = getHeader('From');
    const to = getHeader('To');
    const cc = getHeader('Cc');
    const subject = getHeader('Subject');
    const date = getHeader('Date');

    // Extract body
    let bodyText = '';
    let bodyHtml = '';
    const extractBody = (part: any) => {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        bodyText = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }
      if (part.mimeType === 'text/html' && part.body?.data) {
        bodyHtml = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }
      if (part.parts) part.parts.forEach(extractBody);
    };
    extractBody(msgData.payload);

    const fromEmail = from.match(/<(.+)>/)?.[1] || from;
    const isOutgoing = fromEmail.toLowerCase() === account.email_address.toLowerCase();

    const { error } = await supabase.from('emails').insert({
      tenant_id: account.tenant_id,
      account_id: account.id,
      provider_message_id: msg.id,
      subject,
      body_html: bodyHtml || null,
      body_text: bodyText || null,
      from_email: fromEmail,
      to_emails: to.split(',').map((e: string) => e.trim().match(/<(.+)>/)?.[1] || e.trim()).filter(Boolean),
      cc_emails: cc ? cc.split(',').map((e: string) => e.trim().match(/<(.+)>/)?.[1] || e.trim()).filter(Boolean) : [],
      bcc_emails: [],
      thread_id: msgData.threadId,
      direction: isOutgoing ? 'outgoing' : 'incoming',
      is_read: msgData.labelIds?.includes('UNREAD') ? false : true,
      sent_at: new Date(date || Date.now()).toISOString(),
      synced_at: new Date().toISOString(),
    });

    if (!error) synced++;

    // Handle attachments
    const extractAttachments = async (part: any, emailId: string) => {
      if (part.filename && part.body?.attachmentId) {
        const attRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/attachments/${part.body.attachmentId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const attData = await attRes.json();

        await supabase.from('email_attachments').insert({
          email_id: emailId,
          file_name: part.filename,
          content_type: part.mimeType,
          size: part.body.size || 0,
        });
      }
      if (part.parts) {
        for (const p of part.parts) await extractAttachments(p, emailId);
      }
    };

    // Get inserted email ID for attachments
    if (!error) {
      const { data: inserted } = await supabase
        .from('emails')
        .select('id')
        .eq('provider_message_id', msg.id)
        .eq('account_id', account.id)
        .single();

      if (inserted) {
        await extractAttachments(msgData.payload, inserted.id);
      }
    }
  }

  return synced;
}

async function syncOutlook(accessToken: string, account: any, supabase: any): Promise<number> {
  const res = await fetch(
    'https://graph.microsoft.com/v1.0/me/messages?$top=50&$orderby=receivedDateTime desc&$select=id,subject,body,bodyPreview,from,toRecipients,ccRecipients,conversationId,isRead,sentDateTime,hasAttachments',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();

  if (!data.value) return 0;

  let synced = 0;
  for (const msg of data.value) {
    const { data: existing } = await supabase
      .from('emails')
      .select('id')
      .eq('account_id', account.id)
      .eq('provider_message_id', msg.id)
      .maybeSingle();

    if (existing) continue;

    const fromEmail = msg.from?.emailAddress?.address || '';
    const isOutgoing = fromEmail.toLowerCase() === account.email_address.toLowerCase();

    const { error } = await supabase.from('emails').insert({
      tenant_id: account.tenant_id,
      account_id: account.id,
      provider_message_id: msg.id,
      subject: msg.subject || '',
      body_html: msg.body?.contentType === 'html' ? msg.body.content : null,
      body_text: msg.body?.contentType === 'text' ? msg.body.content : msg.bodyPreview,
      from_email: fromEmail,
      to_emails: (msg.toRecipients || []).map((r: any) => r.emailAddress?.address).filter(Boolean),
      cc_emails: (msg.ccRecipients || []).map((r: any) => r.emailAddress?.address).filter(Boolean),
      bcc_emails: [],
      thread_id: msg.conversationId,
      direction: isOutgoing ? 'outgoing' : 'incoming',
      is_read: msg.isRead || false,
      sent_at: msg.sentDateTime || new Date().toISOString(),
      synced_at: new Date().toISOString(),
    });

    if (!error) synced++;

    // Fetch attachments
    if (msg.hasAttachments && !error) {
      const { data: inserted } = await supabase
        .from('emails')
        .select('id')
        .eq('provider_message_id', msg.id)
        .eq('account_id', account.id)
        .single();

      if (inserted) {
        const attRes = await fetch(
          `https://graph.microsoft.com/v1.0/me/messages/${msg.id}/attachments`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const attData = await attRes.json();

        for (const att of (attData.value || [])) {
          await supabase.from('email_attachments').insert({
            email_id: inserted.id,
            file_name: att.name,
            content_type: att.contentType,
            size: att.size || 0,
          });
        }
      }
    }
  }

  return synced;
}

async function matchEmailsToRecords(supabase: any, accountId: string) {
  // Get unlinked emails
  const { data: emails } = await supabase
    .from('emails')
    .select('id, from_email, to_emails')
    .eq('account_id', accountId);

  if (!emails) return;

  // Get CRM records with email fields
  const { data: records } = await supabase
    .from('crm_records')
    .select('id, module_id, values');

  if (!records) return;

  for (const email of emails) {
    // Check if already linked
    const { data: existingLink } = await supabase
      .from('email_record_links')
      .select('id')
      .eq('email_id', email.id)
      .maybeSingle();

    if (existingLink) continue;

    const emailAddresses = [email.from_email, ...(email.to_emails || [])];

    for (const record of records) {
      const values = record.values || {};
      const recordEmail = values.email || values.secondary_email || '';

      if (recordEmail && emailAddresses.some((addr: string) =>
        addr.toLowerCase() === recordEmail.toLowerCase()
      )) {
        await supabase.from('email_record_links').insert({
          email_id: email.id,
          record_id: record.id,
          module_name: record.module_id,
        });
        break;
      }
    }
  }
}
