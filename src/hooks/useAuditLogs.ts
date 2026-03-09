import { useState, useCallback } from 'react';
import { AuditLog } from '@/lib/audit-types';

// Singleton so audit logs persist across hook instances
let globalAuditLogs: AuditLog[] = [];
let listeners: Set<() => void> = new Set();
function notify() { listeners.forEach((l) => l()); }

export function useAuditLogs() {
  const [, forceUpdate] = useState(0);

  useState(() => {
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  });

  const logChange = useCallback((
    entityType: AuditLog['entityType'],
    entityId: string,
    action: AuditLog['action'],
    opts: { oldValue?: string | null; newValue?: string | null; fieldLabel?: string; changedBy?: string } = {}
  ) => {
    const entry: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenantId: 't1',
      entityType,
      entityId,
      action,
      oldValue: opts.oldValue ?? null,
      newValue: opts.newValue ?? null,
      fieldLabel: opts.fieldLabel,
      changedBy: opts.changedBy || 'John Doe',
      createdAt: new Date().toISOString(),
    };
    globalAuditLogs = [entry, ...globalAuditLogs];
    notify();
    return entry;
  }, []);

  const getEntityLogs = useCallback((entityId: string): AuditLog[] => {
    return globalAuditLogs.filter((l) => l.entityId === entityId);
  }, []);

  const getAllLogs = useCallback((): AuditLog[] => {
    return globalAuditLogs;
  }, []);

  return { logChange, getEntityLogs, getAllLogs };
}
