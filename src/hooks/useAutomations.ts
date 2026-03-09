import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Automation, AutomationCondition, AutomationAction,
  AutomationTriggerType, AutomationActionType, ConditionOperator,
} from '@/lib/automation-types';

export function useAutomations() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAutomations = useCallback(async () => {
    setLoading(true);
    const { data: autos, error } = await supabase
      .from('automations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !autos) {
      setLoading(false);
      return;
    }

    // Fetch conditions and actions for all automations
    const ids = autos.map((a: any) => a.id);

    const [{ data: conditions }, { data: actions }] = await Promise.all([
      supabase.from('automation_conditions').select('*').in('automation_id', ids).order('sort_order'),
      supabase.from('automation_actions').select('*').in('automation_id', ids).order('sort_order'),
    ]);

    const mapped: Automation[] = autos.map((a: any) => ({
      id: a.id,
      tenant_id: a.tenant_id,
      module_id: a.module_id,
      name: a.name,
      trigger_event: a.trigger_event as AutomationTriggerType,
      is_active: a.is_active,
      created_at: a.created_at,
      updated_at: a.updated_at,
      conditions: (conditions || [])
        .filter((c: any) => c.automation_id === a.id)
        .map((c: any) => ({
          id: c.id,
          automation_id: c.automation_id,
          field_name: c.field_name,
          operator: c.operator as ConditionOperator,
          value: c.value,
          sort_order: c.sort_order,
        })),
      actions: (actions || [])
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

  useEffect(() => { fetchAutomations(); }, [fetchAutomations]);

  const createAutomation = useCallback(async (data: {
    name: string;
    module_id: string;
    trigger_event: AutomationTriggerType;
  }) => {
    const { data: row, error } = await supabase
      .from('automations')
      .insert({ name: data.name, module_id: data.module_id, trigger_event: data.trigger_event })
      .select()
      .single();

    if (error || !row) return null;

    const auto: Automation = {
      id: row.id,
      tenant_id: row.tenant_id,
      module_id: row.module_id,
      name: row.name,
      trigger_event: row.trigger_event as AutomationTriggerType,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      conditions: [],
      actions: [],
    };
    setAutomations((prev) => [auto, ...prev]);
    return auto;
  }, []);

  const updateAutomation = useCallback(async (id: string, updates: Partial<Pick<Automation, 'name' | 'trigger_event' | 'is_active'>>) => {
    await supabase.from('automations').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a)));
  }, []);

  const deleteAutomation = useCallback(async (id: string) => {
    await supabase.from('automations').delete().eq('id', id);
    setAutomations((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const toggleActive = useCallback(async (id: string) => {
    const auto = automations.find((a) => a.id === id);
    if (!auto) return;
    const newActive = !auto.is_active;
    await supabase.from('automations').update({ is_active: newActive, updated_at: new Date().toISOString() }).eq('id', id);
    setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: newActive, updated_at: new Date().toISOString() } : a)));
  }, [automations]);

  const getAutomation = useCallback((id: string) => automations.find((a) => a.id === id), [automations]);

  // Conditions
  const addCondition = useCallback(async (autoId: string, condition: Omit<AutomationCondition, 'id' | 'automation_id'>) => {
    const { data, error } = await supabase
      .from('automation_conditions')
      .insert({ automation_id: autoId, field_name: condition.field_name, operator: condition.operator, value: condition.value, sort_order: condition.sort_order })
      .select()
      .single();

    if (error || !data) return;

    const newCond: AutomationCondition = {
      id: data.id,
      automation_id: autoId,
      field_name: data.field_name,
      operator: data.operator as ConditionOperator,
      value: data.value,
      sort_order: data.sort_order,
    };

    setAutomations((prev) => prev.map((a) =>
      a.id === autoId ? { ...a, conditions: [...(a.conditions || []), newCond] } : a
    ));
  }, []);

  const removeCondition = useCallback(async (autoId: string, conditionId: string) => {
    await supabase.from('automation_conditions').delete().eq('id', conditionId);
    setAutomations((prev) => prev.map((a) =>
      a.id === autoId ? { ...a, conditions: (a.conditions || []).filter((c) => c.id !== conditionId) } : a
    ));
  }, []);

  // Actions
  const addAction = useCallback(async (autoId: string, action: Omit<AutomationAction, 'id' | 'automation_id'>) => {
    const { data, error } = await supabase
      .from('automation_actions')
      .insert({ automation_id: autoId, action_type: action.action_type, action_config: action.action_config, sort_order: action.sort_order })
      .select()
      .single();

    if (error || !data) return;

    const newAct: AutomationAction = {
      id: data.id,
      automation_id: autoId,
      action_type: data.action_type as AutomationActionType,
      action_config: data.action_config as Record<string, string>,
      sort_order: data.sort_order,
    };

    setAutomations((prev) => prev.map((a) =>
      a.id === autoId ? { ...a, actions: [...(a.actions || []), newAct] } : a
    ));
  }, []);

  const removeAction = useCallback(async (autoId: string, actionId: string) => {
    await supabase.from('automation_actions').delete().eq('id', actionId);
    setAutomations((prev) => prev.map((a) =>
      a.id === autoId ? { ...a, actions: (a.actions || []).filter((ac) => ac.id !== actionId) } : a
    ));
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
