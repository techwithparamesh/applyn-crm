import { useState, useRef, useEffect } from "react";
import { Check, X, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Field } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

interface InlineEditFieldProps {
  field: Field;
  value: any;
  onSave: (fieldKey: string, value: any) => void;
  disabled?: boolean;
}

export function InlineEditField({ field, value, onSave, disabled = false }: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const handleSave = () => {
    onSave(field.fieldKey, editValue);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCancel = () => {
    setEditValue(value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && field.fieldType !== 'textarea') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  const displayValue = () => {
    if (value === undefined || value === null || value === '') return <span className="text-muted-foreground italic">Empty</span>;
    if (field.fieldType === 'currency') return <span className="font-medium">${Number(value).toLocaleString()}</span>;
    return <span>{String(value)}</span>;
  };

  if (disabled) {
    return (
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5 -mx-2">
        <div className="flex-1 text-sm">{displayValue()}</div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="space-y-2">
        {field.fieldType === 'textarea' ? (
          <Textarea
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm"
          />
        ) : field.fieldType === 'select' ? (
          <Select value={editValue || ''} onValueChange={setEditValue}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            ref={inputRef}
            type={field.fieldType === 'number' || field.fieldType === 'currency' ? 'number' : field.fieldType === 'date' ? 'date' : field.fieldType === 'email' ? 'email' : 'text'}
            value={editValue || ''}
            onChange={(e) => setEditValue(field.fieldType === 'number' || field.fieldType === 'currency' ? Number(e.target.value) : e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm h-9"
          />
        )}
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={handleSave}>
            <Check className="h-3 w-3 mr-1" /> Save
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={handleCancel}>
            <X className="h-3 w-3 mr-1" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 -mx-2 hover:bg-muted/50 transition-colors" onClick={() => { setEditValue(value); setEditing(true); }}>
      <div className="flex-1 text-sm">{displayValue()}</div>
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      <AnimatePresence>
        {saved && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-accent font-medium"
          >
            Saved
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
