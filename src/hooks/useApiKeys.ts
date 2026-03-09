import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

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
    const { data, error } = await api.get('/api/api_keys');
    if (!error && data) setKeys((data as unknown) as ApiKey[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const createKey = useCallback(async (keyName: string) => {
    const { data, error } = await api.post('/api/api_keys', { key_name: keyName });
    if (!error && data) {
      setKeys((prev) => [data as unknown as ApiKey, ...prev]);
      return data as unknown as ApiKey;
    }
    return null;
  }, []);

  const toggleKey = useCallback(async (id: string, isActive: boolean) => {
    const { error } = await api.patch(`/api/api_keys/${id}`, { is_active: isActive });
    if (!error) setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, is_active: isActive } : k)));
  }, []);

  const deleteKey = useCallback(async (id: string) => {
    const { error } = await api.delete(`/api/api_keys/${id}`);
    if (!error) setKeys((prev) => prev.filter((k) => k.id !== id));
  }, []);

  return { keys, loading, createKey, toggleKey, deleteKey, refetch: fetchKeys };
}
