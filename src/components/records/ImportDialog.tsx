import { useState, useCallback } from 'react';
import {
  Upload, FileSpreadsheet, ArrowRight, ArrowLeft, CheckCircle2, XCircle,
  Download, Loader2, AlertTriangle, MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { parseCSV, autoMapColumns, FieldDef } from '@/lib/csv-utils';
import { useImportExport, ImportJob } from '@/hooks/useImportExport';

type Step = 'upload' | 'mapping' | 'importing' | 'results';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  moduleName: string;
  fields: FieldDef[];
  onComplete?: () => void;
}

export function ImportDialog({ open, onOpenChange, moduleId, moduleName, fields, onComplete }: ImportDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState('');
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  const { job, importing, importRecords, downloadErrorReport, resetJob } = useImportExport(moduleId, fields);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCSV(text);
      setCsvHeaders(headers);
      setCsvRows(rows);
      // Auto-map
      setColumnMapping(autoMapColumns(headers, fields));
      setStep('mapping');
    };
    reader.readAsText(file);
  }, [fields]);

  const handleStartImport = async () => {
    setStep('importing');
    const result = await importRecords(csvRows, columnMapping, fileName);
    setStep('results');
    onComplete?.();
  };

  const handleClose = () => {
    setStep('upload');
    setCsvHeaders([]);
    setCsvRows([]);
    setFileName('');
    setColumnMapping({});
    resetJob();
    onOpenChange(false);
  };

  const mappedCount = Object.values(columnMapping).filter(v => v).length;
  const progress = job ? Math.round((job.processedRows / Math.max(job.totalRows, 1)) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import {moduleName}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 py-2">
          {(['upload', 'mapping', 'importing', 'results'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px bg-border" />}
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                step === s ? 'bg-primary text-primary-foreground' :
                (['upload', 'mapping', 'importing', 'results'].indexOf(step) > i) ? 'bg-primary/20 text-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </div>
              <span className={`text-xs hidden sm:inline ${step === s ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {s === 'upload' ? 'Upload' : s === 'mapping' ? 'Map Columns' : s === 'importing' ? 'Import' : 'Results'}
              </span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex-1 overflow-auto py-4">
          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-12">
              <label className="cursor-pointer group">
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                <div className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all group-hover:border-primary/50">
                  <Upload className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                  <p className="text-sm font-medium text-foreground">Click to upload CSV file</p>
                  <p className="text-xs text-muted-foreground">Supported: .csv, .txt</p>
                </div>
              </label>
            </div>
          )}

          {/* STEP 2: Column Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{fileName}</p>
                  <p className="text-xs text-muted-foreground">{csvRows.length} rows · {csvHeaders.length} columns · {mappedCount} mapped</p>
                </div>
                <Badge variant="secondary">{mappedCount}/{csvHeaders.length} mapped</Badge>
              </div>

              <ScrollArea className="max-h-[40vh]">
                <div className="space-y-2">
                  {csvHeaders.map(csvCol => (
                    <div key={csvCol} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{csvCol}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          Preview: {csvRows.slice(0, 2).map(r => r[csvCol]).filter(Boolean).join(', ') || '(empty)'}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Select
                        value={columnMapping[csvCol] || '_skip'}
                        onValueChange={v => setColumnMapping(prev => ({ ...prev, [csvCol]: v === '_skip' ? '' : v }))}
                      >
                        <SelectTrigger className="w-[180px] h-8 text-xs">
                          <SelectValue placeholder="Skip" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_skip">— Skip —</SelectItem>
                          {fields.map(f => (
                            <SelectItem key={f.fieldKey} value={f.fieldKey}>
                              {f.label} {f.isRequired ? '*' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  <ArrowLeft className="h-4 w-4 mr-1" />Back
                </Button>
                <Button onClick={handleStartImport} disabled={mappedCount === 0} className="gradient-brand text-primary-foreground">
                  Start Import ({csvRows.length} rows)
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Importing */}
          {step === 'importing' && job && (
            <div className="flex flex-col items-center justify-center py-12 gap-6">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Importing records...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Processing {job.processedRows} / {job.totalRows} rows
                </p>
              </div>
              <div className="w-full max-w-sm">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center mt-1">{progress}%</p>
              </div>
            </div>
          )}

          {/* STEP 4: Results */}
          {step === 'results' && job && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3 py-6">
                {job.failedRows === 0 ? (
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-12 w-12 text-amber-500" />
                )}
                <p className="text-lg font-semibold text-foreground">Import Complete</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{job.totalRows}</p>
                    <p className="text-xs text-muted-foreground">Total Rows</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{job.successRows}</p>
                    <p className="text-xs text-muted-foreground">Imported</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-destructive">{job.failedRows}</p>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </CardContent>
                </Card>
              </div>

              {job.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Errors ({job.errors.length})</p>
                    <Button variant="outline" size="sm" onClick={downloadErrorReport}>
                      <Download className="h-3.5 w-3.5 mr-1" />Download Error Report
                    </Button>
                  </div>
                  <ScrollArea className="max-h-[200px]">
                    <div className="space-y-1">
                      {job.errors.slice(0, 20).map((err, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded bg-destructive/5 border border-destructive/10 text-xs">
                          <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">Row {err.rowNumber}:</span>
                          <span className="text-foreground">{err.errorMessage}</span>
                        </div>
                      ))}
                      {job.errors.length > 20 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          +{job.errors.length - 20} more errors (download full report)
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleClose} className="gradient-brand text-primary-foreground">Done</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
