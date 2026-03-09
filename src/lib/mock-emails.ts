import { Email, EmailConnection } from './email-types';

export const mockEmailConnection: EmailConnection = {
  id: 'ec-1',
  tenantId: 't1',
  provider: 'gmail',
  email: 'john.doe@company.com',
  isConnected: true,
  connectedAt: '2024-01-15T10:00:00Z',
};

export const mockEmails: Email[] = [
  {
    id: 'em-1', tenantId: 't1', recordId: 'r1',
    subject: 'Follow-up on our meeting',
    body: 'Hi Sarah, it was great meeting you today. I wanted to follow up on the points we discussed regarding the enterprise plan...',
    direction: 'sent', from: 'john.doe@company.com', to: 'sarah.johnson@techcorp.com',
    sentAt: '2024-03-15T14:30:00Z', isRead: true,
  },
  {
    id: 'em-2', tenantId: 't1', recordId: 'r1',
    subject: 'Re: Follow-up on our meeting',
    body: 'Hi John, thanks for reaching out! I reviewed the proposal and have a few questions about the pricing tiers...',
    direction: 'received', from: 'sarah.johnson@techcorp.com', to: 'john.doe@company.com',
    sentAt: '2024-03-15T16:45:00Z', isRead: true,
  },
  {
    id: 'em-3', tenantId: 't1', recordId: 'r1',
    subject: 'Updated proposal attached',
    body: 'Hi Sarah, please find the updated proposal with the revised pricing. Let me know if you have any further questions.',
    direction: 'sent', from: 'john.doe@company.com', to: 'sarah.johnson@techcorp.com',
    sentAt: '2024-03-16T09:15:00Z', isRead: true,
  },
  {
    id: 'em-4', tenantId: 't1', recordId: 'r2',
    subject: 'Introduction - CRM Solutions',
    body: 'Hi Michael, I wanted to introduce our CRM platform and discuss how it could benefit your sales team...',
    direction: 'sent', from: 'john.doe@company.com', to: 'michael.chen@globalinc.com',
    sentAt: '2024-03-14T11:00:00Z', isRead: true,
  },
  {
    id: 'em-5', tenantId: 't1', recordId: 'r3',
    subject: 'Partnership opportunity',
    body: 'Hello, we are interested in exploring a partnership opportunity with your organization...',
    direction: 'received', from: 'emily.davis@startupxyz.com', to: 'john.doe@company.com',
    sentAt: '2024-03-17T08:30:00Z', isRead: false,
  },
];
