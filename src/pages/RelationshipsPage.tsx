import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, ArrowRight, Trash2, Link2, Boxes, Users, Contact, Handshake, CheckSquare, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { mockModules } from "@/lib/mock-data";
import { useRelationships } from "@/hooks/useRelationships";
import { useToast } from "@/hooks/use-toast";
import { RelationshipType } from "@/lib/types";

const iconMap: Record<string, any> = {
  Users, Contact, Handshake, CheckSquare, Building2, Boxes,
};

export default function RelationshipsPage() {
  const { relationships, createRelationship, deleteRelationship } = useRelationships();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [sourceModule, setSourceModule] = useState("");
  const [targetModule, setTargetModule] = useState("");
  const [relType, setRelType] = useState<RelationshipType>("one_to_many");

  const handleCreate = () => {
    if (!sourceModule || !targetModule || sourceModule === targetModule) {
      toast({ title: "Invalid selection", description: "Please select two different modules.", variant: "destructive" });
      return;
    }
    const result = createRelationship(sourceModule, targetModule, relType);
    if (!result) {
      toast({ title: "Relationship exists", description: "This relationship already exists.", variant: "destructive" });
      return;
    }
    toast({ title: "Relationship created", description: "Modules have been linked." });
    setCreateOpen(false);
    setSourceModule("");
    setTargetModule("");
  };

  const getModuleName = (id: string) => mockModules.find((m) => m.id === id)?.name || 'Unknown';
  const getModuleIcon = (id: string) => {
    const mod = mockModules.find((m) => m.id === id);
    return iconMap[mod?.icon || ''] || Boxes;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relationships</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Link modules together to create data connections</p>
        </div>
        <Button className="gradient-brand text-primary-foreground shadow-brand hover:opacity-90" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Relationship
        </Button>
      </div>

      {/* Relationships list */}
      <div className="space-y-3">
        {relationships.map((rel, i) => {
          const SourceIcon = getModuleIcon(rel.sourceModuleId);
          const TargetIcon = getModuleIcon(rel.targetModuleId);

          return (
            <motion.div
              key={rel.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border bg-card p-4 shadow-card hover:shadow-card-hover transition-all group"
            >
              <div className="flex items-center gap-4">
                {/* Source */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <SourceIcon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground truncate">{getModuleName(rel.sourceModuleId)}</span>
                </div>

                {/* Arrow + Type */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="h-px w-6 bg-border" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="h-px w-6 bg-border" />
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {rel.relationshipType === 'one_to_many' ? '1 → Many' : 'Many ↔ Many'}
                  </Badge>
                </div>

                {/* Target */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
                  <span className="text-sm font-semibold text-foreground truncate">{getModuleName(rel.targetModuleId)}</span>
                  <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <TargetIcon className="h-4.5 w-4.5 text-accent" />
                  </div>
                </div>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => {
                    deleteRelationship(rel.id);
                    toast({ title: "Relationship deleted" });
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </motion.div>
          );
        })}

        {relationships.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Link2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No relationships defined yet.</p>
            <Button variant="link" className="mt-1" onClick={() => setCreateOpen(true)}>Create your first relationship</Button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Relationship</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Source Module</Label>
              <Select value={sourceModule} onValueChange={setSourceModule}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select module..." /></SelectTrigger>
                <SelectContent>
                  {mockModules.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target Module</Label>
              <Select value={targetModule} onValueChange={setTargetModule}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select module..." /></SelectTrigger>
                <SelectContent>
                  {mockModules.filter((m) => m.id !== sourceModule).map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Relationship Type</Label>
              <Select value={relType} onValueChange={(v) => setRelType(v as RelationshipType)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_to_many">One to Many (1 → N)</SelectItem>
                  <SelectItem value="many_to_many">Many to Many (N ↔ N)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} className="w-full gradient-brand text-primary-foreground" disabled={!sourceModule || !targetModule}>
              Create Relationship
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
