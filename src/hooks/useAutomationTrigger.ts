import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export type AutomationTriggerEvent = 'record_created' | 'record_updated' | 'stage_changed';

export function useAutomationTrigger() {
  const { profile } = useAuth();

  const triggerAutomation = useCallback(async (
    moduleId: string,
    triggerEvent: AutomationTriggerEvent,
    record: { id: string; values: Record<string, any> },
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('run-automation', {
        body: {
          module_id: moduleId,
          trigger_event: triggerEvent,
          record: { id: record.id, values: record.values },
          tenant_id: profile?.tenant_id || 't1',
        },
      });

      if (error) {
        console.error('[AutomationTrigger] Error:', error);
        return { matched: 0, executed: 0 };
      }

      if (data?.matched > 0) {
        console.log(`[AutomationTrigger] ${data.matched} automation(s) matched, ${data.executed} action(s) executed`);
      }

      return data || { matched: 0, executed: 0 };
    } catch (err) {
      console.error('[AutomationTrigger] Failed:', err);
      return { matched: 0, executed: 0 };
    }
  }, [profile]);

  return { triggerAutomation };
}
