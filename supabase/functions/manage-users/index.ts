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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, ...payload } = await req.json();

    switch (action) {
      case 'invite': {
        const { email, role_id } = payload;
        if (!email) {
          return new Response(JSON.stringify({ error: 'Email required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create invitation record
        const { data: invitation, error: invErr } = await supabase
          .from('invitations')
          .insert({ email, role_id: role_id || null })
          .select()
          .single();

        if (invErr) throw invErr;

        // Create a pending profile if one doesn't exist
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (!existing) {
          await supabase.from('profiles').insert({
            email,
            name: email.split('@')[0],
            status: 'pending',
          });
        }

        // In production, send email with invite link containing invitation.token
        console.log(`[Invite] Token for ${email}: ${invitation.token}`);

        return new Response(JSON.stringify({ success: true, invitation }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'accept': {
        const { token } = payload;
        if (!token) {
          return new Response(JSON.stringify({ error: 'Token required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: inv, error: findErr } = await supabase
          .from('invitations')
          .select('*')
          .eq('token', token)
          .eq('accepted', false)
          .single();

        if (findErr || !inv) {
          return new Response(JSON.stringify({ error: 'Invalid or expired invitation' }), {
            status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check expiry
        if (new Date(inv.expires_at) < new Date()) {
          return new Response(JSON.stringify({ error: 'Invitation expired' }), {
            status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Mark accepted
        await supabase.from('invitations').update({ accepted: true }).eq('id', inv.id);

        // Activate profile
        await supabase
          .from('profiles')
          .update({ status: 'active' })
          .eq('email', inv.email);

        // If role assigned, create user_role entry
        if (inv.role_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', inv.email)
            .single();

          if (profile) {
            await supabase.from('user_roles').insert({
              user_id: profile.id,
              role_id: inv.role_id,
            });
          }
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
