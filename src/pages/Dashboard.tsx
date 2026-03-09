import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Handshake, DollarSign, TrendingUp, FileText, Boxes, GitBranch,
  FileStack, Upload, Plus, Trash2, GripVertical, Maximize2, Minimize2,
  BarChart3, PieChart as PieIcon, LineChart as LineIcon, Table2, Zap, Settings2, LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboards } from '@/hooks/useDashboards';
import { DashboardWidgetType, DashboardWidget, WIDGET_TYPE_LABELS } from '@/lib/dashboard-types';
import { chartData, mockActivities, dashboardStats } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const ICON_MAP: Record<string, any> = { Users, Handshake, DollarSign, TrendingUp, FileText, Boxes, GitBranch, FileStack, Upload, Zap, BarChart3, LayoutDashboard };
const PIE_COLORS = ['hsl(263,70%,58%)', 'hsl(239,84%,67%)', 'hsl(217,91%,60%)', 'hsl(174,58%,40%)', 'hsl(39,92%,49%)'];

const WIDGET_ICONS: Record<DashboardWidgetType, any> = {
  metric_card: TrendingUp, bar_chart: BarChart3, pie_chart: PieIcon,
  line_chart: LineIcon, table: Table2, quick_actions: Zap,
};

function WidgetRenderer({ widget }: { widget: DashboardWidget }) {
  const cfg = widget.configJSON;

  switch (widget.widgetType) {
    case 'metric_card': {
      const Icon = ICON_MAP[cfg.icon] || FileText;
      return (
        <div className="flex items-start justify-between h-full">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{cfg.title}</p>
            <p className="text-2xl font-bold text-card-foreground mt-1">{cfg.value}</p>
            {cfg.change && (
              <p className={`text-xs mt-1 font-medium ${cfg.changeType === 'positive' ? 'text-accent' : cfg.changeType === 'negative' ? 'text-destructive' : 'text-muted-foreground'}`}>{cfg.change}</p>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="h-5 w-5 text-primary" /></div>
        </div>
      );
    }
    case 'line_chart':
      return (
        <div>
          <p className="text-sm font-semibold text-card-foreground mb-3">{cfg.title}</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData.recordsTrend}>
              <defs><linearGradient id={`grad-${widget.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(263,70%,58%)" stopOpacity={0.2} /><stop offset="95%" stopColor="hsl(263,70%,58%)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(215,16%,47%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(215,16%,47%)" />
              <Tooltip /><Area type="monotone" dataKey="records" stroke="hsl(263,70%,58%)" fill={`url(#grad-${widget.id})`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    case 'bar_chart':
      return (
        <div>
          <p className="text-sm font-semibold text-card-foreground mb-3">{cfg.title || 'Bar Chart'}</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData.pipelineDistribution}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(215,16%,47%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(215,16%,47%)" />
              <Tooltip /><Bar dataKey="value" fill="hsl(263,70%,58%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    case 'pie_chart':
      return (
        <div>
          <p className="text-sm font-semibold text-card-foreground mb-3">{cfg.title}</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart><Pie data={chartData.pipelineDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value">{chartData.pipelineDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-1">{chartData.pipelineDistribution.map(e => <div key={e.name} className="flex items-center gap-1 text-[10px] text-muted-foreground"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />{e.name}</div>)}</div>
        </div>
      );
    case 'table':
      return (
        <div>
          <p className="text-sm font-semibold text-card-foreground mb-3">{cfg.title}</p>
          <div className="space-y-2 max-h-[200px] overflow-auto">
            {mockActivities.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-start gap-2 text-xs">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${a.type === 'record_created' ? 'bg-accent' : 'bg-primary'}`} />
                <div><p className="text-card-foreground">{a.message}</p><p className="text-muted-foreground">{new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p></div>
              </div>
            ))}
          </div>
        </div>
      );
    case 'quick_actions': {
      const navigate = useNavigate();
      return (
        <div>
          <p className="text-sm font-semibold text-card-foreground mb-3">{cfg.title}</p>
          <div className="space-y-1.5">
            {[{ label: 'Create Module', icon: Boxes, url: '/modules' }, { label: 'Templates', icon: FileStack, url: '/templates' }, { label: 'Pipelines', icon: GitBranch, url: '/pipelines' }, { label: 'Reports', icon: BarChart3, url: '/reports' }].map(item => (
              <button key={item.label} onClick={() => navigate(item.url)} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-card-foreground hover:bg-muted/50 transition-colors text-left">
                <item.icon className="h-3.5 w-3.5 text-muted-foreground" />{item.label}
              </button>
            ))}
          </div>
        </div>
      );
    }
  }
}

export default function Dashboard() {
  const { dashboards, loading, addWidget, removeWidget, reorderWidgets, resizeWidget } = useDashboards();
  const dashboard = dashboards[0];
  const navigate = useNavigate();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [newType, setNewType] = useState<DashboardWidgetType>('metric_card');
  const [newTitle, setNewTitle] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newIcon, setNewIcon] = useState('TrendingUp');
  const [editing, setEditing] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  if (loading) return <div className="p-6 flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Loading dashboard...</p></div>;
  if (!dashboard) return null;

  const sorted = [...dashboard.widgets].sort((a, b) => a.orderIndex - b.orderIndex);

  const handleAddWidget = () => {
    let config: Record<string, any> = { title: newTitle || WIDGET_TYPE_LABELS[newType] };
    let colSpan: 1 | 2 | 3 = 1;
    if (newType === 'metric_card') {
      config = { ...config, value: newValue || '0', change: '', changeType: 'neutral', icon: newIcon };
    } else if (['line_chart', 'bar_chart', 'table'].includes(newType)) {
      colSpan = 2;
    }
    addWidget(dashboard.id, newType, config, colSpan);
    toast({ title: 'Widget added' });
    setAddOpen(false);
    setNewTitle('');
    setNewValue('');
  };

  const handleDragStart = (index: number) => { dragItem.current = index; };
  const handleDragEnter = (index: number) => { dragOver.current = index; };
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOver.current !== null && dragItem.current !== dragOver.current) {
      reorderWidgets(dashboard.id, dragItem.current, dragOver.current);
    }
    dragItem.current = null;
    dragOver.current = null;
  };

  const cycleSize = (w: DashboardWidget) => {
    const next = w.colSpan === 1 ? 2 : w.colSpan === 2 ? 3 : 1;
    resizeWidget(dashboard.id, w.id, next as 1 | 2 | 3);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Welcome back, John. Here's your CRM overview.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={editing ? 'default' : 'outline'} size="sm" onClick={() => setEditing(!editing)} className={editing ? 'gradient-brand text-primary-foreground' : ''}>
            <Settings2 className="h-4 w-4 mr-1.5" />{editing ? 'Done' : 'Customize'}
          </Button>
          {editing && (
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1.5" />Add Widget</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Add Widget</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Widget Type</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1.5">
                      {(Object.entries(WIDGET_TYPE_LABELS) as [DashboardWidgetType, string][]).map(([k, v]) => {
                        const Icon = WIDGET_ICONS[k];
                        return (
                          <button key={k} onClick={() => setNewType(k)} className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-colors ${newType === k ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted/50'}`}>
                            <Icon className="h-4 w-4" />{v}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div><Label>Title</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Widget title" /></div>
                  {newType === 'metric_card' && (
                    <>
                      <div><Label>Value</Label><Input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="e.g. 42" /></div>
                      <div>
                        <Label>Icon</Label>
                        <Select value={newIcon} onValueChange={setNewIcon}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.keys(ICON_MAP).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  <Button onClick={handleAddWidget} className="w-full gradient-brand text-primary-foreground">Add Widget</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((widget, index) => (
          <motion.div
            key={widget.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`${widget.colSpan === 2 ? 'sm:col-span-2' : widget.colSpan === 3 ? 'sm:col-span-2 lg:col-span-3' : ''}`}
            draggable={editing}
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
          >
            <Card className={`shadow-card hover:shadow-card-hover transition-all h-full ${editing ? 'ring-1 ring-dashed ring-primary/20 cursor-grab active:cursor-grabbing' : ''}`}>
              <CardContent className="p-5 relative">
                {editing && (
                  <div className="absolute top-2 right-2 flex gap-1 z-10">
                    <button onClick={() => cycleSize(widget)} className="h-6 w-6 rounded bg-muted/80 flex items-center justify-center hover:bg-muted" title="Resize">
                      {widget.colSpan < 3 ? <Maximize2 className="h-3 w-3 text-muted-foreground" /> : <Minimize2 className="h-3 w-3 text-muted-foreground" />}
                    </button>
                    <button onClick={() => { removeWidget(dashboard.id, widget.id); toast({ title: 'Widget removed' }); }} className="h-6 w-6 rounded bg-muted/80 flex items-center justify-center hover:bg-destructive/10">
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </button>
                    <div className="h-6 w-6 rounded bg-muted/80 flex items-center justify-center"><GripVertical className="h-3 w-3 text-muted-foreground" /></div>
                  </div>
                )}
                <WidgetRenderer widget={widget} />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {sorted.length === 0 && (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><LayoutDashboard className="h-12 w-12 text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">No widgets yet. Click Customize to get started.</p></CardContent></Card>
      )}
    </div>
  );
}
