import { useState } from "react";
import { format } from "date-fns";
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Note } from "@/hooks/useNotes";

interface RecordNotesProps {
  notes: Note[];
  onAdd: (content: string) => void;
  onDelete: (noteId: string) => void;
}

export function RecordNotes({ notes, onAdd, onDelete }: RecordNotesProps) {
  const [draft, setDraft] = useState("");

  const handleSubmit = () => {
    if (!draft.trim()) return;
    onAdd(draft.trim());
    setDraft("");
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a note..."
          className="text-sm min-h-[60px]"
          onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleSubmit(); }}
        />
      </div>
      <Button size="sm" onClick={handleSubmit} disabled={!draft.trim()} className="w-full">
        <Send className="h-3.5 w-3.5 mr-1.5" /> Add Note
      </Button>

      <div className="space-y-2 pt-1">
        {notes.map((note) => (
          <div key={note.id} className="rounded-lg border border-border bg-muted/30 p-3 group">
            <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {note.createdBy} · {format(new Date(note.createdAt), 'MMM d, h:mm a')}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onDelete(note.id)}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          </div>
        ))}
        {notes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">No notes yet</p>
        )}
      </div>
    </div>
  );
}
