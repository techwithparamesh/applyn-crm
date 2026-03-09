import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { api, isUsingMySQL } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

export interface Note {
  id: string;
  recordId: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

function mapRow(row: any): Note {
  return {
    id: row.id,
    recordId: row.record_id,
    content: row.content,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function useNotes(recordId: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id || 't1';
  const userName = profile?.name || 'User';

  const fetchNotes = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);
    if (isUsingMySQL()) {
      const { data } = await api.get('/api/notes', { record_id: recordId });
      if (data) setNotes((data as any[]).map(mapRow));
    } else {
      const { data } = await supabase.from('notes').select('*').eq('record_id', recordId).order('created_at', { ascending: false });
      if (data) setNotes(data.map(mapRow));
    }
    setLoading(false);
  }, [recordId]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const addNote = useCallback(async (content: string) => {
    if (isUsingMySQL()) {
      const { data } = await api.post('/api/notes', { record_id: recordId, content, created_by: userName });
      if (data) setNotes(prev => [mapRow(data), ...prev]);
    } else {
      const { data } = await supabase.from('notes').insert({ record_id: recordId, content, created_by: userName, tenant_id: tenantId } as any).select().single();
      if (data) setNotes(prev => [mapRow(data), ...prev]);
    }
  }, [recordId, userName, tenantId]);

  const deleteNote = useCallback(async (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    if (isUsingMySQL()) {
      await api.delete(`/api/notes/${noteId}`);
    } else {
      await supabase.from('notes').delete().eq('id', noteId);
    }
  }, []);

  return { notes, loading, addNote, deleteNote };
}
