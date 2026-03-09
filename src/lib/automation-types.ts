export type AutomationTriggerType = 'record_created' | 'record_updated' | 'stage_changed' | 'form_submitted';

export type ConditionOperator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';

export type AutomationActionType = 'assign_owner' | 'send_email' | 'send_whatsapp' | 'create_task' | 'update_field';

export interface AutomationCondition {
  id: string;
  automation_id?: string;
  field_name: string;
  operator: ConditionOperator;
  value: string;
  sort_order: number;
}

export interface AutomationAction {
  id: string;
  automation_id?: string;
  action_type: AutomationActionType;
  action_config: Record<string, string>;
  sort_order: number;
}

export interface Automation {
  id: string;
  tenant_id: string;
  module_id: string;
  name: string;
  trigger_event: AutomationTriggerType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  conditions?: AutomationCondition[];
  actions?: AutomationAction[];
}

export const TRIGGER_LABELS: Record<AutomationTriggerType, string> = {
  record_created: 'Record Created',
  record_updated: 'Record Updated',
  stage_changed: 'Stage Changed',
  form_submitted: 'Form Submitted',
};

export const ACTION_LABELS: Record<AutomationActionType, string> = {
  assign_owner: 'Assign Owner',
  send_email: 'Send Email',
  send_whatsapp: 'Send WhatsApp',
  create_task: 'Create Task',
  update_field: 'Update Field',
};

export const CONDITION_OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: 'Equals',
  not_equals: 'Does not equal',
  contains: 'Contains',
  greater_than: 'Greater than',
  less_than: 'Less than',
};
