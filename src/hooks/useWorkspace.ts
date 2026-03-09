import { useState, useCallback } from 'react';
import { WorkspaceSettings, WorkspaceSubscription, PlanTier } from '@/lib/workspace-types';

const defaultSettings: WorkspaceSettings = {
  id: 'ws-1',
  tenantId: 't1',
  name: 'Applyn CRM',
  timezone: 'America/New_York',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  brandColor: 'hsl(263, 70%, 58%)',
  subdomain: 'acme',
};

const defaultSubscription: WorkspaceSubscription = {
  id: 'sub-1',
  tenantId: 't1',
  planId: 'pro',
  status: 'active',
  currentPeriodStart: '2026-03-01T00:00:00Z',
  currentPeriodEnd: '2026-04-01T00:00:00Z',
};

export function useWorkspace() {
  const [settings, setSettings] = useState<WorkspaceSettings>(defaultSettings);
  const [subscription, setSubscription] = useState<WorkspaceSubscription>(defaultSubscription);

  const updateSettings = useCallback((updates: Partial<WorkspaceSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const changePlan = useCallback((planId: PlanTier) => {
    setSubscription(prev => ({
      ...prev,
      planId,
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  }, []);

  return { settings, subscription, updateSettings, changePlan };
}
