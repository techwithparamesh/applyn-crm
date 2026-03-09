import { Module, Pipeline, CRMTemplate, ActivityLog, Field } from './types';

export const mockModules: Module[] = [
  { id: '1', tenantId: 't1', name: 'Leads', slug: 'leads', icon: 'Users', description: 'Track and manage leads', isSystem: true, orderIndex: 0 },
  { id: '2', tenantId: 't1', name: 'Contacts', slug: 'contacts', icon: 'Contact', description: 'Manage contacts', isSystem: true, orderIndex: 1 },
  { id: '3', tenantId: 't1', name: 'Deals', slug: 'deals', icon: 'Handshake', description: 'Track deals and revenue', isSystem: true, orderIndex: 2 },
  { id: '4', tenantId: 't1', name: 'Tasks', slug: 'tasks', icon: 'CheckSquare', description: 'Manage tasks', isSystem: true, orderIndex: 3 },
  { id: '5', tenantId: 't1', name: 'Companies', slug: 'companies', icon: 'Building2', description: 'Track companies', isSystem: false, orderIndex: 4 },
];

export const mockFields: Record<string, Field[]> = {
  '1': [
    { id: 'f1', moduleId: '1', tenantId: 't1', label: 'Full Name', fieldKey: 'full_name', fieldType: 'text', isRequired: true, orderIndex: 0 },
    { id: 'f2', moduleId: '1', tenantId: 't1', label: 'Email', fieldKey: 'email', fieldType: 'email', isRequired: true, orderIndex: 1 },
    { id: 'f3', moduleId: '1', tenantId: 't1', label: 'Phone', fieldKey: 'phone', fieldType: 'phone', isRequired: false, orderIndex: 2 },
    { id: 'f4', moduleId: '1', tenantId: 't1', label: 'Company', fieldKey: 'company', fieldType: 'text', isRequired: false, orderIndex: 3 },
    { id: 'f5', moduleId: '1', tenantId: 't1', label: 'Status', fieldKey: 'status', fieldType: 'select', options: ['New', 'Contacted', 'Qualified', 'Lost'], isRequired: true, orderIndex: 4 },
    { id: 'f6', moduleId: '1', tenantId: 't1', label: 'Value', fieldKey: 'value', fieldType: 'currency', isRequired: false, orderIndex: 5 },
    { id: 'f7', moduleId: '1', tenantId: 't1', label: 'Source', fieldKey: 'source', fieldType: 'select', options: ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Event'], isRequired: false, orderIndex: 6 },
    { id: 'f8', moduleId: '1', tenantId: 't1', label: 'Notes', fieldKey: 'notes', fieldType: 'textarea', isRequired: false, orderIndex: 7 },
  ],
  '2': [
    { id: 'f10', moduleId: '2', tenantId: 't1', label: 'Name', fieldKey: 'name', fieldType: 'text', isRequired: true, orderIndex: 0 },
    { id: 'f11', moduleId: '2', tenantId: 't1', label: 'Email', fieldKey: 'email', fieldType: 'email', isRequired: true, orderIndex: 1 },
    { id: 'f12', moduleId: '2', tenantId: 't1', label: 'Phone', fieldKey: 'phone', fieldType: 'phone', isRequired: false, orderIndex: 2 },
    { id: 'f13', moduleId: '2', tenantId: 't1', label: 'Company', fieldKey: 'company', fieldType: 'text', isRequired: false, orderIndex: 3 },
    { id: 'f14', moduleId: '2', tenantId: 't1', label: 'Title', fieldKey: 'title', fieldType: 'text', isRequired: false, orderIndex: 4 },
  ],
  '3': [
    { id: 'f20', moduleId: '3', tenantId: 't1', label: 'Deal Name', fieldKey: 'deal_name', fieldType: 'text', isRequired: true, orderIndex: 0 },
    { id: 'f21', moduleId: '3', tenantId: 't1', label: 'Amount', fieldKey: 'amount', fieldType: 'currency', isRequired: true, orderIndex: 1 },
    { id: 'f22', moduleId: '3', tenantId: 't1', label: 'Close Date', fieldKey: 'close_date', fieldType: 'date', isRequired: false, orderIndex: 2 },
    { id: 'f23', moduleId: '3', tenantId: 't1', label: 'Stage', fieldKey: 'stage', fieldType: 'select', options: ['Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'], isRequired: true, orderIndex: 3 },
    { id: 'f24', moduleId: '3', tenantId: 't1', label: 'Contact', fieldKey: 'contact', fieldType: 'text', isRequired: false, orderIndex: 4 },
  ],
};

export interface MockRecord {
  id: string;
  moduleId: string;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  stage?: string;
  values: Record<string, any>;
}

export const mockRecords: Record<string, MockRecord[]> = {
  '1': [
    { id: 'r1', moduleId: '1', tenantId: 't1', createdBy: 'John Doe', createdAt: '2026-03-07T10:00:00Z', updatedAt: '2026-03-07T14:30:00Z', stage: 'Proposal', values: { full_name: 'Sarah Chen', email: 'sarah@acme.co', phone: '+1 555-0101', company: 'Acme Corp', status: 'Qualified', value: 25000, source: 'Website', notes: 'Very interested in enterprise plan. Follow up next week.' } },
    { id: 'r2', moduleId: '1', tenantId: 't1', createdBy: 'John Doe', createdAt: '2026-03-06T10:15:00Z', updatedAt: '2026-03-06T10:15:00Z', stage: 'New', values: { full_name: 'James Wilson', email: 'james@tech.io', phone: '+1 555-0102', company: 'TechStart', status: 'New', value: 15000, source: 'LinkedIn' } },
    { id: 'r3', moduleId: '1', tenantId: 't1', createdBy: 'John Doe', createdAt: '2026-03-05T09:00:00Z', updatedAt: '2026-03-05T16:45:00Z', stage: 'Contacted', values: { full_name: 'Maria Garcia', email: 'maria@global.com', phone: '+1 555-0103', company: 'Global Inc', status: 'Contacted', value: 42000, source: 'Referral', notes: 'Referred by Alex Turner.' } },
    { id: 'r4', moduleId: '1', tenantId: 't1', createdBy: 'John Doe', createdAt: '2026-03-04T08:00:00Z', updatedAt: '2026-03-04T09:20:00Z', stage: 'Proposal', values: { full_name: 'Alex Turner', email: 'alex@nova.dev', phone: '+1 555-0104', company: 'Nova Dev', status: 'Qualified', value: 18000, source: 'Event' } },
    { id: 'r5', moduleId: '1', tenantId: 't1', createdBy: 'John Doe', createdAt: '2026-03-03T11:00:00Z', updatedAt: '2026-03-03T11:00:00Z', stage: 'New', values: { full_name: 'Priya Patel', email: 'priya@designhub.co', phone: '+1 555-0105', company: 'DesignHub', status: 'New', value: 32000, source: 'Cold Call' } },
    { id: 'r6', moduleId: '1', tenantId: 't1', createdBy: 'John Doe', createdAt: '2026-03-02T07:30:00Z', updatedAt: '2026-03-02T07:30:00Z', stage: 'Contacted', values: { full_name: 'David Kim', email: 'david@startup.ai', phone: '+1 555-0106', company: 'StartupAI', status: 'Contacted', value: 55000, source: 'Website' } },
  ],
  '2': [
    { id: 'r10', moduleId: '2', tenantId: 't1', createdBy: 'John Doe', createdAt: '2026-03-06T08:00:00Z', updatedAt: '2026-03-06T08:00:00Z', values: { name: 'Emily Johnson', email: 'emily@acme.co', phone: '+1 555-0201', company: 'Acme Corp', title: 'VP of Sales' } },
    { id: 'r11', moduleId: '2', tenantId: 't1', createdBy: 'John Doe', createdAt: '2026-03-05T14:00:00Z', updatedAt: '2026-03-05T14:00:00Z', values: { name: 'Michael Brown', email: 'michael@techstart.io', phone: '+1 555-0202', company: 'TechStart', title: 'CTO' } },
  ],
  '3': [
    { id: 'r20', moduleId: '3', tenantId: 't1', createdBy: 'John Doe', createdAt: '2026-03-07T09:00:00Z', updatedAt: '2026-03-07T09:00:00Z', stage: 'Proposal', values: { deal_name: 'Acme Enterprise Deal', amount: 125000, close_date: '2026-04-15', stage: 'Proposal', contact: 'Sarah Chen' } },
    { id: 'r21', moduleId: '3', tenantId: 't1', createdBy: 'John Doe', createdAt: '2026-03-06T11:00:00Z', updatedAt: '2026-03-06T11:00:00Z', stage: 'Discovery', values: { deal_name: 'TechStart Integration', amount: 45000, close_date: '2026-05-01', stage: 'Discovery', contact: 'James Wilson' } },
  ],
};

export const mockActivities: ActivityLog[] = [
  { id: 'a1', tenantId: 't1', recordId: 'r1', type: 'stage_changed', message: 'Stage changed to Proposal', createdBy: 'John Doe', createdAt: '2026-03-07T14:30:00Z' },
  { id: 'a2', tenantId: 't1', recordId: 'r1', type: 'field_updated', message: 'Value updated to $25,000', createdBy: 'John Doe', createdAt: '2026-03-07T12:00:00Z' },
  { id: 'a3', tenantId: 't1', recordId: 'r1', type: 'record_created', message: 'Record created', createdBy: 'John Doe', createdAt: '2026-03-07T10:00:00Z' },
  { id: 'a4', tenantId: 't1', recordId: 'r2', type: 'record_created', message: 'Record created', createdBy: 'John Doe', createdAt: '2026-03-06T10:15:00Z' },
  { id: 'a5', tenantId: 't1', recordId: 'r3', type: 'field_updated', message: 'Value updated to $42,000', createdBy: 'John Doe', createdAt: '2026-03-05T16:45:00Z' },
  { id: 'a6', tenantId: 't1', recordId: 'r3', type: 'record_created', message: 'Record created', createdBy: 'John Doe', createdAt: '2026-03-05T09:00:00Z' },
  { id: 'a7', tenantId: 't1', recordId: 'r4', type: 'stage_changed', message: 'Stage changed to Proposal', createdBy: 'John Doe', createdAt: '2026-03-04T09:20:00Z' },
  { id: 'a8', tenantId: 't1', recordId: 'r5', type: 'record_created', message: 'Record created', createdBy: 'John Doe', createdAt: '2026-03-03T11:00:00Z' },
];

export interface MockNote {
  id: string;
  recordId: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export const mockNotes: MockNote[] = [
  { id: 'n1', recordId: 'r1', content: 'Had a great call with Sarah. She is very interested in our enterprise offering.', createdBy: 'John Doe', createdAt: '2026-03-07T15:00:00Z' },
  { id: 'n2', recordId: 'r1', content: 'Sent proposal document via email.', createdBy: 'John Doe', createdAt: '2026-03-07T14:00:00Z' },
  { id: 'n3', recordId: 'r3', content: 'Maria was referred by Alex. High priority lead.', createdBy: 'John Doe', createdAt: '2026-03-05T10:00:00Z' },
];

export interface MockFile {
  id: string;
  recordId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
}

export const mockFiles: MockFile[] = [
  { id: 'file1', recordId: 'r1', fileName: 'Proposal_AcmeCorp.pdf', fileUrl: '#', fileSize: 245000, uploadedBy: 'John Doe', createdAt: '2026-03-07T14:30:00Z' },
  { id: 'file2', recordId: 'r1', fileName: 'Meeting_Notes.docx', fileUrl: '#', fileSize: 32000, uploadedBy: 'John Doe', createdAt: '2026-03-07T11:00:00Z' },
];

export const mockPipelines: Pipeline[] = [
  {
    id: 'p1', tenantId: 't1', moduleId: '1', name: 'Sales Pipeline',
    stages: [
      { id: 's1', pipelineId: 'p1', stageName: 'New', orderIndex: 0, color: '#3B82F6' },
      { id: 's2', pipelineId: 'p1', stageName: 'Contacted', orderIndex: 1, color: '#8B5CF6' },
      { id: 's3', pipelineId: 'p1', stageName: 'Proposal', orderIndex: 2, color: '#F59E0B' },
      { id: 's4', pipelineId: 'p1', stageName: 'Negotiation', orderIndex: 3, color: '#10B981' },
      { id: 's5', pipelineId: 'p1', stageName: 'Closed Won', orderIndex: 4, color: '#14B8A6' },
    ],
  },
];

export const mockTemplates: CRMTemplate[] = [
  { id: 't1', name: 'Sales CRM', category: 'Sales', description: 'Complete sales pipeline with leads, contacts, deals, and forecasting', icon: 'TrendingUp', color: '#7C3AED', modules: [
    { name: 'Leads', slug: 'leads', icon: 'Users', description: 'Track and manage leads' },
    { name: 'Contacts', slug: 'contacts', icon: 'Contact', description: 'Manage contacts' },
    { name: 'Deals', slug: 'deals', icon: 'Handshake', description: 'Track deals and revenue' },
  ]},
  { id: 't2', name: 'Healthcare CRM', category: 'Healthcare', description: 'Patient management, appointments, and medical records', icon: 'Heart', color: '#EF4444', modules: [
    { name: 'Patients', slug: 'patients', icon: 'Users', description: 'Manage patient records' },
    { name: 'Appointments', slug: 'appointments', icon: 'CheckSquare', description: 'Schedule appointments' },
  ]},
  { id: 't3', name: 'Real Estate CRM', category: 'Real Estate', description: 'Properties, listings, buyers, and transactions', icon: 'Home', color: '#F59E0B', modules: [
    { name: 'Properties', slug: 'properties', icon: 'Building2', description: 'Manage property listings' },
    { name: 'Buyers', slug: 'buyers', icon: 'Users', description: 'Track potential buyers' },
  ]},
  { id: 't4', name: 'Education CRM', category: 'Education', description: 'Student enrollment, courses, and academic tracking', icon: 'GraduationCap', color: '#3B82F6', modules: [
    { name: 'Students', slug: 'students', icon: 'Users', description: 'Student management' },
    { name: 'Courses', slug: 'courses', icon: 'Boxes', description: 'Course catalog' },
  ]},
  { id: 't5', name: 'Recruitment CRM', category: 'HR', description: 'Candidate tracking, interviews, and hiring pipeline', icon: 'Briefcase', color: '#10B981', modules: [
    { name: 'Candidates', slug: 'candidates', icon: 'Users', description: 'Track candidates' },
    { name: 'Positions', slug: 'positions', icon: 'Boxes', description: 'Open positions' },
  ]},
  { id: 't6', name: 'Support CRM', category: 'Support', description: 'Ticket management, SLA tracking, and customer support', icon: 'Headphones', color: '#6366F1', modules: [
    { name: 'Tickets', slug: 'tickets', icon: 'CheckSquare', description: 'Support tickets' },
    { name: 'Customers', slug: 'customers', icon: 'Users', description: 'Customer database' },
  ]},
  { id: 't7', name: 'Marketing CRM', category: 'Marketing', description: 'Campaign management, lead scoring, and analytics', icon: 'Megaphone', color: '#EC4899', modules: [
    { name: 'Campaigns', slug: 'campaigns', icon: 'Boxes', description: 'Marketing campaigns' },
    { name: 'Leads', slug: 'marketing_leads', icon: 'Users', description: 'Marketing leads' },
  ]},
  { id: 't8', name: 'Finance CRM', category: 'Finance', description: 'Client portfolio, invoicing, and financial tracking', icon: 'DollarSign', color: '#14B8A6', modules: [
    { name: 'Clients', slug: 'clients', icon: 'Users', description: 'Client portfolio' },
    { name: 'Invoices', slug: 'invoices', icon: 'Boxes', description: 'Invoice management' },
  ]},
];

export const dashboardStats = {
  totalModules: 5,
  totalPipelines: 1,
  totalDashboards: 2,
  totalRecords: 187,
  revenue: 187000,
  conversionRate: 24.5,
  activeLeads: 42,
};

export const chartData = {
  recordsTrend: [
    { month: 'Oct', records: 45 },
    { month: 'Nov', records: 62 },
    { month: 'Dec', records: 78 },
    { month: 'Jan', records: 95 },
    { month: 'Feb', records: 134 },
    { month: 'Mar', records: 187 },
  ],
  pipelineDistribution: [
    { name: 'New', value: 35, color: '#3B82F6' },
    { name: 'Contacted', value: 28, color: '#8B5CF6' },
    { name: 'Proposal', value: 20, color: '#F59E0B' },
    { name: 'Negotiation', value: 12, color: '#10B981' },
    { name: 'Closed', value: 5, color: '#14B8A6' },
  ],
};
