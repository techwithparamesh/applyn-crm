import { useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

export type AutomationTriggerEvent = 'record_created' | 'record_updated' | 'stage_changed';

export function useAutomationTrigger() {
  const { profile } = useAuth();

  const triggerAutomation = useCallback(
    async (
      moduleId: string,
      triggerEvent: AutomationTriggerEvent,
      record: { id: string; values: Record<string, any> }
    ) => {
      try {
        const { data, error } = await api.post('/api/run-automation', {
          module_id: moduleId,
          trigger_event: triggerEvent,
          record: { id: record.id, values: record.values },
          tenant_id: profile?.tenant_id || 't1',
        });
        if (error) {
          console.error('[AutomationTrigger] Error:', error);
          return { matched: 0, executed: 0 };
        }
        return (data as { matched?: number; executed?: number }) || { matched: 0, executed: 0 };
      } catch (err) {
        console.error('[AutomationTrigger] Failed:', err);
        return { matched: 0, executed: 0 };
      }
    },
    [profile]
  );

  return { triggerAutomation };
}
