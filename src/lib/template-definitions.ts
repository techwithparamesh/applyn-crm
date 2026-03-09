// Template definitions for CRM template installer

export interface TemplateModuleDef {
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  fields: TemplateFieldDef[];
}

export interface TemplateFieldDef {
  name: string;
  label: string;
  field_type: string;
  is_required: boolean;
  options?: string[];
}

export interface TemplatePipelineDef {
  name: string;
  module_slug: string;
  stages: { name: string; color: string }[];
}

export interface TemplateSampleRecord {
  module_slug: string;
  values: Record<string, any>;
}

export interface TemplateDefinition {
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  modules: TemplateModuleDef[];
  pipelines: TemplatePipelineDef[];
  sampleRecords: TemplateSampleRecord[];
}

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    slug: 'sales-crm',
    name: 'Sales CRM',
    description: 'Complete sales pipeline with leads, contacts, deals, and companies',
    category: 'Sales',
    icon: 'TrendingUp',
    color: 'hsl(263, 70%, 58%)',
    modules: [
      {
        name: 'Leads', slug: 'leads', icon: 'Users', color: '#7C3AED',
        description: 'Track and manage incoming leads',
        fields: [
          { name: 'full_name', label: 'Full Name', field_type: 'text', is_required: true },
          { name: 'email', label: 'Email', field_type: 'email', is_required: true },
          { name: 'phone', label: 'Phone', field_type: 'phone', is_required: false },
          { name: 'company', label: 'Company', field_type: 'text', is_required: false },
          { name: 'source', label: 'Source', field_type: 'select', is_required: false, options: ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Event'] },
          { name: 'status', label: 'Status', field_type: 'select', is_required: true, options: ['New', 'Contacted', 'Qualified', 'Lost'] },
          { name: 'score', label: 'Lead Score', field_type: 'number', is_required: false },
          { name: 'notes', label: 'Notes', field_type: 'textarea', is_required: false },
        ],
      },
      {
        name: 'Contacts', slug: 'contacts', icon: 'Contact', color: '#2563EB',
        description: 'Manage your contact database',
        fields: [
          { name: 'name', label: 'Name', field_type: 'text', is_required: true },
          { name: 'email', label: 'Email', field_type: 'email', is_required: true },
          { name: 'phone', label: 'Phone', field_type: 'phone', is_required: false },
          { name: 'company', label: 'Company', field_type: 'text', is_required: false },
          { name: 'title', label: 'Job Title', field_type: 'text', is_required: false },
        ],
      },
      {
        name: 'Deals', slug: 'deals', icon: 'Handshake', color: '#16A34A',
        description: 'Track deals and revenue',
        fields: [
          { name: 'deal_name', label: 'Deal Name', field_type: 'text', is_required: true },
          { name: 'amount', label: 'Amount', field_type: 'currency', is_required: true },
          { name: 'stage', label: 'Stage', field_type: 'select', is_required: true, options: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] },
          { name: 'close_date', label: 'Close Date', field_type: 'date', is_required: false },
          { name: 'owner', label: 'Owner', field_type: 'text', is_required: false },
        ],
      },
      {
        name: 'Companies', slug: 'companies', icon: 'Building2', color: '#EA580C',
        description: 'Track company accounts',
        fields: [
          { name: 'name', label: 'Company Name', field_type: 'text', is_required: true },
          { name: 'industry', label: 'Industry', field_type: 'select', is_required: false, options: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Other'] },
          { name: 'website', label: 'Website', field_type: 'url', is_required: false },
          { name: 'employees', label: 'Employees', field_type: 'number', is_required: false },
          { name: 'phone', label: 'Phone', field_type: 'phone', is_required: false },
        ],
      },
      {
        name: 'Tasks', slug: 'tasks', icon: 'CheckSquare', color: '#CA8A04',
        description: 'Manage tasks and follow-ups',
        fields: [
          { name: 'title', label: 'Title', field_type: 'text', is_required: true },
          { name: 'description', label: 'Description', field_type: 'textarea', is_required: false },
          { name: 'due_date', label: 'Due Date', field_type: 'date', is_required: false },
          { name: 'priority', label: 'Priority', field_type: 'select', is_required: true, options: ['Low', 'Medium', 'High', 'Urgent'] },
          { name: 'status', label: 'Status', field_type: 'select', is_required: true, options: ['To Do', 'In Progress', 'Done'] },
        ],
      },
    ],
    pipelines: [
      {
        name: 'Sales Pipeline',
        module_slug: 'deals',
        stages: [
          { name: 'Lead', color: '#6B7280' },
          { name: 'Qualified', color: '#3B82F6' },
          { name: 'Proposal', color: '#8B5CF6' },
          { name: 'Negotiation', color: '#F59E0B' },
          { name: 'Closed Won', color: '#10B981' },
          { name: 'Closed Lost', color: '#EF4444' },
        ],
      },
    ],
    sampleRecords: [
      { module_slug: 'leads', values: { full_name: 'John Smith', email: 'john@example.com', phone: '+1 555-0101', company: 'Acme Corp', source: 'Website', status: 'New', score: 75 } },
      { module_slug: 'leads', values: { full_name: 'Sarah Johnson', email: 'sarah@techstart.io', phone: '+1 555-0102', company: 'TechStart', source: 'LinkedIn', status: 'Contacted', score: 85 } },
      { module_slug: 'leads', values: { full_name: 'Mike Chen', email: 'mike@globalnet.com', phone: '+1 555-0103', company: 'GlobalNet', source: 'Referral', status: 'Qualified', score: 92 } },
      { module_slug: 'contacts', values: { name: 'Emily Davis', email: 'emily@innovate.co', phone: '+1 555-0201', company: 'Innovate Co', title: 'VP of Sales' } },
      { module_slug: 'contacts', values: { name: 'Robert Wilson', email: 'robert@megacorp.com', phone: '+1 555-0202', company: 'MegaCorp', title: 'CTO' } },
      { module_slug: 'deals', values: { deal_name: 'Website Redesign', amount: 5000, stage: 'Proposal', close_date: '2026-04-15', owner: 'Sales Team' } },
      { module_slug: 'deals', values: { deal_name: 'Enterprise License', amount: 25000, stage: 'Negotiation', close_date: '2026-05-01', owner: 'Sales Team' } },
      { module_slug: 'deals', values: { deal_name: 'Consulting Package', amount: 12000, stage: 'Qualified', close_date: '2026-04-30', owner: 'Sales Team' } },
      { module_slug: 'companies', values: { name: 'Acme Corp', industry: 'Technology', website: 'https://acme.com', employees: 250, phone: '+1 555-1000' } },
      { module_slug: 'companies', values: { name: 'GlobalNet', industry: 'Finance', website: 'https://globalnet.com', employees: 1200, phone: '+1 555-2000' } },
    ],
  },
  {
    slug: 'healthcare-crm',
    name: 'Healthcare CRM',
    description: 'Patient management, appointments, and medical records',
    category: 'Healthcare',
    icon: 'Heart',
    color: 'hsl(350, 70%, 55%)',
    modules: [
      {
        name: 'Patients', slug: 'patients', icon: 'Users', color: '#DC2626',
        description: 'Patient records and management',
        fields: [
          { name: 'name', label: 'Patient Name', field_type: 'text', is_required: true },
          { name: 'email', label: 'Email', field_type: 'email', is_required: false },
          { name: 'phone', label: 'Phone', field_type: 'phone', is_required: true },
          { name: 'date_of_birth', label: 'Date of Birth', field_type: 'date', is_required: true },
          { name: 'status', label: 'Status', field_type: 'select', is_required: true, options: ['Active', 'Inactive', 'Discharged'] },
        ],
      },
      {
        name: 'Appointments', slug: 'appointments', icon: 'Calendar', color: '#2563EB',
        description: 'Schedule and track appointments',
        fields: [
          { name: 'patient_name', label: 'Patient', field_type: 'text', is_required: true },
          { name: 'date', label: 'Date', field_type: 'date', is_required: true },
          { name: 'type', label: 'Type', field_type: 'select', is_required: true, options: ['Consultation', 'Follow-up', 'Emergency', 'Routine'] },
          { name: 'status', label: 'Status', field_type: 'select', is_required: true, options: ['Scheduled', 'Completed', 'Cancelled', 'No-show'] },
          { name: 'notes', label: 'Notes', field_type: 'textarea', is_required: false },
        ],
      },
    ],
    pipelines: [
      {
        name: 'Patient Journey',
        module_slug: 'patients',
        stages: [
          { name: 'Intake', color: '#6B7280' },
          { name: 'Assessment', color: '#3B82F6' },
          { name: 'Treatment', color: '#F59E0B' },
          { name: 'Follow-up', color: '#8B5CF6' },
          { name: 'Discharged', color: '#10B981' },
        ],
      },
    ],
    sampleRecords: [
      { module_slug: 'patients', values: { name: 'Alice Brown', phone: '+1 555-3001', date_of_birth: '1985-03-15', status: 'Active' } },
      { module_slug: 'appointments', values: { patient_name: 'Alice Brown', date: '2026-03-15', type: 'Consultation', status: 'Scheduled' } },
    ],
  },
  {
    slug: 'real-estate-crm',
    name: 'Real Estate CRM',
    description: 'Property listings, clients, and transactions',
    category: 'Real Estate',
    icon: 'Home',
    color: 'hsl(200, 70%, 50%)',
    modules: [
      {
        name: 'Properties', slug: 'properties', icon: 'Home', color: '#0EA5E9',
        description: 'Property listings',
        fields: [
          { name: 'address', label: 'Address', field_type: 'text', is_required: true },
          { name: 'price', label: 'Price', field_type: 'currency', is_required: true },
          { name: 'type', label: 'Type', field_type: 'select', is_required: true, options: ['House', 'Apartment', 'Condo', 'Land', 'Commercial'] },
          { name: 'bedrooms', label: 'Bedrooms', field_type: 'number', is_required: false },
          { name: 'status', label: 'Status', field_type: 'select', is_required: true, options: ['Available', 'Under Contract', 'Sold', 'Off Market'] },
        ],
      },
      {
        name: 'Clients', slug: 'clients', icon: 'Users', color: '#7C3AED',
        description: 'Buyer and seller contacts',
        fields: [
          { name: 'name', label: 'Name', field_type: 'text', is_required: true },
          { name: 'email', label: 'Email', field_type: 'email', is_required: true },
          { name: 'phone', label: 'Phone', field_type: 'phone', is_required: false },
          { name: 'client_type', label: 'Type', field_type: 'select', is_required: true, options: ['Buyer', 'Seller', 'Both'] },
          { name: 'budget', label: 'Budget', field_type: 'currency', is_required: false },
        ],
      },
    ],
    pipelines: [
      {
        name: 'Deal Pipeline',
        module_slug: 'properties',
        stages: [
          { name: 'Listed', color: '#6B7280' },
          { name: 'Showing', color: '#3B82F6' },
          { name: 'Offer', color: '#F59E0B' },
          { name: 'Under Contract', color: '#8B5CF6' },
          { name: 'Closed', color: '#10B981' },
        ],
      },
    ],
    sampleRecords: [
      { module_slug: 'properties', values: { address: '123 Main St, Austin TX', price: 450000, type: 'House', bedrooms: 3, status: 'Available' } },
      { module_slug: 'clients', values: { name: 'Tom Harris', email: 'tom@email.com', phone: '+1 555-4001', client_type: 'Buyer', budget: 500000 } },
    ],
  },
];
