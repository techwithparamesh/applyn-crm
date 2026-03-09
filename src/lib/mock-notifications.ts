import { CrmNotification } from './notification-types';

export const mockNotifications: CrmNotification[] = [
  { id: 'n1', tenantId: 't1', userId: 'u1', type: 'record_assigned', message: 'You were assigned lead "Sarah Chen"', isRead: false, createdAt: '2026-03-08T09:30:00Z', link: '/modules/1/records/r1' },
  { id: 'n2', tenantId: 't1', userId: 'u1', type: 'stage_changed', message: 'Deal "Acme Enterprise" moved to Proposal', isRead: false, createdAt: '2026-03-08T08:15:00Z', link: '/modules/3/records/r20' },
  { id: 'n3', tenantId: 't1', userId: 'u1', type: 'task_assigned', message: 'New task: Follow up with James Wilson', isRead: false, createdAt: '2026-03-07T16:00:00Z' },
  { id: 'n4', tenantId: 't1', userId: 'u1', type: 'automation_event', message: 'Automation "Auto-assign new leads" triggered', isRead: true, createdAt: '2026-03-07T14:30:00Z' },
  { id: 'n5', tenantId: 't1', userId: 'u1', type: 'form_submitted', message: 'New submission on "Lead Capture Form"', isRead: true, createdAt: '2026-03-07T11:00:00Z', link: '/forms' },
  { id: 'n6', tenantId: 't1', userId: 'u1', type: 'stage_changed', message: 'Lead "Maria Garcia" moved to Contacted', isRead: true, createdAt: '2026-03-06T15:45:00Z', link: '/modules/1/records/r3' },
  { id: 'n7', tenantId: 't1', userId: 'u1', type: 'record_assigned', message: 'You were assigned deal "TechStart Integration"', isRead: true, createdAt: '2026-03-06T10:00:00Z', link: '/modules/3/records/r21' },
];
