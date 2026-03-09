import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Zap, Plus, Trash2, Filter, Mail, User, FileText, Edit3, MessageSquare,
  ArrowDown, Loader2, History, CheckCircle2, XCircle, SkipForward,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAutomations } from '@/hooks/useAutomations';
import { useModules, useFields, toField } from '@/hooks/useModulesCRUD';
import { useAutomationLogs } from '@/hooks/useAutomationLogs';
import {
  AutomationTriggerType, AutomationActionType, ConditionOperator,
  TRIGGER_LABELS, ACTION_LABELS, CONDITION_OPERATOR_LABELS,
} from '@/lib/automation-types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const ACTION_ICONS: Record<AutomationActionType, typeof Mail> = {
  assign_owner: User,
  send_email: Mail,
  send_whatsapp: MessageSquare,
  create_task: FileText,
  update_field: Edit3,
};

const ACTION_COLORS: Record<AutomationActionType, string> = {
  assign_owner: 'bg-blue-500/10 text-blue-600',
  send_email: 'bg-violet-500/10 text-violet-600',
  send_whatsapp: 'bg-emerald-500/10 text-emerald-600',
  create_task: 'bg-amber-500/10 text-amber-600',
  update_field: 'bg-rose-500/10 text-rose-600',
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  success: { icon: CheckCircle2, color: 'text-emerald-600' },
  partial: { icon: XCircle, color: 'text-amber-600' },
  skipped: { icon: SkipForward, color: 'text-muted-foreground' },
  error: { icon: XCircle, color: 'text-destructive' },
};

function FlowConnector() {
  return (
    <div className="flex flex-col items-center py-1">
      <div className="w-px h-6 bg-border" />
      <ArrowDown className="h-4 w-4 text-muted-foreground -my-0.5" />
      <div className="w-px h-2 bg-border" />
    </div>
  );
}

