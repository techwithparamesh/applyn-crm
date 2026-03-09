import { Search, Plus, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import type { WhatsAppConversation } from '@/hooks/useWhatsApp';

interface Props {
  conversations: WhatsAppConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewChat: (phone: string, name?: string) => void;
  collapsed?: boolean;
}

export function WhatsAppConversationList({ conversations, selectedId, onSelect, onNewChat, collapsed }: Props) {
  const [search, setSearch] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');

  const filtered = conversations.filter(c =>
    (c.contact_name || '').toLowerCase().includes(search.toLowerCase()) ||
    c.contact_phone.includes(search)
  );

  const handleNewChat = () => {
    if (!newPhone.trim()) return;
    onNewChat(newPhone, newName || undefined);
    setNewPhone('');
    setNewName('');
    setNewChatOpen(false);
  };

  return (
    <div className={`${collapsed ? 'hidden lg:flex' : 'flex'} flex-col w-80 border-r border-border bg-card shrink-0`}>
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">WhatsApp</h2>
          <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Plus className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Chat</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div><Label>Phone Number</Label><Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+1 555-0000" className="mt-1" /></div>
                <div><Label>Name (optional)</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Contact name" className="mt-1" /></div>
                <Button onClick={handleNewChat} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Start Chat</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..." className="pl-9" />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <User className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No conversations</p>
          </div>
        ) : (
          filtered.map(conv => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors text-left ${
                selectedId === conv.id ? 'bg-primary/5' : ''
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground truncate">
                    {conv.contact_name || conv.contact_phone}
                  </p>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground truncate flex-1">
                    {conv.last_message || 'No messages yet'}
                  </p>
                  {conv.unread_count > 0 && (
                    <Badge className="bg-emerald-500 text-white text-[10px] h-5 min-w-[20px] flex items-center justify-center ml-2">
                      {conv.unread_count}
                    </Badge>
                  )}
                </div>
                {conv.contact_name && (
                  <p className="text-[10px] text-muted-foreground">{conv.contact_phone}</p>
                )}
              </div>
            </button>
          ))
        )}
      </ScrollArea>
    </div>
  );
}
