import { useState } from "react";
import { motion } from "framer-motion";
import { Link2, Plus, X, ExternalLink, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRelationships } from "@/hooks/useRelationships";
import { mockModules, mockRecords } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface RelatedRecordsPanelProps {
  recordId: string;
  moduleId: string;
}

export function RelatedRecordsPanel({ recordId, moduleId }: RelatedRecordsPanelProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getRelatedRecords, linkRecords, unlinkRecords, getModuleRelationships } = useRelationships();
  const [linkOpen, setLinkOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState("");
  const [selectedRecord, setSelectedRecord] = useState("");

  const relatedGroups = getRelatedRecords(recordId, moduleId);
  const moduleRelationships = getModuleRelationships(moduleId);

  const handleLink = () => {
    if (!selectedRelationship || !selectedRecord) return;
    const rel = moduleRelationships.find((r) => r.id === selectedRelationship);
    if (!rel) return;

    const isSource = rel.sourceModuleId === moduleId;
    const result = isSource
      ? linkRecords(selectedRelationship, recordId, selectedRecord)
      : linkRecords(selectedRelationship, selectedRecord, recordId);

    if (result) {
      toast({ title: "Record linked" });
    } else {
      toast({ title: "Already linked", variant: "destructive" });
    }
    setLinkOpen(false);
    setSelectedRelationship("");
    setSelectedRecord("");
  };

  // Get available records for linking
  const getAvailableRecords = () => {
    if (!selectedRelationship) return [];
    const rel = moduleRelationships.find((r) => r.id === selectedRelationship);
    if (!rel) return [];
    const isSource = rel.sourceModuleId === moduleId;
    const targetModId = isSource ? rel.targetModuleId : rel.sourceModuleId;
    return mockRecords[targetModId] || [];
  };

  const getTargetModuleName = () => {
    if (!selectedRelationship) return '';
    const rel = moduleRelationships.find((r) => r.id === selectedRelationship);
    if (!rel) return '';
    const isSource = rel.sourceModuleId === moduleId;
    const targetModId = isSource ? rel.targetModuleId : rel.sourceModuleId;
    return mockModules.find((m) => m.id === targetModId)?.name || '';
  };

  if (moduleRelationships.length === 0) {
    return (
      <div className="text-center py-4">
        <Link2 className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No relationships configured</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button size="sm" variant="outline" className="w-full" onClick={() => setLinkOpen(true)}>
        <Plus className="h-3.5 w-3.5 mr-1.5" /> Link Record
      </Button>

      {relatedGroups.map((group) => (
        <div key={group.relatedModuleId} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group.relatedModuleName}</span>
            <Badge variant="secondary" className="h-4 px-1 text-[10px]">{group.records.length}</Badge>
          </div>
          {group.records.map((rec) => (
            <motion.div
              key={rec.recordRelationId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 rounded-lg border border-border p-2.5 group hover:bg-muted/30 transition-colors"
            >
              <div className="h-7 w-7 rounded-md gradient-brand flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-primary-foreground">
                  {rec.recordName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground flex-1 truncate">{rec.recordName}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => navigate(`/modules/${rec.moduleId}/records/${rec.recordId}`)}
              >
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => {
                  unlinkRecords(rec.recordRelationId);
                  toast({ title: "Record unlinked" });
                }}
              >
                <Unlink className="h-3 w-3 text-muted-foreground" />
              </Button>
            </motion.div>
          ))}
          {group.records.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-1">No linked records</p>
          )}
        </div>
      ))}

      {/* Link Dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Link Record</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Select value={selectedRelationship} onValueChange={(v) => { setSelectedRelationship(v); setSelectedRecord(""); }}>
                <SelectTrigger><SelectValue placeholder="Select relationship..." /></SelectTrigger>
                <SelectContent>
                  {moduleRelationships.map((rel) => {
                    const isSource = rel.sourceModuleId === moduleId;
                    const targetMod = mockModules.find((m) => m.id === (isSource ? rel.targetModuleId : rel.sourceModuleId));
                    return (
                      <SelectItem key={rel.id} value={rel.id}>
                        {targetMod?.name || 'Unknown'} ({rel.relationshipType === 'one_to_many' ? '1→N' : 'N↔N'})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {selectedRelationship && (
              <div>
                <Select value={selectedRecord} onValueChange={setSelectedRecord}>
                  <SelectTrigger><SelectValue placeholder={`Select ${getTargetModuleName().toLowerCase()}...`} /></SelectTrigger>
                  <SelectContent>
                    {getAvailableRecords().map((rec) => {
                      const name = Object.values(rec.values)[0];
                      return (
                        <SelectItem key={rec.id} value={rec.id}>{String(name)}</SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={handleLink} className="w-full gradient-brand text-primary-foreground" disabled={!selectedRelationship || !selectedRecord}>
              Link Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
