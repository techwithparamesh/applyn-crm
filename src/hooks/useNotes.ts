import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
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
  const userName = profile?.name || 'User';

  const fetchNotes = useCallback(async () => {
    if (!recordId) return;
    setLoading(true);
    const { data } = await api.get('/api/notes', { record_id: recordId });
    if (data) setNotes((data as any[]).map(mapRow));
    setLoading(false);
  }, [recordId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = useCallback(
    async (content: string) => {
      const { data } = await api.post('/api/notes', { record_id: recordId, content, created_by: userName });
      if (data) setNotes((prev) => [mapRow(data), ...prev]);
    },
    [recordId, userName]
  );

  const deleteNote = useCallback(async (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    await api.delete(`/api/notes/${noteId}`);
  }, []);

  return { notes, loading, addNote, deleteNote };
}
