export interface Tenant {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  roleId: string;
  avatar?: string;
}

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  permissions: { [key: string]: boolean };
}

export interface Module {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  isSystem: boolean;
  orderIndex: number;
}

export type FieldType = 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'date' | 'currency' | 'checkbox' | 'select' | 'multiselect' | 'file' | 'relation' | 'user';

export interface Field {
  id: string;
  moduleId: string;
  tenantId: string;
  label: string;
  fieldKey: string;
  fieldType: FieldType;
  options?: string[];
  relationModuleId?: string;
  isRequired: boolean;
  orderIndex: number;
}

export interface CrmRecord {
  id: string;
  moduleId: string;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  values: RecordValue[];
}

export interface RecordValue {
  id: string;
  recordId: string;
  fieldId: string;
  valueText?: string;
  valueNumber?: number;
  valueDate?: string;
  valueJSON?: any;
}

export interface Pipeline {
  id: string;
  tenantId: string;
  moduleId: string;
  name: string;
  stages: PipelineStage[];
}

export interface PipelineStage {
  id: string;
  pipelineId: string;
  stageName: string;
  orderIndex: number;
  color?: string;
}

export interface Dashboard {
  id: string;
  tenantId: string;
  name: string;
  widgets: Widget[];
}

export interface Widget {
  id: string;
  dashboardId: string;
  widgetType: 'metric' | 'chart' | 'table' | 'quick_action';
  config: { [key: string]: any };
  orderIndex: number;
}

export interface ActivityLog {
  id: string;
  tenantId: string;
  recordId: string;
  type: 'record_created' | 'field_updated' | 'stage_changed';
  message: string;
  createdBy: string;
  createdAt: string;
}

export interface CRMTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  modules: Partial<Module>[];
  color: string;
}

export interface Automation {
  id: string;
  tenantId: string;
  moduleId: string;
  name: string;
  triggerType: 'record_created' | 'record_updated' | 'stage_changed';
  conditions: any;
  actions: any;
  isActive: boolean;
}

export type RelationshipType = 'one_to_many' | 'many_to_many';

export interface ModuleRelationship {
  id: string;
  tenantId: string;
  sourceModuleId: string;
  targetModuleId: string;
  relationshipType: RelationshipType;
}

export interface RecordRelation {
  id: string;
  tenantId: string;
  relationshipId: string;
  sourceRecordId: string;
  targetRecordId: string;
}
