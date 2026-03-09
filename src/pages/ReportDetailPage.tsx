import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Mail, LayoutDashboard, Plus, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useReports, useReportData } from '@/hooks/useReports';
import { mockModules, mockFields } from '@/lib/mock-data';
import { ChartType, ReportFilter } from '@/lib/report-types';
import { useToast } from '@/hooks/use-toast';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

const CHART_COLORS = ['hsl(263, 70%, 58%)', 'hsl(217, 91%, 60%)', 'hsl(174, 58%, 40%)', 'hsl(0, 84%, 60%)', 'hsl(39, 92%, 49%)', 'hsl(280, 65%, 60%)'];

export default function ReportDetailPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getReport, updateReport } = useReports();
  const report = getReport(reportId || '');
  const data = useReportData(report);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filterField, setFilterField] = useState('');
  const [filterOp, setFilterOp] = useState<ReportFilter['operator']>('equals');
  const [filterValue, setFilterValue] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleEmail, setScheduleEmail] = useState(report?.scheduleEmail || '');
  const [scheduleCron, setScheduleCron] = useState(report?.scheduleCron || 'weekly');

  if (!report) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Report not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/reports')}>Back to Reports</Button>
      </div>
    );
  }

  const mod = mockModules.find(m => m.id === report.moduleId);
  const fields = mockFields[report.moduleId] || [];
  const metricKeys = report.metrics.map(m => m.label);

  const handleAddFilter = () => {
    if (!filterField || !filterValue) return;
    const newFilters = [...report.filtersJSON, { fieldKey: filterField, operator: filterOp, value: filterValue }];
    updateReport(report.id, { filtersJSON: newFilters });
    setFilterField(''); setFilterValue('');
    setFilterOpen(false);
    toast({ title: 'Filter added' });
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = report.filtersJSON.filter((_, i) => i !== index);
    updateReport(report.id, { filtersJSON: newFilters });
  };

  const handleChartChange = (ct: ChartType) => updateReport(report.id, { chartType: ct });

  const handleSchedule = () => {
    updateReport(report.id, { scheduleEmail, scheduleCron: scheduleCron as any });
    toast({ title: 'Schedule saved', description: `Report will be emailed ${scheduleCron}` });
    setScheduleOpen(false);
  };

  const handleAddToDashboard = () => {
    updateReport(report.id, { isDashboardWidget: true });
    toast({ title: 'Added to dashboard', description: 'This report is now a dashboard widget.' });
  };

  const renderChart = () => {
    if (!data.length) return <p className="text-center text-muted-foreground py-12">No data matches the current filters</p>;

    if (report.chartType === 'table') {
      return (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{report.groupBy}</TableHead>
                {metricKeys.map(k => <TableHead key={k} className="text-right">{k}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{row.group}</TableCell>
                  {metricKeys.map(k => <TableCell key={k} className="text-right">{typeof row[k] === 'number' ? (row[k] as number).toLocaleString() : row[k]}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (report.chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie data={data} dataKey={metricKeys[0]} nameKey="group" cx="50%" cy="50%" outerRadius={130} innerRadius={60} paddingAngle={3} label={({ group, percent }) => `${group} ${(percent * 100).toFixed(0)}%`}>
              {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (report.chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
            <XAxis dataKey="group" tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
            <Tooltip />
            <Legend />
            {metricKeys.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} />)}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
          <XAxis dataKey="group" tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
          <Tooltip />
          <Legend />
          {metricKeys.map((k, i) => <Bar key={k} dataKey={k} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />)}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/reports')}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{report.name}</h1>
          <p className="text-sm text-muted-foreground">{mod?.name} · Grouped by {fields.find(f => f.fieldKey === report.groupBy)?.label || report.groupBy}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAddToDashboard}><LayoutDashboard className="h-4 w-4 mr-1.5" />Add to Dashboard</Button>
          <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm"><Mail className="h-4 w-4 mr-1.5" />Schedule</Button></DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader><DialogTitle>Schedule Email Report</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Email</Label><Input value={scheduleEmail} onChange={e => setScheduleEmail(e.target.value)} placeholder="john@company.com" /></div>
                <div>
                  <Label>Frequency</Label>
                  <Select value={scheduleCron} onValueChange={(v) => setScheduleCron(v as 'daily' | 'weekly' | 'monthly')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSchedule} disabled={!scheduleEmail} className="w-full gradient-brand text-primary-foreground">Save Schedule</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Filter className="h-4 w-4" />Filters</CardTitle>
            <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
              <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="h-3.5 w-3.5 mr-1" />Add Filter</Button></DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader><DialogTitle>Add Filter</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Field</Label>
                    <Select value={filterField} onValueChange={setFilterField}>
                      <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
                      <SelectContent>{fields.map(f => <SelectItem key={f.fieldKey} value={f.fieldKey}>{f.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Operator</Label>
                    <Select value={filterOp} onValueChange={v => setFilterOp(v as ReportFilter['operator'])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="gt">Greater than</SelectItem>
                        <SelectItem value="lt">Less than</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Value</Label><Input value={filterValue} onChange={e => setFilterValue(e.target.value)} placeholder="Filter value" /></div>
                  <Button onClick={handleAddFilter} disabled={!filterField || !filterValue} className="w-full">Apply Filter</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        {report.filtersJSON.length > 0 && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {report.filtersJSON.map((f, i) => (
                <Badge key={i} variant="secondary" className="gap-1.5 pr-1">
                  {fields.find(fd => fd.fieldKey === f.fieldKey)?.label || f.fieldKey} {f.operator} "{f.value}"
                  <button onClick={() => handleRemoveFilter(i)} className="ml-1 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Chart type switcher + Chart */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Visualization</CardTitle>
            <div className="flex gap-1">
              {(['bar', 'line', 'pie', 'table'] as ChartType[]).map(ct => (
                <Button key={ct} variant={report.chartType === ct ? 'default' : 'ghost'} size="sm" className={report.chartType === ct ? 'gradient-brand text-primary-foreground' : ''} onClick={() => handleChartChange(ct)}>
                  {ct.charAt(0).toUpperCase() + ct.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <motion.div key={report.chartType} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {renderChart()}
          </motion.div>
        </CardContent>
      </Card>

      {/* Summary */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {report.metrics.map(m => {
            const vals = data.map(d => Number(d[m.label] || 0));
            const total = vals.reduce((a, b) => a + b, 0);
            return (
              <Card key={m.label}>
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground">{m.label} (Total)</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{total.toLocaleString()}</p>
                </CardContent>
              </Card>
            );
          })}
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Groups</p>
              <p className="text-2xl font-bold text-foreground mt-1">{data.length}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
