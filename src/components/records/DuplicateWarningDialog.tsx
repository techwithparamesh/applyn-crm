import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Eye, GitMerge, SkipForward } from "lucide-react";
import { MockRecord } from "@/lib/mock-data";
import { Field } from "@/lib/types";

export interface DuplicateMatch {
  record: MockRecord;
  matchedFields: string[]; // field labels that matched
}

interface DuplicateWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: DuplicateMatch[];
  fields: Field[];
  newValues: Record<string, any>;
  onIgnore: () => void;
  onViewDuplicate: (recordId: string) => void;
  onMerge: (targetRecordId: string) => void;
}

export function DuplicateWarningDialog({
  open,
  onOpenChange,
  duplicates,
  fields,
  newValues,
  onIgnore,
  onViewDuplicate,
  onMerge,
}: DuplicateWarningDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const getDisplayValue = (record: MockRecord) => {
    const vals = record.values;
    return vals[fields[0]?.fieldKey] || vals.full_name || vals.name || vals.deal_name || record.id;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Potential Duplicates Found
          </DialogTitle>
          <DialogDescription>
            We found {duplicates.length} existing record{duplicates.length > 1 ? 's' : ''} that may be a duplicate. Choose an action below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {duplicates.map((dup) => (
            <div
              key={dup.record.id}
              className={`rounded-lg border p-4 transition-colors cursor-pointer ${
                selectedId === dup.record.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30'
              }`}
              onClick={() => setSelectedId(dup.record.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {String(getDisplayValue(dup.record))}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {dup.matchedFields.map((label) => (
                      <Badge key={label} variant="outline" className="text-[10px] text-destructive border-destructive/30">
                        {label} match
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              {/* Show matching field values */}
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {fields.slice(0, 4).map((f) => {
                  const val = dup.record.values[f.fieldKey];
                  if (!val) return null;
                  return (
                    <div key={f.id}>
                      <span className="font-medium">{f.label}:</span> {String(val)}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={!selectedId}
              onClick={() => selectedId && onViewDuplicate(selectedId)}
            >
              <Eye className="h-4 w-4 mr-1.5" />
              View Duplicate
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={!selectedId}
              onClick={() => selectedId && onMerge(selectedId)}
            >
              <GitMerge className="h-4 w-4 mr-1.5" />
              Merge Records
            </Button>
          </div>
          <Button
            onClick={onIgnore}
            className="w-full gradient-brand text-primary-foreground"
          >
            <SkipForward className="h-4 w-4 mr-1.5" />
            Ignore & Create Anyway
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
