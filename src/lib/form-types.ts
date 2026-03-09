export type FormFieldType = 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select';

export interface WebFormField {
  id: string;
  label: string;
  fieldType: FormFieldType;
  placeholder?: string;
  isRequired: boolean;
  options?: string[]; // for select
  mappedFieldKey?: string; // maps to module field key
  orderIndex: number;
}

export interface WebForm {
  id: string;
  tenantId: string;
  moduleId: string;
  formName: string;
  fieldsJSON: WebFormField[];
  successMessage: string;
  redirectUrl: string;
  isActive: boolean;
  enableRecaptcha: boolean;
  createdAt: string;
}

export interface FormSubmission {
  id: string;
  tenantId: string;
  formId: string;
  recordId?: string;
  data: Record<string, any>;
  createdAt: string;
}
