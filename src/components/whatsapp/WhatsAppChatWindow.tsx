import { useRef, useEffect } from 'react';
import { User, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { WhatsAppMessage, WhatsAppConversation } from '@/hooks/useWhatsApp';

const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  sent: Check,
  delivered: CheckCheck,
  read: CheckCheck,
  failed: AlertCircle,
};

interface Props {
  conversation: WhatsAppConversation;
  messages: WhatsAppMessage[];
  loading: boolean;
  onBack: () => void;
}

export function WhatsAppChatWindow({ conversation, messages, loading, onBack }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleContactClick = () => {
    if (conversation.record_id && conversation.module_name) {
      navigate(`/modules/${conversation.module_name}/records/${conversation.record_id}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <Button variant="ghost" size="sm" className="lg:hidden" onClick={onBack}>← Back</Button>
        <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <User className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="flex-1">
          <p
            className={`text-sm font-semibold text-foreground ${conversation.record_id ? 'cursor-pointer hover:text-emerald-600 transition-colors' : ''}`}
            onClick={handleContactClick}
          >
            {conversation.contact_name || conversation.contact_phone}
          </p>
          <p className="text-[11px] text-muted-foreground">{conversation.contact_phone}</p>
        </div>
        {conversation.record_id && (
          <Button variant="outline" size="sm" onClick={handleContactClick} className="text-xs">
            View Contact
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-muted/20">
        <div className="max-w-2xl mx-auto space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No messages yet. Send the first message!</p>
            </div>
          ) : (
            messages.map(msg => {
              const isOutgoing = msg.direction === 'outgoing';
              const StatusIcon = STATUS_ICONS[msg.status] || Clock;
              return (
                <div key={msg.id} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isOutgoing
                      ? 'rounded-tr-sm bg-emerald-500/10 border border-emerald-500/20'
                      : 'rounded-tl-sm bg-card border border-border'
                  }`}>
                    <p className="text-sm text-foreground">{msg.content}</p>
                    <div className={`flex items-center gap-1 mt-1 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isOutgoing && (
                        <StatusIcon className={`h-3 w-3 ${msg.status === 'read' ? 'text-blue-500' : msg.status === 'failed' ? 'text-destructive' : 'text-muted-foreground'}`} />
                      )}
                    </div>
                    {msg.error_message && (
                      <p className="text-[10px] text-destructive mt-1">{msg.error_message}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
