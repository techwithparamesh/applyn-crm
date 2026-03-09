import { CrmDashboard } from './dashboard-types';

export const mockDashboards: CrmDashboard[] = [
  {
    id: 'dash-1',
    tenantId: 't1',
    name: 'Main Dashboard',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-07T10:00:00Z',
    widgets: [
      { id: 'w1', dashboardId: 'dash-1', widgetType: 'metric_card', configJSON: { title: 'Total Leads', value: '187', change: '+23% this month', changeType: 'positive', icon: 'Users' }, orderIndex: 0, colSpan: 1 },
      { id: 'w2', dashboardId: 'dash-1', widgetType: 'metric_card', configJSON: { title: 'Active Deals', value: '42', change: '+12 this week', changeType: 'positive', icon: 'Handshake' }, orderIndex: 1, colSpan: 1 },
      { id: 'w3', dashboardId: 'dash-1', widgetType: 'metric_card', configJSON: { title: 'Revenue', value: '$187K', change: '+18% vs last month', changeType: 'positive', icon: 'DollarSign' }, orderIndex: 2, colSpan: 1 },
      { id: 'w4', dashboardId: 'dash-1', widgetType: 'metric_card', configJSON: { title: 'Conversion Rate', value: '24.5%', change: '+2.3% improvement', changeType: 'positive', icon: 'TrendingUp' }, orderIndex: 3, colSpan: 1 },
      { id: 'w5', dashboardId: 'dash-1', widgetType: 'line_chart', configJSON: { title: 'Records Growth', dataKey: 'recordsTrend' }, orderIndex: 4, colSpan: 2 },
      { id: 'w6', dashboardId: 'dash-1', widgetType: 'pie_chart', configJSON: { title: 'Pipeline Distribution', dataKey: 'pipelineDistribution' }, orderIndex: 5, colSpan: 1 },
      { id: 'w7', dashboardId: 'dash-1', widgetType: 'table', configJSON: { title: 'Recent Activity', dataKey: 'activities' }, orderIndex: 6, colSpan: 2 },
      { id: 'w8', dashboardId: 'dash-1', widgetType: 'quick_actions', configJSON: { title: 'Quick Actions' }, orderIndex: 7, colSpan: 1 },
    ],
  },
];
