export type PlanTier = 'free' | 'pro' | 'enterprise';

export interface WorkspacePlan {
  id: PlanTier;
  name: string;
  price: number;
  features: string[];
  limits: {
    modules: number;
    records: number;
    users: number;
    storage: string;
  };
}

export interface WorkspaceSubscription {
  id: string;
  tenantId: string;
  planId: PlanTier;
  status: 'active' | 'trialing' | 'canceled' | 'past_due';
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface WorkspaceSettings {
  id: string;
  tenantId: string;
  name: string;
  logo?: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  brandColor: string;
  subdomain: string;
}

export const PLANS: WorkspacePlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: ['Up to 3 modules', '500 records', '1 user', '100MB storage', 'Basic reports'],
    limits: { modules: 3, records: 500, users: 1, storage: '100MB' },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    features: ['Unlimited modules', '50,000 records', '10 users', '10GB storage', 'Advanced reports', 'Automations', 'Custom forms', 'API access'],
    limits: { modules: -1, records: 50000, users: 10, storage: '10GB' },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    features: ['Unlimited everything', 'Unlimited users', '100GB storage', 'Priority support', 'SSO / SAML', 'Audit logs', 'Custom branding', 'Dedicated instance'],
    limits: { modules: -1, records: -1, users: -1, storage: '100GB' },
  },
];

export const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
  'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland',
];

export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
];

export const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];
