import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Authenticate via X-API-Key header
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return jsonResponse({ error: "Missing X-API-Key header" }, 401);
  }

  const { data: keyRecord, error: keyError } = await supabase
    .from("api_keys")
    .select("*")
    .eq("api_key", apiKey)
    .eq("is_active", true)
    .single();

  if (keyError || !keyRecord) {
    return jsonResponse({ error: "Invalid or inactive API key" }, 401);
  }

  const tenantId = keyRecord.tenant_id;

  // Update last_used_at
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRecord.id);

  // Parse URL path to extract record ID
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  // Path: /api-records or /api-records/{id}
  const recordId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null;

  try {
    switch (req.method) {
      case "GET": {
        if (recordId) {
          // Get single record
          const { data, error } = await supabase
            .from("crm_records")
            .select("*")
            .eq("id", recordId)
            .eq("tenant_id", tenantId)
            .single();

          if (error || !data) {
            return jsonResponse({ error: "Record not found" }, 404);
          }
          return jsonResponse({ record: data });
        }

        // List records with optional filters
        const moduleId = url.searchParams.get("module_id");
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
        const offset = parseInt(url.searchParams.get("offset") || "0");

        let query = supabase
          .from("crm_records")
          .select("*", { count: "exact" })
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (moduleId) {
          query = query.eq("module_id", moduleId);
        }

        const { data, error, count } = await query;
        if (error) {
          return jsonResponse({ error: error.message }, 500);
        }

        return jsonResponse({
          records: data,
          total: count,
          limit,
          offset,
        });
      }

      case "POST": {
        const body = await req.json();

        if (!body.module_id) {
          return jsonResponse({ error: "module_id is required" }, 400);
        }
        if (!body.values || typeof body.values !== "object") {
          return jsonResponse({ error: "values object is required" }, 400);
        }

        const { data, error } = await supabase
          .from("crm_records")
          .insert({
            tenant_id: tenantId,
            module_id: body.module_id,
            values: body.values,
            created_by: body.created_by || "API",
          })
          .select()
          .single();

        if (error) {
          return jsonResponse({ error: error.message }, 500);
        }

        return jsonResponse({ record: data }, 201);
      }

      case "PUT": {
        if (!recordId) {
          return jsonResponse({ error: "Record ID is required in URL path" }, 400);
        }

        const body = await req.json();

        // Verify record belongs to tenant
        const { data: existing } = await supabase
          .from("crm_records")
          .select("id")
          .eq("id", recordId)
          .eq("tenant_id", tenantId)
          .single();

        if (!existing) {
          return jsonResponse({ error: "Record not found" }, 404);
        }

        const updates: Record<string, any> = { updated_at: new Date().toISOString() };
        if (body.values) updates.values = body.values;
        if (body.module_id) updates.module_id = body.module_id;

        const { data, error } = await supabase
          .from("crm_records")
          .update(updates)
          .eq("id", recordId)
          .eq("tenant_id", tenantId)
          .select()
          .single();

        if (error) {
          return jsonResponse({ error: error.message }, 500);
        }

        return jsonResponse({ record: data });
      }

      case "DELETE": {
        if (!recordId) {
          return jsonResponse({ error: "Record ID is required in URL path" }, 400);
        }

        const { error } = await supabase
          .from("crm_records")
          .delete()
          .eq("id", recordId)
          .eq("tenant_id", tenantId);

        if (error) {
          return jsonResponse({ error: error.message }, 500);
        }

        return jsonResponse({ deleted: true });
      }

      default:
        return jsonResponse({ error: "Method not allowed" }, 405);
    }
  } catch (err) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
