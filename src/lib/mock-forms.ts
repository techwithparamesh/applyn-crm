import { WebForm, FormSubmission } from './form-types';

export const mockWebForms: WebForm[] = [
  {
    id: 'wf1',
    tenantId: 't1',
    moduleId: '1',
    formName: 'Lead Capture Form',
    fieldsJSON: [
      { id: 'wf1-f1', label: 'Full Name', fieldType: 'text', placeholder: 'Your name', isRequired: true, mappedFieldKey: 'full_name', orderIndex: 0 },
      { id: 'wf1-f2', label: 'Email', fieldType: 'email', placeholder: 'you@company.com', isRequired: true, mappedFieldKey: 'email', orderIndex: 1 },
      { id: 'wf1-f3', label: 'Phone', fieldType: 'phone', placeholder: '+1 555-0000', isRequired: false, mappedFieldKey: 'phone', orderIndex: 2 },
      { id: 'wf1-f4', label: 'Company', fieldType: 'text', placeholder: 'Company name', isRequired: false, mappedFieldKey: 'company', orderIndex: 3 },
      { id: 'wf1-f5', label: 'Message', fieldType: 'textarea', placeholder: 'How can we help?', isRequired: false, orderIndex: 4 },
    ],
    successMessage: 'Thank you! We will be in touch soon.',
    redirectUrl: '',
    isActive: true,
    enableRecaptcha: false,
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'wf2',
    tenantId: 't1',
    moduleId: '2',
    formName: 'Contact Us',
    fieldsJSON: [
      { id: 'wf2-f1', label: 'Name', fieldType: 'text', placeholder: 'Your name', isRequired: true, mappedFieldKey: 'name', orderIndex: 0 },
      { id: 'wf2-f2', label: 'Email', fieldType: 'email', placeholder: 'you@email.com', isRequired: true, mappedFieldKey: 'email', orderIndex: 1 },
    ],
    successMessage: 'Thanks for reaching out!',
    redirectUrl: '',
    isActive: false,
    enableRecaptcha: true,
    createdAt: '2026-03-03T14:00:00Z',
  },
];

export const mockFormSubmissions: FormSubmission[] = [
  { id: 'fs1', tenantId: 't1', formId: 'wf1', recordId: 'r1', data: { full_name: 'Sarah Chen', email: 'sarah@acme.co', phone: '+1 555-0101', company: 'Acme Corp' }, createdAt: '2026-03-07T10:00:00Z' },
  { id: 'fs2', tenantId: 't1', formId: 'wf1', data: { full_name: 'Test User', email: 'test@example.com' }, createdAt: '2026-03-06T15:00:00Z' },
];
