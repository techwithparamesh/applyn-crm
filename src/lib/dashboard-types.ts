export type DashboardWidgetType = 'metric_card' | 'bar_chart' | 'pie_chart' | 'line_chart' | 'table' | 'quick_actions';

export interface DashboardWidget {
  id: string;
  dashboardId: string;
  widgetType: DashboardWidgetType;
  configJSON: Record<string, any>;
  orderIndex: number;
  colSpan: 1 | 2 | 3;
}

export interface CrmDashboard {
  id: string;
  tenantId: string;
  name: string;
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
}

export const WIDGET_TYPE_LABELS: Record<DashboardWidgetType, string> = {
  metric_card: 'Metric Card',
  bar_chart: 'Bar Chart',
  pie_chart: 'Pie Chart',
  line_chart: 'Line Chart',
  table: 'Data Table',
  quick_actions: 'Quick Actions',
};
