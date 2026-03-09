import { useState } from 'react';
import { format } from 'date-fns';
import { MessageCircle, Send, CheckCheck, Check, Eye, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WhatsAppMessage, WHATSAPP_TEMPLATES, WhatsAppMessageStatus } from '@/lib/whatsapp-types';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppComposerProps {
  recipientPhone: string;
  recipientName?: string;
  onSend: (phone: string, message: string, template?: string) => void;
}

export function WhatsAppComposer({ recipientPhone, recipientName, onSend }: WhatsAppComposerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState(recipientPhone);
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const { toast } = useToast();

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tpl = WHATSAPP_TEMPLATES.find((t) => t.id === templateId);
    if (tpl) {
      setMessage(tpl.body.replace('{{name}}', recipientName || 'there'));
    }
  };

  const handleSend = () => {
    const trimmedPhone = phone.trim();
    const trimmedMessage = message.trim();

    if (!trimmedPhone || !trimmedMessage) {
      toast({ title: 'Missing fields', description: 'Phone and message are required.', variant: 'destructive' });
      return;
    }
    if (trimmedMessage.length > 4096) {
      toast({ title: 'Message too long', description: 'WhatsApp messages must be under 4096 characters.', variant: 'destructive' });
      return;
    }

    onSend(trimmedPhone, trimmedMessage, selectedTemplate || undefined);
    setMessage('');
    setSelectedTemplate('');
    setIsOpen(false);
    toast({ title: 'WhatsApp sent', description: `Message sent to ${trimmedPhone}` });
  };

  if (!isOpen) {
    return (
      <Button size="sm" variant="outline" onClick={() => setIsOpen(true)} className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700">
        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-green-200 bg-green-50/30 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <MessageCircle className="h-4 w-4 text-green-600" /> WhatsApp Message
        </h4>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
      </div>
      <Input placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-8 text-sm" />
      <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
        <SelectTrigger className="h-8 text-sm">
          <SelectValue placeholder="Use a template (optional)" />
        </SelectTrigger>
        <SelectContent>
          {WHATSAPP_TEMPLATES.map((t) => (
            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Textarea placeholder="Type your message..." value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[80px] text-sm" maxLength={4096} />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{message.length}/4096</span>
        <Button size="sm" onClick={handleSend} className="gap-1.5 bg-green-600 hover:bg-green-700">
          <Send className="h-3.5 w-3.5" /> Send
        </Button>
      </div>
    </div>
  );
}

const STATUS_CONFIG: Record<WhatsAppMessageStatus, { icon: typeof Check; label: string; color: string }> = {
  sent: { icon: Check, label: 'Sent', color: 'text-muted-foreground' },
  delivered: { icon: CheckCheck, label: 'Delivered', color: 'text-muted-foreground' },
  read: { icon: CheckCheck, label: 'Read', color: 'text-blue-500' },
  failed: { icon: AlertCircle, label: 'Failed', color: 'text-destructive' },
};

interface WhatsAppHistoryProps {
  messages: WhatsAppMessage[];
}

export function WhatsAppHistory({ messages }: WhatsAppHistoryProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-6">
        <MessageCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No WhatsApp messages yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {messages
        .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
        .map((msg) => {
          const status = STATUS_CONFIG[msg.status];
          const StatusIcon = status.icon;
          return (
            <div key={msg.id} className="border-b border-border last:border-0 py-3 px-1">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-3 w-3 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-2">{msg.message}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <span>{msg.phone}</span>
                    <span>·</span>
                    <span>{format(new Date(msg.sentAt), 'MMM d, h:mm a')}</span>
                    <span>·</span>
                    <span className={`flex items-center gap-0.5 ${status.color}`}>
                      <StatusIcon className="h-3 w-3" /> {status.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}
