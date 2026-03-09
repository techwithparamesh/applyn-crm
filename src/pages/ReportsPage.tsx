import { useState, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Plus, Trash2, Edit, PieChart, LineChart, Table2, Calendar, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReports, useReportData } from '@/hooks/useReports';
import { mockModules, mockFields } from '@/lib/mock-data';
import { ChartType, ReportMetric, MetricAggregation } from '@/lib/report-types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart as RPieChart, Pie, Cell, LineChart as RLineChart, Line, CartesianGrid } from 'recharts';

const CHART_COLORS = ['hsl(263, 70%, 58%)', 'hsl(217, 91%, 60%)', 'hsl(174, 58%, 40%)', 'hsl(0, 84%, 60%)', 'hsl(39, 92%, 49%)'];

const chartIcon = (type: ChartType) => {
  switch (type) {
    case 'bar': return BarChart3;
    case 'pie': return PieChart;
    case 'line': return LineChart;
    case 'table': return Table2;
  }
};

const MiniChart = forwardRef<HTMLDivElement, { report: ReturnType<typeof useReports>['reports'][0] }>(function MiniChart({ report }, ref) {
  const data = useReportData(report);
  const metricKey = report.metrics[0]?.label || 'Count';

  if (!data.length) return <p className="text-xs text-muted-foreground">No data</p>;

  if (report.chartType === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={120}>
        <RPieChart>
          <Pie data={data} dataKey={metricKey} nameKey="group" cx="50%" cy="50%" outerRadius={50} innerRadius={25}>
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </RPieChart>
      </ResponsiveContainer>
    );
  }

  if (report.chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={120}>
        <RLineChart data={data}>
          <XAxis dataKey="group" tick={{ fontSize: 10 }} />
          <Line type="monotone" dataKey={metricKey} stroke="hsl(263, 70%, 58%)" strokeWidth={2} dot={false} />
          <Tooltip />
        </RLineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data}>
        <XAxis dataKey="group" tick={{ fontSize: 10 }} />
        <Bar dataKey={metricKey} fill="hsl(263, 70%, 58%)" radius={[4, 4, 0, 0]} />
        <Tooltip />
      </BarChart>
    </ResponsiveContainer>
  );
});

export default function ReportsPage() {
  const { reports, createReport, deleteReport } = useReports();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [groupBy, setGroupBy] = useState('');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [metricField, setMetricField] = useState('*');
  const [metricAgg, setMetricAgg] = useState<MetricAggregation>('count');

  const fields = moduleId ? mockFields[moduleId] || [] : [];

  const handleCreate = () => {
    if (!name || !moduleId || !groupBy) return;
    const metric: ReportMetric = {
      fieldKey: metricField,
      aggregation: metricAgg,
      label: metricAgg === 'count' ? 'Count' : `${metricAgg}(${fields.find(f => f.fieldKey === metricField)?.label || metricField})`,
    };
    createReport({ name, moduleId, filtersJSON: [], groupBy, metrics: [metric], chartType });
    toast({ title: 'Report created', description: `"${name}" has been created.` });
    setOpen(false);
    setName(''); setModuleId(''); setGroupBy(''); setMetricField('*'); setMetricAgg('count');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Generate insights from your CRM data</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand text-primary-foreground shadow-brand hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Create Report</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Report Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Deals by Stage" /></div>
              <div>
                <Label>Module</Label>
                <Select value={moduleId} onValueChange={(v) => { setModuleId(v); setGroupBy(''); setMetricField('*'); }}>
                  <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
                  <SelectContent>{mockModules.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {moduleId && (
                <>
                  <div>
                    <Label>Group By</Label>
                    <Select value={groupBy} onValueChange={setGroupBy}>
                      <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
                      <SelectContent>{fields.map(f => <SelectItem key={f.fieldKey} value={f.fieldKey}>{f.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Metric</Label>
                      <Select value={metricAgg} onValueChange={(v) => setMetricAgg(v as MetricAggregation)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="count">Count</SelectItem>
                          <SelectItem value="sum">Sum</SelectItem>
                          <SelectItem value="avg">Average</SelectItem>
                          <SelectItem value="min">Min</SelectItem>
                          <SelectItem value="max">Max</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {metricAgg !== 'count' && (
                      <div>
                        <Label>Field</Label>
                        <Select value={metricField} onValueChange={setMetricField}>
                          <SelectTrigger><SelectValue placeholder="Field" /></SelectTrigger>
                          <SelectContent>{fields.filter(f => f.fieldType === 'currency' || f.fieldType === 'number').map(f => <SelectItem key={f.fieldKey} value={f.fieldKey}>{f.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Chart Type</Label>
                    <div className="grid grid-cols-4 gap-2 mt-1.5">
                      {(['bar', 'line', 'pie', 'table'] as ChartType[]).map(ct => {
                        const Icon = chartIcon(ct);
                        return (
                          <button key={ct} onClick={() => setChartType(ct)} className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition-colors ${chartType === ct ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted/50'}`}>
                            <Icon className="h-4 w-4" />{ct.charAt(0).toUpperCase() + ct.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
              <Button onClick={handleCreate} disabled={!name || !moduleId || !groupBy} className="w-full gradient-brand text-primary-foreground">Create Report</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {reports.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">No reports yet</p></CardContent></Card>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => {
            const mod = mockModules.find(m => m.id === report.moduleId);
            const Icon = chartIcon(report.chartType);
            return (
              <motion.div key={report.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer group" onClick={() => navigate(`/reports/${report.id}`)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="h-4 w-4 text-primary" /></div>
                        <div>
                          <CardTitle className="text-sm font-semibold">{report.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{mod?.name || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { deleteReport(report.id); toast({ title: 'Report deleted' }); }}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      <Badge variant="secondary" className="text-[10px]">{report.chartType}</Badge>
                      {report.scheduleCron && <Badge variant="outline" className="text-[10px]"><Mail className="h-3 w-3 mr-1" />{report.scheduleCron}</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <MiniChart report={report} />
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
