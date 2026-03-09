/**
 * Dashboard seed data: KPIs, charts, activity, tasks, tables.
 * Used for default widgets and fallback when API returns empty.
 */

export const DASHBOARD_KPIS = [
  { id: 'leads', title: 'Total Leads', value: '187', change: '+23%', changeType: 'positive' as const, icon: 'Users' },
  { id: 'deals', title: 'Active Deals', value: '42', change: '+12 this week', changeType: 'positive' as const, icon: 'Handshake' },
  { id: 'revenue', title: 'Revenue', value: '$187K', change: '+18%', changeType: 'positive' as const, icon: 'DollarSign' },
  { id: 'tasks', title: 'Tasks Due Today', value: '6', change: 'Due today', changeType: 'neutral' as const, icon: 'CheckSquare' },
];

export const REVENUE_TREND_DATA = [
  { month: 'Oct', revenue: 42 },
  { month: 'Nov', revenue: 58 },
  { month: 'Dec', revenue: 71 },
  { month: 'Jan', revenue: 89 },
  { month: 'Feb', revenue: 124 },
  { month: 'Mar', revenue: 187 },
];

export const PIPELINE_STAGES = [
  { name: 'New', value: 35, color: '#6366f1' },
  { name: 'Qualified', value: 28, color: '#8b5cf6' },
  { name: 'Proposal', value: 20, color: '#f59e0b' },
  { name: 'Negotiation', value: 12, color: '#10b981' },
  { name: 'Closed', value: 5, color: '#14b8a6' },
];

export const DASHBOARD_ACTIVITY = [
  { id: '1', user: 'John', action: 'created a new lead', time: '2 min ago', type: 'record_created' },
  { id: '2', user: 'Sarah', action: 'Deal value updated to $25,000', time: '15 min ago', type: 'field_updated' },
  { id: '3', user: 'John', action: 'Stage changed to Proposal', time: '1 hour ago', type: 'stage_changed' },
  { id: '4', user: 'System', action: 'Email sent to customer', time: '2 hours ago', type: 'email_sent' },
  { id: '5', user: 'System', action: 'WhatsApp message received', time: '3 hours ago', type: 'whatsapp' },
];

export const DASHBOARD_TASKS = [
  { id: '1', subject: 'Call client', dueDate: 'Today', status: 'Pending', priority: 'High' },
  { id: '2', subject: 'Send proposal', dueDate: 'Tomorrow', status: 'In Progress', priority: 'High' },
  { id: '3', subject: 'Follow up', dueDate: 'Mar 12', status: 'Pending', priority: 'Medium' },
];

export const RECENT_LEADS = [
  { id: '1', name: 'Sarah Chen', company: 'Acme Corp', phone: '+1 555-0101', source: 'Website' },
  { id: '2', name: 'James Wilson', company: 'TechStart', phone: '+1 555-0102', source: 'LinkedIn' },
  { id: '3', name: 'Maria Garcia', company: 'Global Inc', phone: '+1 555-0103', source: 'Referral' },
  { id: '4', name: 'Alex Turner', company: 'Nova Dev', phone: '+1 555-0104', source: 'Event' },
  { id: '5', name: 'Priya Patel', company: 'DesignHub', phone: '+1 555-0105', source: 'Cold Call' },
];

export const DEALS_CLOSING_SOON = [
  { id: '1', name: 'Acme Enterprise Deal', amount: '$125,000', stage: 'Proposal', closeDate: 'Apr 15' },
  { id: '2', name: 'TechStart Integration', amount: '$45,000', stage: 'Discovery', closeDate: 'May 1' },
  { id: '3', name: 'Global Inc Renewal', amount: '$78,000', stage: 'Negotiation', closeDate: 'Mar 20' },
];
