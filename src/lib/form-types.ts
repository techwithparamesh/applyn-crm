/**
 * Form and form field types for web forms and CRM modules.
 * Field types align with field-types.ts.
 */

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'url'
  | 'password'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'datetime'
  | 'time'
  | 'currency'
  | 'percentage'
  | 'rating'
  | 'score'
  | 'user'
  | 'lookup'
  | 'file'
  | 'image'
  | 'address'
  | 'location'
  | 'richtext'
  | 'autonumber'
  | 'created_at'
  | 'updated_at'
  | 'heading'
  | 'divider';

/** Section container for grouping form fields */
export interface FormSection {
  id: string;
  title: string;
  description?: string;
  layout: 'single' | 'two';
  orderIndex: number;
  collapsible?: boolean;
  border?: boolean;
}

export interface ConditionalRule {
  fieldId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'empty' | 'not_empty';
  value?: string | number | boolean;
  action: 'show' | 'hide';
}

export interface WebFormField {
  id: string;
  label: string;
  fieldType: FormFieldType;
  /** API/key name for CRM mapping (e.g. loan_amount) */
  apiName?: string;
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  defaultValue?: string | number | boolean;
  options?: string[];
  mappedFieldKey?: string;
  orderIndex: number;
  /** Section this field belongs to (null = ungrouped) */
  sectionId?: string | null;
  /** For heading block: display size */
  headingSize?: 'sm' | 'md' | 'lg';
  /** Advanced */
  minLength?: number;
  maxLength?: number;
  regex?: string;
  regexMessage?: string;
  isUnique?: boolean;
  isHidden?: boolean;
  /** Conditional visibility */
  conditionalRules?: ConditionalRule[];
}

export interface FormSubmissionBehavior {
  createRecord: boolean;
  sendEmail?: boolean;
  sendWhatsApp?: boolean;
  assignOwner?: string;
  triggerAutomation?: string;
}

export interface WebForm {
  id: string;
  tenantId: string;
  moduleId: string;
  formName: string;
  /** Public URL slug (e.g. lead-capture) for /form/lead-capture */
  publicSlug?: string;
  fieldsJSON: WebFormField[];
  /** Section definitions; order of fields is determined by sectionId + orderIndex */
  sectionsJSON?: FormSection[];
  /** Order of section/field/heading/divider ids in builder (optional; derived from sections + fields if missing) */
  layoutOrder?: string[];
  successMessage: string;
  redirectUrl: string;
  isActive: boolean;
  enableRecaptcha: boolean;
  /** Optional webhook URL for submission payload */
  webhookUrl?: string;
  submissionBehavior?: FormSubmissionBehavior;
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
