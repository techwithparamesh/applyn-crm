import { useState, useCallback, useMemo, useEffect } from 'react';
import { api } from '@/lib/api';
import { ActivityLog } from '@/lib/types';
import { AdvancedFilter, applyAdvancedFilter, createEmptyFilter } from '@/lib/filter-types';
import { useAuth } from '@/components/AuthProvider';
import { useAutomationTrigger } from '@/hooks/useAutomationTrigger';

export interface CrmRecord {
  id: string;
  moduleId: string;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  stage?: string;
  values: Record<string, any>;
}

// Keep backward-compat alias
export type MockRecord = CrmRecord;

export interface MockNote {
  id: string;
  recordId: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface MockFile {
  id: string;
  recordId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
}

type SortDirection = 'asc' | 'desc';

interface UseRecordsOptions {
  moduleId: string;
  pageSize?: number;
}

function mapRow(row: any): CrmRecord {
  const vals = (typeof row.values === 'object' && row.values) ? row.values as Record<string, any> : {};
  return {
    id: row.id,
    moduleId: row.module_id,
    tenantId: row.tenant_id,
    createdBy: row.created_by || 'Unknown',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    stage: vals.stage || vals.status,
    values: vals,
  };
}

export function useRecords({ moduleId, pageSize = 10 }: UseRecordsOptions) {
  const [records, setRecords] = useState<CrmRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [advancedFilter, setAdvancedFilter] = useState<AdvancedFilter>(createEmptyFilter());
  const [page, setPage] = useState(1);
  const { profile } = useAuth();
  const { triggerAutomation } = useAutomationTrigger();

  // Fetch records from DB
  const fetchRecords = useCallback(async () => {
    if (!moduleId) return;
    setLoading(true);
    const { data, error } = await api.get('/api/crm_records', { module_id: moduleId });
    if (!error && data) setRecords((data as any[]).map(mapRow));
    setLoading(false);
  }, [moduleId]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const filtered = useMemo(() => {
    let result = [...records];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) =>
        Object.values(r.values).some((v) => String(v).toLowerCase().includes(q))
      );
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value) result = result.filter((r) => String(r.values[key]) === value);
    });

    if (advancedFilter.conditions.length > 0) {
      result = result.filter((r) => applyAdvancedFilter(advancedFilter, r.values));
    }

    if (sortField) {
      result.sort((a, b) => {
        const aVal = a.values[sortField] ?? '';
        const bVal = b.values[sortField] ?? '';
        const cmp = typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [records, search, sortField, sortDir, filters, advancedFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }, [sortField]);

  const createRecord = useCallback(async (values: Record<string, any>): Promise<CrmRecord> => {
    const userName = profile?.name || 'User';
    const res = await api.post('/api/crm_records', { module_id: moduleId, created_by: userName, values });
    const data = res.data;

    const rec = data ? mapRow(data) : {
      id: `r-${Date.now()}`,
      moduleId,
      tenantId: 't1',
      createdBy: userName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      values,
    };
    setRecords((prev) => [rec, ...prev]);
    // Fire automation trigger asynchronously
    triggerAutomation(moduleId, 'record_created', { id: rec.id, values });
    return rec;
  }, [moduleId, profile, triggerAutomation]);

  const updateRecord = useCallback(async (recordId: string, values: Record<string, any>) => {
    const current = records.find(r => r.id === recordId);
    const oldValues = current?.values || {};
    // Optimistic update
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? { ...r, values: { ...r.values, ...values }, updatedAt: new Date().toISOString() }
          : r
      )
    );
    const merged = { ...oldValues, ...values };
    await api.patch(`/api/crm_records/${recordId}`, { values: merged });

    // Detect stage change
    const stageKey = values.stage !== undefined ? 'stage' : values.status !== undefined ? 'status' : null;
    if (stageKey && oldValues[stageKey] !== values[stageKey]) {
      triggerAutomation(moduleId, 'stage_changed', { id: recordId, values: merged });
    } else {
      triggerAutomation(moduleId, 'record_updated', { id: recordId, values: merged });
    }
  }, [records, moduleId, triggerAutomation]);

  const deleteRecord = useCallback(async (recordId: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
    await api.patch(`/api/crm_records/${recordId}`, { deleted_at: new Date().toISOString() });
  }, []);

  const getRecord = useCallback((recordId: string) => {
    return records.find((r) => r.id === recordId);
  }, [records]);

  return {
    records: paginated,
    allRecords: records,
    totalCount: filtered.length,
    loading,
    page,
    totalPages,
    setPage,
    search,
    setSearch,
    sortField,
    sortDir,
    toggleSort,
    filters,
    setFilters,
    advancedFilter,
    setAdvancedFilter,
    createRecord,
    updateRecord,
    deleteRecord,
    getRecord,
    refetch: fetchRecords,
  };
}

export function useRecordActivities(recordId: string) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  const addActivity = useCallback((type: ActivityLog['type'], message: string) => {
    const newActivity: ActivityLog = {
      id: `a-${Date.now()}`,
      tenantId: 't1',
      recordId,
      type,
      message,
      createdBy: 'Current User',
      createdAt: new Date().toISOString(),
    };
    setActivities((prev) => [newActivity, ...prev]);
  }, [recordId]);

  return { activities, addActivity };
}

// Notes and Files hooks have been moved to useNotes.ts and useFiles.ts
