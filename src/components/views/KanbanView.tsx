import { useState } from "react";
import { motion } from "framer-motion";
import { User, Building2, DollarSign, MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field } from "@/lib/types";
import { CrmRecord } from "@/hooks/useRecords";
import { usePipelines } from "@/hooks/usePipelines";
import { useToast } from "@/hooks/use-toast";
import { LeadScore } from "@/lib/lead-score-types";
import { LeadScoreBadge } from "@/components/LeadScoreBadge";
import { RecordTagsBadges } from "@/components/records/RecordTags";
import { Skeleton } from "@/components/ui/skeleton";

interface KanbanViewProps {
  records: CrmRecord[];
  fields: Field[];
  moduleId: string;
  onView: (recordId: string) => void;
  onDelete: (recordId: string, name: string) => void;
  onUpdateRecord: (recordId: string, values: Record<string, any>) => void;
  scores?: Map<string, LeadScore>;
}

const fallbackColors: Record<string, string> = {
  New: '#3B82F6', Contacted: '#8B5CF6', Proposal: '#F59E0B', Negotiation: '#10B981',
  'Closed Won': '#14B8A6', Qualified: '#10B981', Lost: '#EF4444', Discovery: '#3B82F6', 'Closed Lost': '#EF4444',
};

export function KanbanView({ records, fields, moduleId, onView, onDelete, onUpdateRecord, scores }: KanbanViewProps) {
  const { toast } = useToast();
  const { pipelines, loading: pipelinesLoading } = usePipelines(moduleId);
  const [activePipelineId, setActivePipelineId] = useState<string>('');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const stageField = fields.find((f) => f.fieldKey === 'status' || f.fieldKey === 'stage');
  const stageKey = stageField?.fieldKey || 'status';

  // Determine stages: from selected pipeline, or fallback to field options
  const activePipeline = pipelines.find(p => p.id === activePipelineId) || pipelines[0];
  const stages = activePipeline
    ? activePipeline.stages.map((s) => ({ name: s.name, color: s.color }))
    : (stageField?.options || ['New', 'In Progress', 'Done']).map((o) => ({ name: o, color: fallbackColors[o] || '#6B7280' }));

  const nameField = fields[0];
  const amountField = fields.find((f) => f.fieldType === 'currency');
  const companyField = fields.find((f) => f.fieldKey === 'company');

  const getRecordStage = (rec: CrmRecord) => rec.values?.[stageKey] || rec.stage || stages[0]?.name;

  const handleDragStart = (e: React.DragEvent, recordId: string) => { setDraggedId(recordId); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e: React.DragEvent, stageName: string) => {
    e.preventDefault();
    if (!draggedId) return;
    const record = records.find((r) => r.id === draggedId);
    if (record && getRecordStage(record) !== stageName) {
      onUpdateRecord(draggedId, { [stageKey]: stageName });
      toast({ title: "Stage changed", description: `Moved to ${stageName}` });
    }
    setDraggedId(null);
  };

  if (pipelinesLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      {/* Pipeline switcher */}
      {pipelines.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Pipeline:</span>
          <Select value={activePipeline?.id || ''} onValueChange={setActivePipelineId}>
            <SelectTrigger className="w-48 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageRecords = records.filter((r) => getRecordStage(r) === stage.name);
          return (
            <div key={stage.name} className="flex-shrink-0 w-[280px]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, stage.name)}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-sm font-semibold text-foreground">{stage.name}</span>
                <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px]">{stageRecords.length}</Badge>
              </div>
              <div className="space-y-2 min-h-[100px] rounded-lg bg-muted/30 border border-border/50 p-2">
                {stageRecords.map((rec) => {
                  const ls = scores?.get(rec.id);
                  return (
                    <motion.div key={rec.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: draggedId === rec.id ? 0.5 : 1, scale: 1 }}
                      draggable onDragStart={(e: any) => handleDragStart(e, rec.id)} onDragEnd={() => setDraggedId(null)}
                      className="rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-card-hover transition-all cursor-grab active:cursor-grabbing group">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-medium text-foreground truncate flex-1">{rec.values?.[nameField?.fieldKey] || 'Untitled'}</h4>
                        <div className="flex items-center gap-1">
                          {ls && <LeadScoreBadge score={ls.score} category={ls.category} />}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="h-5 w-5 flex items-center justify-center rounded-sm opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"><MoreHorizontal className="h-3 w-3 text-muted-foreground" /></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onView(rec.id)}><Eye className="h-3.5 w-3.5 mr-2" /> View</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(rec.id, rec.values?.[nameField?.fieldKey] || 'Untitled')}><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1.5">
                        {companyField && rec.values?.[companyField.fieldKey] && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="h-3 w-3" /><span className="truncate">{rec.values[companyField.fieldKey]}</span></div>
                        )}
                        {amountField && rec.values?.[amountField.fieldKey] != null && (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground"><DollarSign className="h-3 w-3 text-muted-foreground" />${Number(rec.values[amountField.fieldKey]).toLocaleString()}</div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><User className="h-3 w-3" /><span>{rec.createdBy}</span></div>
                        <RecordTagsBadges recordId={rec.id} />
                      </div>
                    </motion.div>
                  );
                })}
                {stageRecords.length === 0 && <div className="py-8 text-center text-xs text-muted-foreground">Drop here</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
