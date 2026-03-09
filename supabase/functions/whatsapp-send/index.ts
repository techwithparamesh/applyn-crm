import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { phone_number, message, conversation_id, account_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get WhatsApp account credentials
    const { data: account } = await supabase
      .from("whatsapp_accounts")
      .select("*")
      .eq("id", account_id)
      .single();

    if (!account) {
      return new Response(JSON.stringify({ error: "Account not found" }), { status: 404, headers: corsHeaders });
    }

    // Send via WhatsApp Cloud API
    const waResponse = await fetch(
      `https://graph.facebook.com/v18.0/${account.phone_number_id}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${account.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone_number.replace(/[\s\-\(\)\+]/g, ""),
          type: "text",
          text: { body: message },
        }),
      }
    );

    const waData = await waResponse.json();

    // Store message in DB
    const { data: msg } = await supabase.from("whatsapp_messages").insert({
      conversation_id,
      direction: "outgoing",
      content: message,
      status: waResponse.ok ? "sent" : "failed",
      message_type: "text",
      whatsapp_message_id: waData?.messages?.[0]?.id || null,
      error_message: waResponse.ok ? null : JSON.stringify(waData),
    }).select().single();

    // Update conversation
    await supabase.from("whatsapp_conversations").update({
      last_message: message,
      last_message_at: new Date().toISOString(),
    }).eq("id", conversation_id);

    return new Response(JSON.stringify({ success: true, message: msg, whatsapp_response: waData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
