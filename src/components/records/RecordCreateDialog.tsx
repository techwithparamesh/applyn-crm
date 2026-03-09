import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/lib/types";

interface RecordCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: Field[];
  onSubmit: (values: Record<string, any>) => void;
  moduleName: string;
}

export function RecordCreateDialog({ open, onOpenChange, fields, onSubmit, moduleName }: RecordCreateDialogProps) {
  const [values, setValues] = useState<Record<string, any>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
    setValues({});
    onOpenChange(false);
  };

  const setValue = (key: string, val: any) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const renderField = (field: Field) => {
    switch (field.fieldType) {
      case 'textarea':
        return (
          <Textarea
            value={values[field.fieldKey] || ''}
            onChange={(e) => setValue(field.fieldKey, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
      case 'select':
        return (
          <Select value={values[field.fieldKey] || ''} onValueChange={(v) => setValue(field.fieldKey, v)}>
            <SelectTrigger><SelectValue placeholder={`Select ${field.label.toLowerCase()}`} /></SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'multiselect':
        return (
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt) => {
              const selected = (values[field.fieldKey] || []) as string[];
              const isChecked = selected.includes(opt);
              return (
                <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const next = checked ? [...selected, opt] : selected.filter(s => s !== opt);
                      setValue(field.fieldKey, next);
                    }}
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={!!values[field.fieldKey]}
              onCheckedChange={(c) => setValue(field.fieldKey, !!c)}
            />
            <span className="text-sm text-muted-foreground">{field.label}</span>
          </div>
        );
      case 'number':
      case 'currency':
        return (
          <Input
            type="number"
            value={values[field.fieldKey] || ''}
            onChange={(e) => setValue(field.fieldKey, Number(e.target.value))}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
      case 'date':
        return (
          <Input type="date" value={values[field.fieldKey] || ''} onChange={(e) => setValue(field.fieldKey, e.target.value)} />
        );
      case 'email':
        return (
          <Input type="email" value={values[field.fieldKey] || ''} onChange={(e) => setValue(field.fieldKey, e.target.value)} placeholder={`Enter ${field.label.toLowerCase()}`} />
        );
      case 'phone':
        return (
          <Input type="tel" value={values[field.fieldKey] || ''} onChange={(e) => setValue(field.fieldKey, e.target.value)} placeholder={`Enter ${field.label.toLowerCase()}`} />
        );
      default:
        return (
          <Input type="text" value={values[field.fieldKey] || ''} onChange={(e) => setValue(field.fieldKey, e.target.value)} placeholder={`Enter ${field.label.toLowerCase()}`} />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create {moduleName} Record</DialogTitle>
        </DialogHeader>
        {fields.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No fields defined for this module yet. Add fields first using the Fields panel.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {fields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {field.label}
                  {field.isRequired && <span className="text-destructive ml-1">*</span>}
                </Label>
                {renderField(field)}
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 gradient-brand text-primary-foreground">Create Record</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
