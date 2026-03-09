export type ChartType = 'bar' | 'line' | 'pie' | 'table';

export type MetricAggregation = 'count' | 'sum' | 'avg' | 'min' | 'max';

export interface ReportMetric {
  fieldKey: string;
  aggregation: MetricAggregation;
  label: string;
}

export interface ReportFilter {
  fieldKey: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt';
  value: string;
}

export interface Report {
  id: string;
  tenantId: string;
  name: string;
  moduleId: string;
  filtersJSON: ReportFilter[];
  groupBy: string;
  metrics: ReportMetric[];
  chartType: ChartType;
  createdAt: string;
  updatedAt: string;
  scheduleEmail?: string;
  scheduleCron?: 'weekly' | 'daily' | 'monthly';
  isDashboardWidget?: boolean;
}

export interface ReportDataPoint {
  group: string;
  [key: string]: string | number;
}
