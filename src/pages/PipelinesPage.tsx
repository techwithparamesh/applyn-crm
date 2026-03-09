import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { usePipelines } from "@/hooks/usePipelines";
import { useModules } from "@/hooks/useModulesCRUD";

const DEFAULT_COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

export default function PipelinesPage() {
  const { pipelines, loading, createPipeline, updatePipeline, deletePipeline } = usePipelines();
  const { modules } = useModules();
  const [activePipelineId, setActivePipelineId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [stages, setStages] = useState<{ name: string; color: string }[]>([
    { name: "New", color: DEFAULT_COLORS[0] },
    { name: "In Progress", color: DEFAULT_COLORS[1] },
    { name: "Done", color: DEFAULT_COLORS[3] },
  ]);

  // Auto-select first pipeline
  const effectiveActiveId = activePipelineId || pipelines[0]?.id || '';
  const activePipeline = pipelines.find(p => p.id === effectiveActiveId);

  const handleSave = async () => {
    if (!name.trim() || stages.length === 0) return;
    if (editingId) {
      await updatePipeline(editingId, name, stages);
      toast.success("Pipeline updated");
    } else {
      if (!selectedModuleId) { toast.error("Select a module"); return; }
      await createPipeline(name, selectedModuleId, stages);
      toast.success("Pipeline created");
    }
    resetDialog();
  };

  const handleEdit = (pipeline: typeof pipelines[0]) => {
    setName(pipeline.name);
    setSelectedModuleId(pipeline.moduleId);
    setStages(pipeline.stages.map(s => ({ name: s.name, color: s.color })));
    setEditingId(pipeline.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deletePipeline(id);
    if (effectiveActiveId === id) setActivePipelineId('');
    toast.success("Pipeline deleted");
  };

  const resetDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setName("");
    setSelectedModuleId("");
    setStages([
      { name: "New", color: DEFAULT_COLORS[0] },
      { name: "In Progress", color: DEFAULT_COLORS[1] },
      { name: "Done", color: DEFAULT_COLORS[3] },
    ]);
  };

  const addStage = () => setStages([...stages, { name: "", color: DEFAULT_COLORS[stages.length % DEFAULT_COLORS.length] }]);
  const removeStage = (i: number) => setStages(stages.filter((_, idx) => idx !== i));
  const updateStage = (i: number, field: 'name' | 'color', value: string) =>
    setStages(stages.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  if (loading) {
    return <div className="p-6 max-w-full mx-auto space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="p-6 max-w-full mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipelines</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage sales pipelines and stages</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetDialog(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="gradient-brand text-primary-foreground shadow-brand hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" /> New Pipeline
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingId ? 'Edit Pipeline' : 'Create Pipeline'}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Pipeline Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sales Pipeline" className="mt-1" /></div>
              {!editingId && (
                <div>
                  <Label>Module</Label>
                  <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select module" /></SelectTrigger>
                    <SelectContent>
                      {modules.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Stages</Label>
                  <Button variant="outline" size="sm" onClick={addStage}><Plus className="h-3 w-3 mr-1" />Add Stage</Button>
                </div>
                <div className="space-y-2">
                  {stages.map((stage, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <input type="color" value={stage.color} onChange={(e) => updateStage(i, 'color', e.target.value)} className="h-8 w-8 rounded border-0 cursor-pointer shrink-0" />
                      <Input value={stage.name} onChange={(e) => updateStage(i, 'name', e.target.value)} placeholder="Stage name" className="flex-1" />
                      {stages.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeStage(i)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleSave} className="w-full gradient-brand text-primary-foreground">{editingId ? 'Save Changes' : 'Create Pipeline'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {pipelines.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No pipelines yet</p>
          <p className="text-sm mt-1">Create your first pipeline to get started.</p>
        </div>
      ) : (
        <>
          {/* Pipeline tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {pipelines.map(p => (
              <div key={p.id} className="flex items-center gap-1">
                <button
                  onClick={() => setActivePipelineId(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    effectiveActiveId === p.id ? 'gradient-brand text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p.name}
                </button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(p)}>
                  <Edit className="h-3 w-3 text-muted-foreground" />
                </Button>
                {pipelines.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Stage preview */}
          {activePipeline && (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {activePipeline.stages.map((stage, si) => (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: si * 0.05 }}
                  className="flex-shrink-0 w-72"
                >
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    <h3 className="text-sm font-semibold text-foreground">{stage.name}</h3>
                  </div>
                  <div className="min-h-[100px] p-2 rounded-xl bg-muted/30 border border-border/50">
                    <p className="py-8 text-center text-xs text-muted-foreground">No records</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
