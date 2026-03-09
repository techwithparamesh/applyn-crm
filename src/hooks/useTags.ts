import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Tag {
  id: string;
  tenantId: string;
  name: string;
  color: string;
}

export interface RecordTag {
  id: string;
  recordId: string;
  tagId: string;
}

export const TAG_COLORS = [
  { key: 'blue', bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' },
  { key: 'purple', bg: 'bg-secondary/50', text: 'text-secondary-foreground', dot: 'bg-secondary' },
  { key: 'green', bg: 'bg-accent/10', text: 'text-accent-foreground', dot: 'bg-accent' },
  { key: 'red', bg: 'bg-destructive/10', text: 'text-destructive', dot: 'bg-destructive' },
  { key: 'amber', bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
  { key: 'indigo', bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' },
];

export function getTagColorClasses(colorKey: string) {
  return TAG_COLORS.find((c) => c.key === colorKey) || TAG_COLORS[0];
}

// DB-backed tag system using record_tags table
export function useTags() {
  const [tagRows, setTagRows] = useState<{ id: string; record_id: string; tag: string; color: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchTags = useCallback(async () => {
    const { data } = await supabase.from('record_tags').select('*');
    if (data) setTagRows(data as any[]);
    setLoaded(true);
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  // Derive unique tags from all rows
  const tags: Tag[] = [];
  const seen = new Set<string>();
  for (const row of tagRows) {
    if (!seen.has(row.tag)) {
      seen.add(row.tag);
      tags.push({ id: row.tag, tenantId: 't1', name: row.tag, color: row.color });
    }
  }

  const createTag = useCallback((name: string, color: string): Tag => {
    return { id: name, tenantId: 't1', name, color };
  }, []);

  const deleteTag = useCallback(async (tagId: string) => {
    await supabase.from('record_tags').delete().eq('tag', tagId);
    setTagRows(prev => prev.filter(r => r.tag !== tagId));
  }, []);

  const assignTag = useCallback(async (recordId: string, tagId: string) => {
    if (tagRows.some(r => r.record_id === recordId && r.tag === tagId)) return;
    const tag = tags.find(t => t.id === tagId);
    const color = tag?.color || 'blue';
    const { data } = await supabase
      .from('record_tags')
      .insert({ record_id: recordId, tag: tagId, color } as any)
      .select()
      .maybeSingle();
    if (data) {
      setTagRows(prev => [...prev, data as any]);
    }
  }, [tagRows, tags]);

  const removeTag = useCallback(async (recordId: string, tagId: string) => {
    await supabase.from('record_tags').delete().eq('record_id', recordId).eq('tag', tagId);
    setTagRows(prev => prev.filter(r => !(r.record_id === recordId && r.tag === tagId)));
  }, []);

  const getRecordTags = useCallback((recordId: string): Tag[] => {
    return tagRows
      .filter(r => r.record_id === recordId)
      .map(r => ({ id: r.tag, tenantId: 't1', name: r.tag, color: r.color }));
  }, [tagRows]);

  return { tags, recordTags: tagRows, createTag, deleteTag, assignTag, removeTag, getRecordTags };
}
