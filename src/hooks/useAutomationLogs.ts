import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
    let query = supabase
      .from('automation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (automationId) query = query.eq('automation_id', automationId);

    const { data } = await query;
    if (data) {
      setLogs(data.map((row: any) => ({
        id: row.id,
        automationId: row.automation_id,
        recordId: row.record_id,
        status: row.status,
        details: (typeof row.details === 'object' ? row.details : {}) as Record<string, any>,
        createdAt: row.created_at,
      })));
    }
    setLoading(false);
  }, [automationId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return { logs, loading, refetch: fetchLogs };
}
