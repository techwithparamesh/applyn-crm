export interface AuditLog {
  id: string;
  tenantId: string;
  entityType: 'record' | 'module' | 'pipeline' | 'tag' | 'note' | 'email' | 'whatsapp';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  oldValue: string | null;
  newValue: string | null;
  fieldLabel?: string;
  changedBy: string;
  createdAt: string;
}
