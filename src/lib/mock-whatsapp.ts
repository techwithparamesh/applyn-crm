import { WhatsAppMessage } from './whatsapp-types';

export const mockWhatsAppMessages: WhatsAppMessage[] = [
  {
    id: 'wa-1', tenantId: 't1', recordId: 'r1',
    phone: '+1 555-0101', message: 'Hi Sarah, just following up on our proposal. Let me know if you have any questions!',
    status: 'read', sentAt: '2024-03-15T10:20:00Z',
  },
  {
    id: 'wa-2', tenantId: 't1', recordId: 'r1',
    phone: '+1 555-0101', message: 'Great speaking with you today. I\'ll send the updated pricing shortly.',
    template: 'follow_up', status: 'delivered', sentAt: '2024-03-16T14:00:00Z',
  },
  {
    id: 'wa-3', tenantId: 't1', recordId: 'r2',
    phone: '+1 555-0202', message: 'Hi Michael, welcome! We\'re excited to have you on board.',
    template: 'welcome', status: 'sent', sentAt: '2024-03-14T09:00:00Z',
  },
];
