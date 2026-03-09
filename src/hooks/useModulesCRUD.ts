import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

export interface DbModule {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  is_system: boolean;
  order_index: number;
  created_at: string;
}

/** Field settings (placeholder, default_value, validation) stored in settings_json */
export interface FieldSettings {
  placeholder?: string;
  default_value?: string;
  min_length?: number;
  max_length?: number;
  regex?: string;
  help_text?: string;
}

export interface DbField {
  id: string;
  module_id: string;
  tenant_id: string;
  name: string;
  label: string;
  field_type: string;
  is_required: boolean;
  options_json: string[] | null;
  settings_json?: FieldSettings | null;
  order_index: number;
  created_at: string;
}

export function useModules() {
  const [modules, setModules] = useState<DbModule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModules = useCallback(async () => {
    setLoading(true);
    const { data, error } = await api.get('/api/modules');
    if (!error && data) setModules((data as unknown) as DbModule[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const createModule = useCallback(async (input: { name: string; slug: string; icon?: string; color?: string; description?: string }) => {
    const maxOrder = modules.length > 0 ? Math.max(...modules.map((m) => m.order_index)) + 1 : 0;
    const payload = {
      name: input.name,
      slug: input.slug,
      icon: input.icon || 'Boxes',
      color: input.color || '#7C3AED',
      description: input.description || '',
      order_index: maxOrder,
    };
    const { data, error } = await api.post('/api/modules', payload);
    if (!error && data) {
      const mod = data as unknown as DbModule;
      setModules((prev) => [...prev, mod]);
      return mod;
    }
    return null;
  }, [modules]);

  const updateModule = useCallback(async (id: string, updates: Partial<Pick<DbModule, 'name' | 'slug' | 'icon' | 'color' | 'description'>>) => {
    const { error } = await api.patch(`/api/modules/${id}`, updates);
    if (!error) setModules((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  }, []);

  const deleteModule = useCallback(async (id: string) => {
    const { error } = await api.delete(`/api/modules/${id}`);
    if (!error) setModules((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return { modules, loading, fetchModules, createModule, updateModule, deleteModule };
}

export function useFields(moduleId: string) {
  const [fields, setFields] = useState<DbField[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFields = useCallback(async () => {
    if (!moduleId) {
      setFields([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await api.get('/api/module_fields', { module_id: moduleId });
    if (!error && data) setFields((data as unknown) as DbField[]);
    setLoading(false);
  }, [moduleId]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const createField = useCallback(
    async (input: { name: string; label: string; field_type: string; is_required?: boolean; options_json?: string[]; settings_json?: FieldSettings | null }) => {
      const maxOrder = fields.length > 0 ? Math.max(...fields.map((f) => f.order_index)) + 1 : 0;
      const payload = {
        module_id: moduleId,
        name: input.name,
        label: input.label,
        field_type: input.field_type,
        is_required: input.is_required || false,
        options_json: input.options_json || [],
        settings_json: input.settings_json || null,
        order_index: maxOrder,
      };
      const { data, error } = await api.post('/api/module_fields', payload);
      if (!error && data) {
        const field = data as unknown as DbField;
        setFields((prev) => [...prev, field]);
        return field;
      }
      return null;
    },
    [moduleId, fields]
  );

  const updateField = useCallback(async (id: string, updates: Partial<Pick<DbField, 'label' | 'name' | 'field_type' | 'is_required' | 'options_json' | 'settings_json' | 'order_index'>>) => {
    const { error } = await api.patch(`/api/module_fields/${id}`, updates);
    if (!error) setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }, []);

  const deleteField = useCallback(async (id: string) => {
    const { error } = await api.delete(`/api/module_fields/${id}`);
    if (!error) setFields((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const reorderFields = useCallback(async (orderedIds: string[]) => {
    await Promise.all(orderedIds.map((id, i) => api.patch(`/api/module_fields/${id}`, { order_index: i })));
    setFields((prev) => {
      const map = new Map(prev.map((f) => [f.id, f]));
      return orderedIds.map((id, i) => ({ ...map.get(id)!, order_index: i }));
    });
  }, []);

  return { fields, loading, fetchFields, createField, updateField, deleteField, reorderFields };
}

export function toField(f: DbField): import('@/lib/types').Field {
  return {
    id: f.id,
    moduleId: f.module_id,
    name: f.name,
    label: f.label,
    fieldType: f.field_type as any,
    isRequired: f.is_required,
    options: f.options_json || [],
    orderIndex: f.order_index,
  };
}
