export type NotificationType = 'task_assigned' | 'record_assigned' | 'stage_changed' | 'automation_event' | 'form_submitted';

export interface CrmNotification {
  id: string;
  tenantId: string;
  userId: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  task_assigned: 'Task Assigned',
  record_assigned: 'Record Assigned',
  stage_changed: 'Stage Changed',
  automation_event: 'Automation',
  form_submitted: 'Form Submitted',
};
