import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useImportExport } from '@/hooks/useImportExport';
import { FieldDef } from '@/lib/csv-utils';

interface ExportDialogProps {
  moduleId: string;
  moduleName: string;
  fields: FieldDef[];
  records: Record<string, any>[];
  selectedIds?: string[];
}

export function ExportDialog({ moduleId, moduleName, fields, records, selectedIds }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(fields.map(f => f.fieldKey)));
  const [exportScope, setExportScope] = useState<'all' | 'selected'>('all');

  const { exportRecords } = useImportExport(moduleId, fields);

  const toggleField = (key: string) => {
    setSelectedFields(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleExport = () => {
    const exportFields = fields.filter(f => selectedFields.has(f.fieldKey));
    let exportData = records;
    if (exportScope === 'selected' && selectedIds?.length) {
      exportData = records.filter(r => selectedIds.includes(r.id));
    }
    exportRecords(exportData, exportFields, 'csv', moduleName);
    setOpen(false);
  };

  const recordCount = exportScope === 'selected' && selectedIds?.length ? selectedIds.length : records.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export {moduleName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Scope */}
          <div className="flex gap-2">
            <Button
              variant={exportScope === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setExportScope('all')}
              className={exportScope === 'all' ? 'gradient-brand text-primary-foreground' : ''}
            >
              All Records ({records.length})
            </Button>
            {selectedIds && selectedIds.length > 0 && (
              <Button
                variant={exportScope === 'selected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExportScope('selected')}
                className={exportScope === 'selected' ? 'gradient-brand text-primary-foreground' : ''}
              >
                Selected ({selectedIds.length})
              </Button>
            )}
          </div>

          {/* Field selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">Fields to export</p>
              <button
                onClick={() => setSelectedFields(prev => prev.size === fields.length ? new Set() : new Set(fields.map(f => f.fieldKey)))}
                className="text-xs text-primary hover:underline"
              >
                {selectedFields.size === fields.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <ScrollArea className="max-h-[250px]">
              <div className="space-y-1">
                {fields.map(f => (
                  <label key={f.fieldKey} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={selectedFields.has(f.fieldKey)}
                      onCheckedChange={() => toggleField(f.fieldKey)}
                    />
                    <span className="text-sm text-foreground">{f.label}</span>
                    <Badge variant="outline" className="text-[9px] ml-auto">{f.fieldType}</Badge>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Button onClick={handleExport} disabled={selectedFields.size === 0} className="w-full gradient-brand text-primary-foreground">
            <Download className="h-4 w-4 mr-2" />Export {recordCount} Records as CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
