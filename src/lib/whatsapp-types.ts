export type WhatsAppMessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface WhatsAppMessage {
  id: string;
  tenantId: string;
  recordId: string;
  phone: string;
  message: string;
  template?: string;
  status: WhatsAppMessageStatus;
  sentAt: string;
}

export const WHATSAPP_TEMPLATES: { id: string; name: string; body: string }[] = [
  { id: 'welcome', name: 'Welcome Message', body: "Hi {{name}}, welcome! We're excited to have you on board. Let us know if you have any questions." },
  { id: 'follow_up', name: 'Follow-Up', body: 'Hi {{name}}, just checking in on our last conversation. Would you like to schedule a call this week?' },
  { id: 'meeting_reminder', name: 'Meeting Reminder', body: 'Hi {{name}}, this is a reminder about our upcoming meeting. Looking forward to connecting!' },
  { id: 'thank_you', name: 'Thank You', body: "Hi {{name}}, thank you for your time today. Please don't hesitate to reach out if you need anything." },
];
