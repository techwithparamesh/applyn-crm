import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Automation,
  AutomationCondition,
  AutomationAction,
  AutomationTriggerType,
  AutomationActionType,
  ConditionOperator,
} from '@/lib/automation-types';

export function useAutomations() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAutomations = useCallback(async () => {
    setLoading(true);
    const { data: autos, error } = await api.get('/api/automations');
    if (error || !autos) {
      setLoading(false);
      return;
    }
    const list = (autos || []) as any[];
    if (list.length === 0) {
      setAutomations([]);
      setLoading(false);
      return;
    }
    const ids = list.map((a: any) => a.id);
    const [condRes, actRes] = await Promise.all([
      api.get('/api/automation_conditions', { automation_id: ids.join(',') }),
      api.get('/api/automation_actions', { automation_id: ids.join(',') }),
    ]);
    const conditions = (condRes.data || []) as any[];
    const actions = (actRes.data || []) as any[];
    const mapped: Automation[] = list.map((a: any) => ({
      id: a.id,
      tenant_id: a.tenant_id,
      module_id: a.module_id,
      name: a.name,
      trigger_event: a.trigger_event as AutomationTriggerType,
      is_active: a.is_active,
      created_at: a.created_at,
      updated_at: a.updated_at,
      conditions: conditions
        .filter((c: any) => c.automation_id === a.id)
        .map((c: any) => ({
          id: c.id,
          automation_id: c.automation_id,
          field_name: c.field_name,
          operator: c.operator as ConditionOperator,
          value: c.value,
          sort_order: c.sort_order,
        })),
      actions: actions
        .filter((ac: any) => ac.automation_id === a.id)
        .map((ac: any) => ({
          id: ac.id,
          automation_id: ac.automation_id,
          action_type: ac.action_type as AutomationActionType,
          action_config: ac.action_config as Record<string, string>,
          sort_order: ac.sort_order,
        })),
    }));
    setAutomations(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  const createAutomation = useCallback(
    async (data: { name: string; module_id: string; trigger_event: AutomationTriggerType }) => {
      const { data: row, error } = await api.post('/api/automations', {
        name: data.name,
        module_id: data.module_id,
        trigger_event: data.trigger_event,
      });
      if (error || !row) return null;
      const r = row as any;
      const auto: Automation = {
        id: r.id,
        tenant_id: r.tenant_id,
        module_id: r.module_id,
        name: r.name,
        trigger_event: r.trigger_event as AutomationTriggerType,
        is_active: r.is_active,
        created_at: r.created_at,
        updated_at: r.updated_at,
        conditions: [],
        actions: [],
      };
      setAutomations((prev) => [auto, ...prev]);
      return auto;
    },
    []
  );

  const updateAutomation = useCallback(async (id: string, updates: Partial<Pick<Automation, 'name' | 'trigger_event' | 'is_active'>>) => {
    await api.patch(`/api/automations/${id}`, updates);
    setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a)));
  }, []);

  const deleteAutomation = useCallback(async (id: string) => {
    await api.delete(`/api/automations/${id}`);
    setAutomations((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const toggleActive = useCallback(async (id: string) => {
    const auto = automations.find((a) => a.id === id);
    if (!auto) return;
    const newActive = !auto.is_active;
    await api.patch(`/api/automations/${id}`, { is_active: newActive });
    setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: newActive, updated_at: new Date().toISOString() } : a)));
  }, [automations]);

  const getAutomation = useCallback((id: string) => automations.find((a) => a.id === id), [automations]);

  const addCondition = useCallback(
    async (autoId: string, condition: Omit<AutomationCondition, 'id' | 'automation_id'>) => {
      const { data, error } = await api.post('/api/automation_conditions', {
        automation_id: autoId,
        field_name: condition.field_name,
        operator: condition.operator,
        value: condition.value,
        sort_order: condition.sort_order,
      });
      if (error || !data) return;
      const d = data as any;
      const newCond: AutomationCondition = {
        id: d.id,
        automation_id: autoId,
        field_name: d.field_name,
        operator: d.operator as ConditionOperator,
        value: d.value,
        sort_order: d.sort_order,
      };
      setAutomations((prev) => prev.map((a) => (a.id === autoId ? { ...a, conditions: [...(a.conditions || []), newCond] } : a)));
    },
    []
  );

  const removeCondition = useCallback(async (autoId: string, conditionId: string) => {
    await api.delete(`/api/automation_conditions/${conditionId}`);
    setAutomations((prev) => prev.map((a) => (a.id === autoId ? { ...a, conditions: (a.conditions || []).filter((c) => c.id !== conditionId) } : a)));
  }, []);

  const addAction = useCallback(
    async (autoId: string, action: Omit<AutomationAction, 'id' | 'automation_id'>) => {
      const { data, error } = await api.post('/api/automation_actions', {
        automation_id: autoId,
        action_type: action.action_type,
        action_config: action.action_config,
        sort_order: action.sort_order,
      });
      if (error || !data) return;
      const d = data as any;
      const newAct: AutomationAction = {
        id: d.id,
        automation_id: autoId,
        action_type: d.action_type as AutomationActionType,
        action_config: d.action_config as Record<string, string>,
        sort_order: d.sort_order,
      };
      setAutomations((prev) => prev.map((a) => (a.id === autoId ? { ...a, actions: [...(a.actions || []), newAct] } : a)));
    },
    []
  );

  const removeAction = useCallback(async (autoId: string, actionId: string) => {
    await api.delete(`/api/automation_actions/${actionId}`);
    setAutomations((prev) => prev.map((a) => (a.id === autoId ? { ...a, actions: (a.actions || []).filter((ac) => ac.id !== actionId) } : a)));
  }, []);

  return {
    automations,
    loading,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleActive,
    getAutomation,
    addCondition,
    removeCondition,
    addAction,
    removeAction,
    refetch: fetchAutomations,
  };
}
