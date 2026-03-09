import { useState, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import { WhatsAppConversationList } from './WhatsAppConversationList';
import { WhatsAppChatWindow } from './WhatsAppChatWindow';
import { WhatsAppMessageInput } from './WhatsAppMessageInput';
import { useWhatsAppConversations, useWhatsAppMessages, useWhatsAppSend } from '@/hooks/useWhatsApp';
import type { WhatsAppAccount } from '@/hooks/useWhatsApp';

interface Props {
  account: WhatsAppAccount;
}

export function WhatsAppInbox({ account }: Props) {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const { conversations, loading: convsLoading } = useWhatsAppConversations(account.id);
  const { messages, loading: msgsLoading } = useWhatsAppMessages(selectedConvId || undefined);
  const { sendMessage, createConversation } = useWhatsAppSend(account.id);

  const selectedConv = conversations.find(c => c.id === selectedConvId) || null;

  const handleSend = useCallback(async (content: string) => {
    if (!selectedConvId) return;
    await sendMessage(selectedConvId, content);
  }, [selectedConvId, sendMessage]);

  const handleNewChat = useCallback(async (phone: string, name?: string) => {
    const conv = await createConversation(phone, name);
    if (conv) setSelectedConvId(conv.id);
  }, [createConversation]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <WhatsAppConversationList
        conversations={conversations}
        selectedId={selectedConvId}
        onSelect={setSelectedConvId}
        onNewChat={handleNewChat}
        collapsed={!!selectedConvId}
      />

      {selectedConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          <WhatsAppChatWindow
            conversation={selectedConv}
            messages={messages}
            loading={msgsLoading}
            onBack={() => setSelectedConvId(null)}
          />
          <WhatsAppMessageInput onSend={handleSend} />
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}
