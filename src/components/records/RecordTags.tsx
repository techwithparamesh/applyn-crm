import { useState } from "react";
import { Plus, X, Tag as TagIcon, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tag, TAG_COLORS, getTagColorClasses, useTags } from "@/hooks/useTags";

interface RecordTagsManagerProps {
  recordId: string;
  compact?: boolean;
}

export function RecordTagsManager({ recordId, compact = false }: RecordTagsManagerProps) {
  const { tags: allTags, assignTag, removeTag, getRecordTags, createTag } = useTags();
  const recordTags = getRecordTags(recordId);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("blue");

  const unassigned = allTags.filter((t) => !recordTags.some((rt) => rt.id === t.id));

  const handleCreate = () => {
    if (!newName.trim()) return;
    const tag = createTag(newName.trim(), newColor);
    assignTag(recordId, tag.id);
    setNewName("");
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {recordTags.map((tag) => {
        const colors = getTagColorClasses(tag.color);
        return (
          <Badge key={tag.id} variant="outline" className={`${colors.bg} ${colors.text} border-0 text-[10px] font-medium px-2 py-0.5 gap-1`}>
            <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
            {tag.name}
            {!compact && (
              <button onClick={(e) => { e.stopPropagation(); removeTag(recordId, tag.id); }} className="ml-0.5 hover:opacity-70">
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </Badge>
        );
      })}
      {!compact && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
              <Plus className="h-3 w-3 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="start" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-semibold text-foreground mb-2">Assign Tag</p>
            {unassigned.length > 0 && (
              <div className="space-y-1 mb-3 max-h-32 overflow-y-auto">
                {unassigned.map((tag) => {
                  const colors = getTagColorClasses(tag.color);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => { assignTag(recordId, tag.id); }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-muted transition-colors text-left"
                    >
                      <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                      <span className="text-foreground">{tag.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="border-t border-border pt-2 space-y-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Create new</p>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Tag name..."
                className="h-7 text-xs"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <div className="flex gap-1">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setNewColor(c.key)}
                    className={`h-5 w-5 rounded-full ${c.dot} flex items-center justify-center transition-transform ${newColor === c.key ? 'scale-125 ring-2 ring-offset-1 ring-offset-background ring-primary' : 'hover:scale-110'}`}
                  >
                    {newColor === c.key && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                  </button>
                ))}
              </div>
              <Button size="sm" className="w-full h-7 text-xs" onClick={handleCreate} disabled={!newName.trim()}>
                <Plus className="h-3 w-3 mr-1" /> Create & Assign
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

/** Compact read-only inline tags for cards/table rows */
export function RecordTagsBadges({ recordId }: { recordId: string }) {
  const { getRecordTags } = useTags();
  const recordTags = getRecordTags(recordId);
  if (recordTags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {recordTags.slice(0, 3).map((tag) => {
        const colors = getTagColorClasses(tag.color);
        return (
          <span key={tag.id} className={`inline-flex items-center gap-1 ${colors.bg} ${colors.text} text-[9px] font-medium px-1.5 py-0 rounded-full`}>
            <span className={`h-1 w-1 rounded-full ${colors.dot}`} />
            {tag.name}
          </span>
        );
      })}
      {recordTags.length > 3 && (
        <span className="text-[9px] text-muted-foreground">+{recordTags.length - 3}</span>
      )}
    </div>
  );
}
