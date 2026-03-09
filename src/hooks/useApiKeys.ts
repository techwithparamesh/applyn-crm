import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { api, isUsingMySQL } from '@/lib/api';

export interface ApiKey {
  id: string;
  tenant_id: string;
  key_name: string;
  api_key: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    if (isUsingMySQL()) {
      const { data, error } = await api.get('/api/api_keys');
      if (!error && data) setKeys((data as unknown) as ApiKey[]);
    } else {
      const { data, error } = await supabase.from('api_keys').select('*').order('created_at', { ascending: false });
      if (!error && data) setKeys(data as unknown as ApiKey[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const createKey = useCallback(async (keyName: string) => {
    if (isUsingMySQL()) {
      const { data, error } = await api.post('/api/api_keys', { key_name: keyName });
      if (!error && data) {
        setKeys((prev) => [data as unknown as ApiKey, ...prev]);
        return data as unknown as ApiKey;
      }
    } else {
      const { data, error } = await supabase.from('api_keys').insert({ key_name: keyName }).select().single();
      if (!error && data) {
        setKeys((prev) => [data as unknown as ApiKey, ...prev]);
        return data as unknown as ApiKey;
      }
    }
    return null;
  }, []);

  const toggleKey = useCallback(async (id: string, isActive: boolean) => {
    if (isUsingMySQL()) {
      const { error } = await api.patch(`/api/api_keys/${id}`, { is_active: isActive });
      if (!error) setKeys((prev) => prev.map((k) => k.id === id ? { ...k, is_active: isActive } : k));
    } else {
      const { error } = await supabase.from('api_keys').update({ is_active: isActive }).eq('id', id);
      if (!error) setKeys((prev) => prev.map((k) => k.id === id ? { ...k, is_active: isActive } : k));
    }
  }, []);

  const deleteKey = useCallback(async (id: string) => {
    if (isUsingMySQL()) {
      const { error } = await api.delete(`/api/api_keys/${id}`);
      if (!error) setKeys((prev) => prev.filter((k) => k.id !== id));
    } else {
      const { error } = await supabase.from('api_keys').delete().eq('id', id);
      if (!error) setKeys((prev) => prev.filter((k) => k.id !== id));
    }
  }, []);

  return { keys, loading, createKey, toggleKey, deleteKey, refetch: fetchKeys };
}
