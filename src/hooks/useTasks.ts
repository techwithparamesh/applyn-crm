import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

export interface Task {
  id: string;
  tenantId: string;
  recordId: string | null;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  assignedTo: string | null;
  createdBy: string;
  createdAt: string;
}

function mapRow(row: any): Task {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    recordId: row.record_id,
    title: row.title,
    description: row.description || '',
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    assignedTo: row.assigned_to,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function useTasks(recordId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const userName = profile?.name || 'User';

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get('/api/tasks');
    if (data) {
      let list = (data as any[]).map(mapRow);
      if (recordId) list = list.filter((t: Task) => t.recordId === recordId);
      setTasks(list);
    }
    setLoading(false);
  }, [recordId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(
    async (values: { title: string; description?: string; priority?: string; dueDate?: string; recordId?: string }) => {
      const payload = {
        title: values.title,
        description: values.description || '',
        priority: values.priority || 'medium',
        due_date: values.dueDate || null,
        record_id: values.recordId || recordId || null,
        created_by: userName,
      };
      const { data } = await api.post('/api/tasks', payload);
      if (data) setTasks((prev) => [mapRow(data), ...prev]);
    },
    [userName, recordId]
  );

  const updateTask = useCallback(async (taskId: string, updates: Partial<{ title: string; description: string; status: string; priority: string; dueDate: string }>) => {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? ({ ...t, ...updates } as Task) : t)));
    await api.patch(`/api/tasks/${taskId}`, dbUpdates);
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await api.delete(`/api/tasks/${taskId}`);
  }, []);

  return { tasks, loading, createTask, updateTask, deleteTask, refetch: fetchTasks };
}