export default function AutomationBuilderPage() {
  const { automationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    getAutomation, updateAutomation, toggleActive,
    addCondition, removeCondition, addAction, removeAction,
  } = useAutomations();
  const { modules } = useModules();

  const automation = getAutomation(automationId || '');
  const { fields: dbFields } = useFields(automation?.module_id || '');
  const fields = dbFields.map(toField);
  const { logs, loading: logsLoading } = useAutomationLogs(automationId);

  // Condition dialog state
  const [condOpen, setCondOpen] = useState(false);
  const [condField, setCondField] = useState('');
  const [condOp, setCondOp] = useState<ConditionOperator>('equals');
  const [condValue, setCondValue] = useState('');

  // Action dialog state
  const [actOpen, setActOpen] = useState(false);
  const [actType, setActType] = useState<AutomationActionType>('assign_owner');
  const [actConfig, setActConfig] = useState<Record<string, string>>({});

  if (!automation) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading automation...</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/automations')}>Back to Automations</Button>
      </div>
    );
  }

  const mod = modules.find(m => m.id === automation.module_id);
  const conditions = automation.conditions || [];
  const actions = automation.actions || [];

  const handleAddCondition = async () => {
    if (!condField) return;
    await addCondition(automation.id, {
      field_name: condField,
      operator: condOp,
      value: condValue,
      sort_order: conditions.length,
    });
    setCondOpen(false);
    setCondField('');
    setCondValue('');
    toast({ title: 'Condition added' });
  };

  const handleAddAction = async () => {
    await addAction(automation.id, {
      action_type: actType,
      action_config: { ...actConfig },
      sort_order: actions.length,
    });
    setActOpen(false);
    setActConfig({});
    toast({ title: 'Action added' });
  };

  const renderActionConfigFields = () => {
    switch (actType) {
      case 'assign_owner':
        return (
          <div><Label>Owner Name</Label><Input value={actConfig.owner || ''} onChange={e => setActConfig({ ...actConfig, owner: e.target.value })} placeholder="e.g. John Doe" /></div>
        );
      case 'send_email':
        return (
          <>
            <div><Label>To</Label><Input value={actConfig.to || ''} onChange={e => setActConfig({ ...actConfig, to: e.target.value })} placeholder="{{record.email}}" /></div>
            <div><Label>Subject</Label><Input value={actConfig.subject || ''} onChange={e => setActConfig({ ...actConfig, subject: e.target.value })} placeholder="Subject line" /></div>
            <div><Label>Body</Label><Textarea value={actConfig.body || ''} onChange={e => setActConfig({ ...actConfig, body: e.target.value })} placeholder="Email body..." rows={3} /></div>
          </>
        );
      case 'send_whatsapp':
        return (
          <>
            <div><Label>To</Label><Input value={actConfig.to || ''} onChange={e => setActConfig({ ...actConfig, to: e.target.value })} placeholder="{{record.phone}}" /></div>
            <div><Label>Message</Label><Textarea value={actConfig.message || ''} onChange={e => setActConfig({ ...actConfig, message: e.target.value })} placeholder="WhatsApp message..." rows={3} /></div>
          </>
        );
      case 'create_task':
        return (
          <>
            <div><Label>Task Title</Label><Input value={actConfig.title || ''} onChange={e => setActConfig({ ...actConfig, title: e.target.value })} placeholder="Follow up with lead" /></div>
            <div><Label>Assignee</Label><Input value={actConfig.assignee || ''} onChange={e => setActConfig({ ...actConfig, assignee: e.target.value })} placeholder="John Doe" /></div>
          </>
        );
      case 'update_field':
        return (
          <>
            <div>
              <Label>Field</Label>
              <Select value={actConfig.field_key || ''} onValueChange={v => setActConfig({ ...actConfig, field_key: v })}>
                <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
                <SelectContent>{fields.map(f => <SelectItem key={f.fieldKey} value={f.fieldKey}>{f.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>New Value</Label><Input value={actConfig.new_value || ''} onChange={e => setActConfig({ ...actConfig, new_value: e.target.value })} placeholder="Value" /></div>
          </>
        );
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/automations')}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{automation.name}</h1>
          <p className="text-sm text-muted-foreground">{mod?.name} · {TRIGGER_LABELS[automation.trigger_event]}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{automation.is_active ? 'Active' : 'Inactive'}</span>
            <Switch checked={automation.is_active} onCheckedChange={() => toggleActive(automation.id)} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="builder" className="w-full">
        <TabsList>
          <TabsTrigger value="builder"><Zap className="h-3.5 w-3.5 mr-1.5" />Builder</TabsTrigger>
          <TabsTrigger value="logs"><History className="h-3.5 w-3.5 mr-1.5" />Execution Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="mt-4">
          {/* Visual Flow */}
          <div className="flex flex-col items-center">
            {/* TRIGGER NODE */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
              <Card className="border-2 border-primary/30 bg-primary/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trigger</p>
                    <p className="text-sm font-semibold text-foreground">{TRIGGER_LABELS[automation.trigger_event]}</p>
                  </div>
                  <Select value={automation.trigger_event} onValueChange={(v) => updateAutomation(automation.id, { trigger_event: v as AutomationTriggerType })}>
                    <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TRIGGER_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </motion.div>

            <FlowConnector />

            {/* CONDITIONS */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="w-full max-w-lg">
              <Card className="border-2 border-amber-400/30 bg-amber-50/50 dark:bg-amber-950/10">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-amber-600" />
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Conditions</CardTitle>
                      {conditions.length === 0 && <span className="text-xs text-muted-foreground">(all records)</span>}
                    </div>
                    <Dialog open={condOpen} onOpenChange={setCondOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs"><Plus className="h-3 w-3 mr-1" />Add</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-sm">
                        <DialogHeader><DialogTitle>Add Condition</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div>
                            <Label>Field</Label>
                            <Select value={condField} onValueChange={setCondField}>
                              <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
                              <SelectContent>{fields.map(f => <SelectItem key={f.fieldKey} value={f.fieldKey}>{f.label}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Operator</Label>
                            <Select value={condOp} onValueChange={(v) => setCondOp(v as ConditionOperator)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(CONDITION_OPERATOR_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div><Label>Value</Label><Input value={condValue} onChange={e => setCondValue(e.target.value)} placeholder="Value" /></div>
                          <Button onClick={handleAddCondition} disabled={!condField} className="w-full">Add Condition</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                {conditions.length > 0 && (
                  <CardContent className="px-4 pb-4 pt-1">
                    <div className="space-y-2">
                      {conditions.map((cond, i) => {
                        const field = fields.find(f => f.fieldKey === cond.field_name);
                        return (
                          <div key={cond.id} className="flex items-center gap-2 bg-background/80 rounded-lg px-3 py-2 border border-border/50">
                            {i > 0 && <Badge variant="outline" className="text-[9px] px-1.5 mr-1">AND</Badge>}
                            <span className="text-xs font-medium text-foreground">{field?.label || cond.field_name}</span>
                            <Badge variant="secondary" className="text-[10px]">{CONDITION_OPERATOR_LABELS[cond.operator]}</Badge>
                            {cond.value && <span className="text-xs text-muted-foreground">"{cond.value}"</span>}
                            <div className="flex-1" />
                            <button onClick={() => removeCondition(automation.id, cond.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>

            <FlowConnector />

            {/* ACTIONS */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="w-full max-w-lg space-y-3">
              {actions.map((action, i) => {
                const Icon = ACTION_ICONS[action.action_type];
                const colorClass = ACTION_COLORS[action.action_type];
                return (
                  <div key={action.id}>
                    <Card className="border-2 border-accent/30 bg-accent/5">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Action {i + 1}</p>
                          <p className="text-sm font-semibold text-foreground">{ACTION_LABELS[action.action_type]}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(action.action_config).map(([k, v]) => (
                              <span key={k} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{k}: {v}</span>
                            ))}
                          </div>
                        </div>
                        <button onClick={() => removeAction(automation.id, action.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </CardContent>
                    </Card>
                    {i < actions.length - 1 && <FlowConnector />}
                  </div>
                );
              })}

              {/* Add Action */}
              <div className="flex flex-col items-center">
                {actions.length > 0 && <FlowConnector />}
                <Dialog open={actOpen} onOpenChange={setActOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-dashed border-2 w-full max-w-lg h-14 text-muted-foreground hover:text-foreground hover:border-primary/30">
                      <Plus className="h-4 w-4 mr-2" />Add Action
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Add Action</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div>
                        <Label>Action Type</Label>
                        <div className="grid grid-cols-2 gap-2 mt-1.5">
                          {(Object.entries(ACTION_LABELS) as [AutomationActionType, string][]).map(([key, label]) => {
                            const Icon = ACTION_ICONS[key];
                            const colorClass = ACTION_COLORS[key];
                            return (
                              <button key={key} onClick={() => { setActType(key); setActConfig({}); }}
                                className={`flex items-center gap-2 p-3 rounded-lg border text-left text-xs font-medium transition-colors ${actType === key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted/50'}`}>
                                <div className={`h-7 w-7 rounded-md flex items-center justify-center ${colorClass}`}><Icon className="h-3.5 w-3.5" /></div>
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {renderActionConfigFields()}
                      <Button onClick={handleAddAction} className="w-full gradient-brand text-primary-foreground">Add Action</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <div className="space-y-2">
            {logsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No executions yet</p>
                <p className="text-xs text-muted-foreground mt-1">Logs will appear here when this automation runs.</p>
              </div>
            ) : (
              logs.map((log) => {
                const cfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.error;
                const StatusIcon = cfg.icon;
                return (
                  <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                    <StatusIcon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{log.status}</Badge>
                        {log.details?.actions_run != null && (
                          <span className="text-xs text-muted-foreground">{log.details.actions_run} action(s) run</span>
                        )}
                        {log.details?.reason && (
                          <span className="text-xs text-muted-foreground">{log.details.reason}</span>
                        )}
                      </div>
                      {log.details?.errors?.length > 0 && (
                        <p className="text-xs text-destructive mt-0.5 truncate">{log.details.errors[0]}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {format(new Date(log.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
