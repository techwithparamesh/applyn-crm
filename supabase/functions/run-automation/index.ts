import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function resolveTemplate(template: string, record: Record<string, any>): string {
  return template.replace(/\{\{record\.(\w+)\}\}/g, (_, key) => String(record[key] ?? ''));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { module_id, trigger_event, record, tenant_id } = await req.json();

    if (!module_id || !trigger_event || !record) {
      return new Response(JSON.stringify({ error: 'Missing module_id, trigger_event, or record' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const recordValues = record.values || record;
    const recordId = record.id;
    const effectiveTenantId = tenant_id || 't1';

    // Step 1: Fetch active automations for module + trigger
    const { data: automations, error: autoErr } = await supabase
      .from('automations')
      .select('id')
      .eq('module_id', module_id)
      .eq('trigger_event', trigger_event)
      .eq('is_active', true);

    if (autoErr || !automations || automations.length === 0) {
      return new Response(JSON.stringify({ matched: 0, executed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const autoIds = automations.map((a: any) => a.id);

    // Step 2: Fetch conditions and actions
    const [{ data: conditions }, { data: actions }] = await Promise.all([
      supabase.from('automation_conditions').select('*').in('automation_id', autoIds).order('sort_order'),
      supabase.from('automation_actions').select('*').in('automation_id', autoIds).order('sort_order'),
    ]);

    const results: { automation_id: string; matched: boolean; actions_run: number; errors: string[] }[] = [];

    for (const auto of automations) {
      const autoConds = (conditions || []).filter((c: any) => c.automation_id === auto.id);
      const autoActions = (actions || []).filter((a: any) => a.automation_id === auto.id);

      // Step 3: Evaluate conditions (AND logic)
      const allPass = autoConds.length === 0 || autoConds.every((cond: any) => {
        const fieldVal = String(recordValues[cond.field_name] ?? '');
        const condVal = cond.value;
        switch (cond.operator) {
          case 'equals': return fieldVal === condVal;
          case 'not_equals': return fieldVal !== condVal;
          case 'contains': return fieldVal.toLowerCase().includes(condVal.toLowerCase());
          case 'not_contains': return !fieldVal.toLowerCase().includes(condVal.toLowerCase());
          case 'greater_than': return parseFloat(fieldVal) > parseFloat(condVal);
          case 'less_than': return parseFloat(fieldVal) < parseFloat(condVal);
          case 'is_empty': return !fieldVal || fieldVal === '';
          case 'is_not_empty': return !!fieldVal && fieldVal !== '';
          default: return false;
        }
      });

      if (!allPass) {
        results.push({ automation_id: auto.id, matched: false, actions_run: 0, errors: [] });
        // Log skipped
        await supabase.from('automation_logs').insert({
          automation_id: auto.id,
          record_id: recordId || null,
          status: 'skipped',
          details: { reason: 'Conditions not met' },
          tenant_id: effectiveTenantId,
        });
        continue;
      }

      // Step 4: Execute actions
      let actionsRun = 0;
      const errors: string[] = [];

      for (const action of autoActions) {
        const config = action.action_config as Record<string, string>;
        try {
          switch (action.action_type) {
            case 'update_field': {
              if (config.field_key && recordId) {
                // Fetch current record to merge values
                const { data: currentRec } = await supabase
                  .from('crm_records')
                  .select('values')
                  .eq('id', recordId)
                  .single();
                const currentValues = (currentRec?.values as Record<string, any>) || {};
                const newValues = { ...currentValues, [config.field_key]: config.new_value };
                await supabase.from('crm_records')
                  .update({ values: newValues, updated_at: new Date().toISOString() })
                  .eq('id', recordId);
              }
              break;
            }
            case 'assign_owner': {
              if (recordId) {
                const { data: currentRec } = await supabase
                  .from('crm_records')
                  .select('values')
                  .eq('id', recordId)
                  .single();
                const currentValues = (currentRec?.values as Record<string, any>) || {};
                const newValues = { ...currentValues, owner: resolveTemplate(config.owner || '', recordValues) };
                await supabase.from('crm_records')
                  .update({ values: newValues, updated_at: new Date().toISOString() })
                  .eq('id', recordId);
              }
              break;
            }
            case 'create_task': {
              const title = resolveTemplate(config.title || 'Auto-created task', recordValues);
              await supabase.from('tasks').insert({
                title,
                record_id: recordId || null,
                assigned_to: resolveTemplate(config.assignee || '', recordValues),
                tenant_id: effectiveTenantId,
                created_by: 'Automation',
                priority: config.priority || 'medium',
              });
              break;
            }
            case 'send_email': {
              // Log intent — actual sending via send-email function
              console.log(`[Automation] Send email to ${resolveTemplate(config.to || '', recordValues)}, subject: ${config.subject}`);
              break;
            }
            case 'send_whatsapp': {
              console.log(`[Automation] Send WhatsApp to ${resolveTemplate(config.to || '', recordValues)}, message: ${config.message}`);
              break;
            }
          }
          actionsRun++;
        } catch (e) {
          const errMsg = `Action ${action.action_type} failed: ${String(e)}`;
          console.error(errMsg);
          errors.push(errMsg);
        }
      }

      // Log execution
      await supabase.from('automation_logs').insert({
        automation_id: auto.id,
        record_id: recordId || null,
        status: errors.length > 0 ? 'partial' : 'success',
        details: { actions_run: actionsRun, errors, trigger: trigger_event },
        tenant_id: effectiveTenantId,
      });

      results.push({ automation_id: auto.id, matched: true, actions_run: actionsRun, errors });
    }

    return new Response(JSON.stringify({
      matched: results.filter((r) => r.matched).length,
      executed: results.reduce((sum, r) => sum + r.actions_run, 0),
      details: results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
