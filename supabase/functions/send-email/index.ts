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
    const { account_id, to, cc, subject, body_html, body_text, thread_id } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: account, error: accErr } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', account_id)
      .single();

    if (accErr || !account) throw new Error('Account not found');

    // Refresh token if needed
    let accessToken = account.access_token;
    if (new Date(account.token_expiry) <= new Date()) {
      accessToken = await refreshAccessToken(account, supabase);
    }

    let providerMessageId: string | null = null;
    let sentThreadId: string | null = thread_id || null;

    if (account.provider === 'gmail') {
      const result = await sendViaGmail(accessToken, account.email_address, to, cc || [], subject, body_html || body_text, thread_id);
      providerMessageId = result.id;
      sentThreadId = result.threadId;
    } else if (account.provider === 'outlook') {
      const result = await sendViaOutlook(accessToken, to, cc || [], subject, body_html || body_text, thread_id);
      providerMessageId = result.id;
      sentThreadId = result.conversationId;
    }

    // Store in DB with tracking pixel
    const trackingPixelUrl = `${supabaseUrl}/functions/v1/email-open-tracker?eid=`;
    
    const { data: emailRecord, error: insertErr } = await supabase.from('emails').insert({
      tenant_id: account.tenant_id,
      account_id: account.id,
      provider_message_id: providerMessageId,
      subject,
      body_html: body_html || null,
      body_text: body_text || null,
      from_email: account.email_address,
      to_emails: to,
      cc_emails: cc || [],
      bcc_emails: [],
      thread_id: sentThreadId,
      direction: 'outgoing',
      is_read: true,
      sent_at: new Date().toISOString(),
      synced_at: new Date().toISOString(),
    }).select().single();

    if (insertErr) throw new Error(insertErr.message);

    // Match to CRM records
    if (emailRecord) {
      const { data: records } = await supabase
        .from('crm_records')
        .select('id, module_id, values');

      if (records) {
        for (const record of records) {
          const values = record.values || {};
          const recordEmail = values.email || values.secondary_email || '';
          if (recordEmail && to.some((t: string) => t.toLowerCase() === recordEmail.toLowerCase())) {
            await supabase.from('email_record_links').insert({
              email_id: emailRecord.id,
              record_id: record.id,
              module_name: record.module_id,
            });
            break;
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, email_id: emailRecord?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function refreshAccessToken(account: any, supabase: any): Promise<string> {
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

  await supabase.from('email_accounts').update({
    access_token: data.access_token,
    token_expiry: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}),
  }).eq('id', account.id);

  return data.access_token;
}

async function sendViaGmail(accessToken: string, from: string, to: string[], cc: string[], subject: string, body: string, threadId?: string) {
  const toHeader = to.join(', ');
  const ccHeader = cc.length > 0 ? `Cc: ${cc.join(', ')}\r\n` : '';
  const threadHeader = threadId ? `References: <${threadId}>\r\nIn-Reply-To: <${threadId}>\r\n` : '';

  const raw = [
    `From: ${from}`,
    `To: ${toHeader}`,
    ccHeader ? `Cc: ${cc.join(', ')}` : '',
    `Subject: ${subject}`,
    threadHeader,
    'Content-Type: text/html; charset=utf-8',
    '',
    body,
  ].filter(Boolean).join('\r\n');

  const encoded = btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encoded,
      ...(threadId ? { threadId } : {}),
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(`Gmail send failed: ${data.error.message}`);
  return data;
}

async function sendViaOutlook(accessToken: string, to: string[], cc: string[], subject: string, body: string, conversationId?: string) {
  const message: any = {
    subject,
    body: { contentType: 'HTML', content: body },
    toRecipients: to.map(e => ({ emailAddress: { address: e } })),
    ccRecipients: cc.map(e => ({ emailAddress: { address: e } })),
  };
  if (conversationId) {
    message.conversationId = conversationId;
  }

  const res = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, saveToSentItems: true }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Outlook send failed: ${JSON.stringify(err)}`);
  }

  return { id: null, conversationId };
}
