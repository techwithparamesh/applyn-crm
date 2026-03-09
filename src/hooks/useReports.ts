import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { Report, ReportFilter, ReportMetric } from '@/lib/report-types';
import { useToast } from '@/hooks/use-toast';

function mapDbToReport(row: any): Report {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    moduleId: row.module_id,
    filtersJSON: (row.filters_json || []) as ReportFilter[],
    groupBy: row.group_by,
    metrics: (row.metrics || []) as ReportMetric[],
    chartType: row.chart_type as Report['chartType'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    scheduleEmail: row.schedule_email || undefined,
    scheduleCron: row.schedule_cron || undefined,
    isDashboardWidget: row.is_dashboard_widget,
  };
}

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const { data, error } = await api.get('/api/reports');
    if (error) console.error('Error fetching reports:', error);
    else setReports(((data || []) as any[]).map(mapDbToReport));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const createReport = useCallback(
    async (report: Omit<Report, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) => {
      const { data, error } = await api.post('/api/reports', {
        name: report.name,
        module_id: report.moduleId,
        filters_json: report.filtersJSON,
        group_by: report.groupBy,
        metrics: report.metrics,
        chart_type: report.chartType,
      });
      if (error) {
        toast({ title: 'Error', description: 'Failed to create report', variant: 'destructive' });
        return null;
      }
      const newReport = mapDbToReport(data);
      setReports((prev) => [newReport, ...prev]);
      return newReport;
    },
    [toast]
  );

  const updateReport = useCallback(
    async (id: string, updates: Partial<Report>) => {
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.filtersJSON !== undefined) dbUpdates.filters_json = updates.filtersJSON;
      if (updates.groupBy !== undefined) dbUpdates.group_by = updates.groupBy;
      if (updates.metrics !== undefined) dbUpdates.metrics = updates.metrics;
      if (updates.chartType !== undefined) dbUpdates.chart_type = updates.chartType;
      if (updates.scheduleEmail !== undefined) dbUpdates.schedule_email = updates.scheduleEmail;
      if (updates.scheduleCron !== undefined) dbUpdates.schedule_cron = updates.scheduleCron;
      if (updates.isDashboardWidget !== undefined) dbUpdates.is_dashboard_widget = updates.isDashboardWidget;
      const { error } = await api.patch(`/api/reports/${id}`, dbUpdates);
      if (error) {
        toast({ title: 'Error', description: 'Failed to update report', variant: 'destructive' });
        return;
      }
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r)));
    },
    [toast]
  );

  const deleteReport = useCallback(async (id: string) => {
    const { error } = await api.delete(`/api/reports/${id}`);
    if (!error) setReports((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const getReport = useCallback((id: string) => reports.find((r) => r.id === id), [reports]);

  return { reports, loading, createReport, updateReport, deleteReport, getReport, refetch: fetchReports };
}

export function useReportData(report: Report | undefined) {
  const [dataPoints, setDataPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!report) {
      setDataPoints([]);
      return;
    }
    setLoading(true);
    api
      .get('/api/crm_records', { module_id: report.moduleId })
      .then(({ data }) => {
        setDataPoints((data as any[]) || []);
      })
      .finally(() => setLoading(false));
  }, [report?.id, report?.moduleId]);
  return { dataPoints, loading };
}
