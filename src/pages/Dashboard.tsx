import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Settings2, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useDashboards } from '@/hooks/useDashboards';
import { useDashboardKpis } from '@/hooks/useDashboardKpis';
import { useAuth } from '@/components/AuthProvider';
import { KPIWidget } from '@/components/dashboard/KPIWidget';
import { ChartWidget } from '@/components/dashboard/ChartWidget';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { TasksWidget } from '@/components/dashboard/TasksWidget';
import { DataTableWidget } from '@/components/dashboard/DataTableWidget';
import { QuickActionsPanel } from '@/components/dashboard/QuickActionsPanel';
import {
  DASHBOARD_KPIS,
  REVENUE_TREND_DATA,
  PIPELINE_STAGES,
  DASHBOARD_ACTIVITY,
  DASHBOARD_TASKS,
  RECENT_LEADS,
  DEALS_CLOSING_SOON,
} from '@/lib/dashboard-data';
import { useTasks } from '@/hooks/useTasks';

export default function Dashboard() {
  const { dashboards, loading, createDashboard } = useDashboards();
  const { kpis } = useDashboardKpis();
  const dashboard = dashboards[0];
  const { profile } = useAuth();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const { tasks } = useTasks();

  useEffect(() => {
    if (!loading && !dashboard && !creating) {
      setCreating(true);
      createDashboard('Dashboard').then(() => {
        setCreating(false);
      });
    }
  }, [loading, dashboard, creating, createDashboard]);

  const displayName = profile?.name || 'User';
  const statusLabel = (s: string) => ({ todo: 'Pending', in_progress: 'In Progress', done: 'Done' }[s] || s);
  const taskRows = tasks.length
    ? tasks.slice(0, 5).map((t) => ({
        id: t.id,
        subject: t.title,
        dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
        status: statusLabel(t.status),
        priority: t.priority.charAt(0).toUpperCase() + t.priority.slice(1),
      }))
    : DASHBOARD_TASKS;

  const recentLeadsRows = RECENT_LEADS.map((l) => ({ name: l.name, company: l.company, phone: l.phone, source: l.source }));
  const dealsRows = DEALS_CLOSING_SOON.map((d) => ({ name: d.name, amount: d.amount, stage: d.stage, closeDate: d.closeDate }));

  if (loading && !dashboard) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, {displayName}. Here’s your CRM overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={editing ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditing(!editing)}
            className={editing ? 'gradient-brand text-primary-foreground' : ''}
          >
            <Settings2 className="h-4 w-4 mr-1.5" />
            {editing ? 'Done' : 'Customize'}
          </Button>
          {editing && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Widget
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Widget</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Use the dashboard sections below. Widget customization is available when you add widgets from here.
                </p>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* KPI Cards (tenant-scoped when API returns data) */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(kpis
            ? [
                { id: 'leads', title: 'Total Leads', value: String(kpis.total_leads), change: '', changeType: 'neutral' as const, icon: 'Users' },
                { id: 'deals', title: 'Active Deals', value: String(kpis.active_deals), change: '', changeType: 'neutral' as const, icon: 'Handshake' },
                { id: 'revenue', title: 'Revenue', value: typeof kpis.revenue === 'number' ? `$${kpis.revenue >= 1000 ? (kpis.revenue / 1000).toFixed(1) + 'K' : kpis.revenue}` : '$0', change: '', changeType: 'neutral' as const, icon: 'DollarSign' },
                { id: 'tasks', title: 'Tasks Due Today', value: String(kpis.tasks_due_today), change: 'Due today', changeType: 'neutral' as const, icon: 'CheckSquare' },
              ]
            : DASHBOARD_KPIS
          ).map((kpi, i) => (
            <motion.div
              key={kpi.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <KPIWidget
                title={kpi.title}
                value={kpi.value}
                change={kpi.change}
                changeType={kpi.changeType}
                icon={kpi.icon}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <ChartWidget title="Revenue Trend" type="revenue_trend" data={REVENUE_TREND_DATA} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <ChartWidget title="Pipeline Distribution" type="pipeline_distribution" data={PIPELINE_STAGES} />
        </motion.div>
      </section>

      {/* Activity + Tasks */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <ActivityFeed title="Recent Activity" items={DASHBOARD_ACTIVITY} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <TasksWidget title="My Tasks" tasks={taskRows} />
        </motion.div>
      </section>

      {/* Tables: Recent Leads + Deals Closing Soon */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <DataTableWidget
            title="Recent Leads"
            columns={[
              { key: 'name', label: 'Lead Name' },
              { key: 'company', label: 'Company' },
              { key: 'phone', label: 'Phone' },
              { key: 'source', label: 'Source' },
            ]}
            rows={recentLeadsRows}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <DataTableWidget
            title="Deals Closing Soon"
            columns={[
              { key: 'name', label: 'Deal Name' },
              { key: 'amount', label: 'Amount' },
              { key: 'stage', label: 'Stage' },
              { key: 'closeDate', label: 'Close Date' },
            ]}
            rows={dealsRows}
          />
        </motion.div>
      </section>

      {/* Quick Actions */}
      <section>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <QuickActionsPanel title="Quick Actions" />
        </motion.div>
      </section>
    </div>
  );
}
