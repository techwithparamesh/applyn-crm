import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, redirect_uri, code, state } = await req.json();

    // If code is provided, exchange it for tokens
    if (code) {
      return await handleCallback(provider, code, redirect_uri, state, req);
    }

    // Otherwise, generate OAuth URL
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
    const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID');

    if (provider === 'gmail') {
      if (!GOOGLE_CLIENT_ID) {
        return new Response(JSON.stringify({ error: 'Google OAuth not configured. Please add GOOGLE_CLIENT_ID secret.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' ');

      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirect_uri,
        response_type: 'code',
        scope: scopes,
        access_type: 'offline',
        prompt: 'consent',
        state: JSON.stringify({ provider: 'gmail' }),
      });

      return new Response(JSON.stringify({ auth_url: `${GOOGLE_AUTH_URL}?${params}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (provider === 'outlook') {
      if (!MICROSOFT_CLIENT_ID) {
        return new Response(JSON.stringify({ error: 'Microsoft OAuth not configured. Please add MICROSOFT_CLIENT_ID secret.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const scopes = [
        'openid',
        'profile',
        'email',
        'https://graph.microsoft.com/Mail.ReadWrite',
        'https://graph.microsoft.com/Mail.Send',
        'offline_access',
      ].join(' ');

      const params = new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        redirect_uri: redirect_uri,
        response_type: 'code',
        scope: scopes,
        state: JSON.stringify({ provider: 'outlook' }),
      });

      return new Response(JSON.stringify({ auth_url: `${MICROSOFT_AUTH_URL}?${params}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid provider' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Connect email error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleCallback(provider: string, code: string, redirectUri: string, _state: string, req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Try to get authenticated user from request
  let userId = 'system';
  let tenantId = 't1';
  
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      userId = user.id;
      // Get tenant from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();
      if (profile?.tenant_id) tenantId = profile.tenant_id;
    }
  }

  let accessToken: string;
  let refreshToken: string;
  let expiresIn: number;
  let email: string;

  if (provider === 'gmail') {
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

    accessToken = tokenData.access_token;
    refreshToken = tokenData.refresh_token;
    expiresIn = tokenData.expires_in;

    // Get user email
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await profileRes.json();
    email = profile.email;
  } else if (provider === 'outlook') {
    const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID')!;
    const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET')!;

    const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

    accessToken = tokenData.access_token;
    refreshToken = tokenData.refresh_token;
    expiresIn = tokenData.expires_in;

    // Get user email
    const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await profileRes.json();
    email = profile.mail || profile.userPrincipalName;
  } else {
    throw new Error('Invalid provider');
  }

  const tokenExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();

  // Upsert email account
  const { data: account, error } = await supabase
    .from('email_accounts')
    .upsert({
      user_id: userId,
      provider,
      email_address: email,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expiry: tokenExpiry,
      is_active: true,
      tenant_id: tenantId,
    }, { onConflict: 'tenant_id,email_address' })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return new Response(JSON.stringify({ success: true, account_id: account?.id, email }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
