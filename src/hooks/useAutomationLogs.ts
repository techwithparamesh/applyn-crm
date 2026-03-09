import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface AutomationLog {
  id: string;
  automationId: string;
  recordId: string | null;
  status: string;
  details: Record<string, any>;
  createdAt: string;
}

export function useAutomationLogs(automationId?: string) {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = automationId ? { automation_id: automationId } : {};
    const { data } = await api.get('/api/automation_logs', params);
    if (data) {
      setLogs(
        (data as any[]).map((row: any) => ({
          id: row.id,
          automationId: row.automation_id,
          recordId: row.record_id,
          status: row.status,
          details: (typeof row.details === 'object' ? row.details : {}) as Record<string, any>,
          createdAt: row.created_at,
        }))
      );
    }
    setLoading(false);
  }, [automationId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, refetch: fetchLogs };
}
