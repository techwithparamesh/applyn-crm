/**
 * Central config for all CRM/form field types.
 * Used by Form Builder, Module Field Builder, and record forms.
 */

export type FieldTypeCategory = 'basic' | 'selection' | 'date' | 'crm' | 'relationship' | 'advanced' | 'system';

export interface FieldTypeConfig {
  type: string;
  label: string;
  icon: string; // Lucide icon name
  category: FieldTypeCategory;
  supportsOptions?: boolean;
  supportsMinMax?: boolean;
  supportsRegex?: boolean;
}

export const FIELD_TYPE_CATEGORIES: { id: FieldTypeCategory; label: string }[] = [
  { id: 'basic', label: 'Basic' },
  { id: 'selection', label: 'Selection' },
  { id: 'date', label: 'Date' },
  { id: 'crm', label: 'CRM-specific' },
  { id: 'relationship', label: 'Relationship' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'system', label: 'System' },
];

export const FIELD_TYPES: FieldTypeConfig[] = [
  // Basic
  { type: 'text', label: 'Text', icon: 'Type', category: 'basic' },
  { type: 'textarea', label: 'Textarea', icon: 'AlignLeft', category: 'basic', supportsMinMax: true },
  { type: 'email', label: 'Email', icon: 'Mail', category: 'basic' },
  { type: 'phone', label: 'Phone', icon: 'Phone', category: 'basic' },
  { type: 'number', label: 'Number', icon: 'Hash', category: 'basic', supportsMinMax: true },
  { type: 'url', label: 'URL', icon: 'Link', category: 'basic' },
  { type: 'password', label: 'Password', icon: 'Lock', category: 'basic' },
  // Selection
  { type: 'select', label: 'Dropdown', icon: 'ListFilter', category: 'selection', supportsOptions: true },
  { type: 'multiselect', label: 'Multi Select', icon: 'List', category: 'selection', supportsOptions: true },
  { type: 'radio', label: 'Radio Button', icon: 'Circle', category: 'selection', supportsOptions: true },
  { type: 'checkbox', label: 'Checkbox', icon: 'CheckSquare', category: 'selection' },
  // Date
  { type: 'date', label: 'Date', icon: 'Calendar', category: 'date' },
  { type: 'datetime', label: 'Date & Time', icon: 'CalendarClock', category: 'date' },
  { type: 'time', label: 'Time', icon: 'Clock', category: 'date' },
  // CRM-specific
  { type: 'currency', label: 'Currency', icon: 'DollarSign', category: 'crm', supportsMinMax: true },
  { type: 'percentage', label: 'Percentage', icon: 'Percent', category: 'crm', supportsMinMax: true },
  { type: 'rating', label: 'Rating', icon: 'Star', category: 'crm' },
  { type: 'score', label: 'Score', icon: 'TrendingUp', category: 'crm', supportsMinMax: true },
  // Relationship
  { type: 'user', label: 'User (Assign Owner)', icon: 'User', category: 'relationship' },
  { type: 'lookup', label: 'Lookup', icon: 'Search', category: 'relationship' },
  // Advanced
  { type: 'file', label: 'File Upload', icon: 'Upload', category: 'advanced' },
  { type: 'image', label: 'Image Upload', icon: 'Image', category: 'advanced' },
  { type: 'address', label: 'Address', icon: 'MapPin', category: 'advanced' },
  { type: 'location', label: 'Location', icon: 'Map', category: 'advanced' },
  { type: 'richtext', label: 'Rich Text', icon: 'FileText', category: 'advanced' },
  // System
  { type: 'autonumber', label: 'Auto Number', icon: 'Hash', category: 'system' },
  { type: 'created_at', label: 'Created Date', icon: 'CalendarPlus', category: 'system' },
  { type: 'updated_at', label: 'Updated Date', icon: 'CalendarCheck', category: 'system' },
];

export const FIELD_TYPES_BY_TYPE = Object.fromEntries(FIELD_TYPES.map((f) => [f.type, f]));

export function getFieldTypesByCategory(): Record<FieldTypeCategory, FieldTypeConfig[]> {
  const map = {} as Record<FieldTypeCategory, FieldTypeConfig[]>;
  for (const cat of FIELD_TYPE_CATEGORIES) {
    map[cat.id] = FIELD_TYPES.filter((f) => f.category === cat.id);
  }
  return map;
}

/** Generate API-safe name from label (e.g. "Loan Amount" -> "loan_amount") */
export function labelToApiName(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}
