import { Report } from './report-types';

export const mockReports: Report[] = [
  {
    id: 'rpt-1',
    tenantId: 't1',
    name: 'Deals by Stage',
    moduleId: '3',
    filtersJSON: [],
    groupBy: 'stage',
    metrics: [{ fieldKey: 'amount', aggregation: 'sum', label: 'Total Amount' }],
    chartType: 'bar',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-07T10:00:00Z',
  },
  {
    id: 'rpt-2',
    tenantId: 't1',
    name: 'Leads by Source',
    moduleId: '1',
    filtersJSON: [],
    groupBy: 'source',
    metrics: [{ fieldKey: '*', aggregation: 'count', label: 'Count' }],
    chartType: 'pie',
    createdAt: '2026-03-02T10:00:00Z',
    updatedAt: '2026-03-06T10:00:00Z',
  },
  {
    id: 'rpt-3',
    tenantId: 't1',
    name: 'Lead Values by Status',
    moduleId: '1',
    filtersJSON: [],
    groupBy: 'status',
    metrics: [
      { fieldKey: 'value', aggregation: 'sum', label: 'Total Value' },
      { fieldKey: '*', aggregation: 'count', label: 'Count' },
    ],
    chartType: 'bar',
    createdAt: '2026-03-03T10:00:00Z',
    updatedAt: '2026-03-05T10:00:00Z',
  },
];
