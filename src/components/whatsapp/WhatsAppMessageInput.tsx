import { useState } from 'react';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function WhatsAppMessageInput({ onSend, disabled }: Props) {
  const [draft, setDraft] = useState('');

  const handleSend = () => {
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft('');
  };

  return (
    <div className="p-3 border-t border-border bg-card">
      <div className="flex gap-2 max-w-2xl mx-auto">
        <Input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          disabled={disabled}
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || disabled}
          className="inline-flex items-center justify-center rounded-md px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:pointer-events-none transition-colors shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
