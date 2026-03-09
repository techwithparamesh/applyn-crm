import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface DashboardKpis {
  total_leads: number;
  active_deals: number;
  revenue: number;
  tasks_due_today: number;
}

export function useDashboardKpis() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/dashboard/kpis').then(({ data, error }) => {
      if (!error && data) setKpis(data as DashboardKpis);
      setLoading(false);
    });
  }, []);

  return { kpis, loading };
}
