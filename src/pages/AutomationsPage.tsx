import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Plus, Trash2, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAutomations } from '@/hooks/useAutomations';
import { useModules } from '@/hooks/useModulesCRUD';
import { AutomationTriggerType, TRIGGER_LABELS } from '@/lib/automation-types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function AutomationsPage() {
  const { automations, loading, createAutomation, deleteAutomation, toggleActive } = useAutomations();
  const { modules } = useModules();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [triggerType, setTriggerType] = useState<AutomationTriggerType>('record_created');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name || !moduleId) return;
    setCreating(true);
    const auto = await createAutomation({ name, module_id: moduleId, trigger_event: triggerType });
    setCreating(false);
    if (auto) {
      toast({ title: 'Automation created', description: `"${name}" is ready to configure.` });
      setOpen(false);
      setName('');
      setModuleId('');
      navigate(`/automations/${auto.id}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create workflow rules to automate your CRM</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand text-primary-foreground shadow-brand hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />New Automation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Create Automation</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Auto-assign new leads" /></div>
              <div>
                <Label>Module</Label>
                <Select value={moduleId} onValueChange={setModuleId}>
                  <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
                  <SelectContent>{modules.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Trigger</Label>
                <Select value={triggerType} onValueChange={(v) => setTriggerType(v as AutomationTriggerType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={!name || !moduleId || creating} className="w-full gradient-brand text-primary-foreground">
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create & Configure
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : automations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Zap className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No automations yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {automations.map((auto, i) => {
            const mod = modules.find(m => m.id === auto.module_id);
            return (
              <motion.div key={auto.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer group" onClick={() => navigate(`/automations/${auto.id}`)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${auto.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Zap className={`h-5 w-5 ${auto.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-card-foreground">{auto.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">{TRIGGER_LABELS[auto.trigger_event]}</Badge>
                        <span className="text-xs text-muted-foreground">{mod?.name}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{(auto.conditions || []).length} condition{(auto.conditions || []).length !== 1 ? 's' : ''}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{(auto.actions || []).length} action{(auto.actions || []).length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <Switch checked={auto.is_active} onCheckedChange={() => toggleActive(auto.id)} />
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => { deleteAutomation(auto.id); toast({ title: 'Automation deleted' }); }}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
