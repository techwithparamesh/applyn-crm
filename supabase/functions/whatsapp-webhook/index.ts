import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  const url = new URL(req.url);

  // Webhook verification (GET)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe") {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Verify token against any active account
      const { data: account } = await supabase
        .from("whatsapp_accounts")
        .select("webhook_verify_token")
        .eq("webhook_verify_token", token)
        .eq("is_connected", true)
        .maybeSingle();

      if (account) {
        return new Response(challenge, { status: 200 });
      }
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Handle incoming messages (POST)
  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const entries = body?.entry || [];
    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const value = change?.value;
        if (!value?.messages) continue;

        const phoneNumberId = value.metadata?.phone_number_id;

        // Find account
        const { data: account } = await supabase
          .from("whatsapp_accounts")
          .select("*")
          .eq("phone_number_id", phoneNumberId)
          .eq("is_connected", true)
          .maybeSingle();

        if (!account) continue;

        for (const msg of value.messages) {
          const senderPhone = msg.from;
          const messageText = msg.text?.body || msg.caption || "[media]";

          // Find or create conversation
          let { data: conversation } = await supabase
            .from("whatsapp_conversations")
            .select("*")
            .eq("account_id", account.id)
            .eq("contact_phone", senderPhone)
            .maybeSingle();

          if (!conversation) {
            // Try to resolve CRM contact
            let contactName: string | null = null;
            let contactId: string | null = null;

            const { data: records } = await supabase
              .from("crm_records")
              .select("id, values")
              .eq("tenant_id", account.tenant_id)
              .limit(200);

            if (records) {
              const normalizedSender = senderPhone.replace(/[\s\-\(\)]/g, "");
              for (const record of records) {
                const vals = record.values as Record<string, any>;
                for (const field of ["phone", "mobile", "whatsapp", "phone_number"]) {
                  if (vals[field] && vals[field].replace(/[\s\-\(\)]/g, "") === normalizedSender) {
                    contactId = record.id;
                    contactName = vals["name"] || vals["full_name"] || vals["first_name"] || null;
                    break;
                  }
                }
                if (contactId) break;
              }
            }

            const { data: newConv } = await supabase
              .from("whatsapp_conversations")
              .insert({
                account_id: account.id,
                contact_phone: senderPhone,
                contact_name: contactName,
                contact_id: contactId,
                record_id: contactId,
                tenant_id: account.tenant_id,
                last_message: messageText,
                last_message_at: new Date().toISOString(),
                unread_count: 1,
              })
              .select()
              .single();

            conversation = newConv;
          } else {
            // Update existing conversation
            await supabase
              .from("whatsapp_conversations")
              .update({
                last_message: messageText,
                last_message_at: new Date().toISOString(),
                unread_count: (conversation.unread_count || 0) + 1,
              })
              .eq("id", conversation.id);
          }

          // Insert message
          if (conversation) {
            await supabase.from("whatsapp_messages").insert({
              conversation_id: conversation.id,
              direction: "incoming",
              content: messageText,
              status: "delivered",
              message_type: msg.type || "text",
              media_url: msg.image?.link || msg.video?.link || msg.document?.link || null,
              whatsapp_message_id: msg.id,
              tenant_id: account.tenant_id,
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
