import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, GripVertical, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DbField } from '@/hooks/useModulesCRUD';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'select', label: 'Select' },
  { value: 'multiselect', label: 'Multi-select' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'checkbox', label: 'Checkbox' },
];

const TYPE_COLORS: Record<string, string> = {
  text: 'bg-muted text-muted-foreground',
  email: 'bg-primary/10 text-primary',
  phone: 'bg-primary/10 text-primary',
  number: 'bg-accent/10 text-accent-foreground',
  currency: 'bg-accent/10 text-accent-foreground',
  date: 'bg-muted text-muted-foreground',
  datetime: 'bg-muted text-muted-foreground',
  select: 'bg-secondary text-secondary-foreground',
  multiselect: 'bg-secondary text-secondary-foreground',
  textarea: 'bg-muted text-muted-foreground',
  checkbox: 'bg-muted text-muted-foreground',
};

interface FieldBuilderProps {
  fields: DbField[];
  onAdd: (input: { name: string; label: string; field_type: string; is_required?: boolean; options_json?: string[] }) => Promise<any>;
  onUpdate: (id: string, updates: Partial<Pick<DbField, 'label' | 'name' | 'field_type' | 'is_required' | 'options_json'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function FieldBuilder({ fields, onAdd, onUpdate, onDelete }: FieldBuilderProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editField, setEditField] = useState<DbField | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Fields ({fields.length})</h3>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Field
        </Button>
      </div>

      <div className="space-y-1.5">
        <AnimatePresence>
          {fields.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors group"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              <span className="text-sm font-medium text-foreground flex-1">{f.label}</span>
              <code className="text-xs text-muted-foreground font-mono">{f.name}</code>
              <Badge variant="secondary" className={`text-[10px] ${TYPE_COLORS[f.field_type] || ''}`}>
                {f.field_type}
              </Badge>
              {f.is_required && (
                <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">Required</Badge>
              )}
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditField(f)}>
                  <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(f.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {fields.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No fields yet. Add fields to define the structure of records in this module.
          </div>
        )}
      </div>

      <FieldFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Field"
        onSubmit={async (v) => { await onAdd(v); setAddOpen(false); }}
      />

      {editField && (
        <FieldFormDialog
          open={!!editField}
          onOpenChange={(o) => !o && setEditField(null)}
          title="Edit Field"
          initial={editField}
          onSubmit={async (v) => {
            await onUpdate(editField.id, v);
            setEditField(null);
          }}
        />
      )}
    </div>
  );
}

function FieldFormDialog({
  open,
  onOpenChange,
  title,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  initial?: DbField;
  onSubmit: (v: { name: string; label: string; field_type: string; is_required?: boolean; options_json?: string[] }) => Promise<void>;
}) {
  const [label, setLabel] = useState(initial?.label || '');
  const [name, setName] = useState(initial?.name || '');
  const [fieldType, setFieldType] = useState(initial?.field_type || 'text');
  const [isRequired, setIsRequired] = useState(initial?.is_required || false);
  const [options, setOptions] = useState(
    initial?.options_json && Array.isArray(initial.options_json) ? initial.options_json.join(', ') : ''
  );
  const [saving, setSaving] = useState(false);

  const autoName = !initial && label
    ? label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    : name;

  const needsOptions = ['select', 'multiselect'].includes(fieldType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    const optionsArr = needsOptions
      ? options.split(',').map(o => o.trim()).filter(Boolean)
      : [];
    await onSubmit({
      label,
      name: autoName || name,
      field_type: fieldType,
      is_required: isRequired,
      options_json: optionsArr,
    });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Label</Label>
            <Input value={label} onChange={e => { setLabel(e.target.value); if (!initial) setName(e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')); }} placeholder="e.g. Full Name" />
          </div>
          <div className="space-y-1.5">
            <Label>Field Key</Label>
            <Input value={initial ? name : autoName} onChange={e => setName(e.target.value)} placeholder="full_name" className="font-mono text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={fieldType} onValueChange={setFieldType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {needsOptions && (
            <div className="space-y-1.5">
              <Label>Options (comma-separated)</Label>
              <Input value={options} onChange={e => setOptions(e.target.value)} placeholder="Option 1, Option 2, Option 3" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Switch checked={isRequired} onCheckedChange={setIsRequired} id="required" />
            <Label htmlFor="required">Required field</Label>
          </div>
          <Button type="submit" className="w-full" disabled={saving || !label.trim()}>
            {initial ? 'Save Changes' : 'Add Field'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
