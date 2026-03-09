import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Report, ReportDataPoint, ReportFilter, ReportMetric } from '@/lib/report-types';
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
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
    } else {
      setReports((data || []).map(mapDbToReport));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const createReport = useCallback(async (report: Omit<Report, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        name: report.name,
        module_id: report.moduleId,
        filters_json: report.filtersJSON as any,
        group_by: report.groupBy,
        metrics: report.metrics as any,
        chart_type: report.chartType,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to create report', variant: 'destructive' });
      return null;
    }

    const newReport = mapDbToReport(data);
    setReports(prev => [newReport, ...prev]);
    return newReport;
  }, [toast]);

  const updateReport = useCallback(async (id: string, updates: Partial<Report>) => {
    const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.filtersJSON !== undefined) dbUpdates.filters_json = updates.filtersJSON;
    if (updates.groupBy !== undefined) dbUpdates.group_by = updates.groupBy;
    if (updates.metrics !== undefined) dbUpdates.metrics = updates.metrics;
    if (updates.chartType !== undefined) dbUpdates.chart_type = updates.chartType;
    if (updates.scheduleEmail !== undefined) dbUpdates.schedule_email = updates.scheduleEmail;
    if (updates.scheduleCron !== undefined) dbUpdates.schedule_cron = updates.scheduleCron;
    if (updates.isDashboardWidget !== undefined) dbUpdates.is_dashboard_widget = updates.isDashboardWidget;

    const { error } = await supabase.from('reports').update(dbUpdates).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update report', variant: 'destructive' });
      return;
    }

    setReports(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r));
  }, [toast]);

  const deleteReport = useCallback(async (id: string) => {
    const { error } = await supabase.from('reports').delete().eq('id', id);
    if (!error) setReports(prev => prev.filter(r => r.id !== id));
  }, []);

  const getReport = useCallback((id: string) => reports.find(r => r.id === id), [reports]);

  return { reports, loading, createReport, updateReport, deleteReport, getReport, refetch: fetchReports };
}

export function useReportData(report: Report | undefined) {
  const [data, setData] = useState<ReportDataPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!report) { setData([]); return; }

    const fetchData = async () => {
      setLoading(true);

      // Query crm_records dynamically
      let query = supabase
        .from('crm_records')
        .select('*')
        .eq('module_id', report.moduleId)
        .is('deleted_at', null);

      const { data: records, error } = await query;

      if (error || !records) {
        console.error('Error fetching report data:', error);
        setData([]);
        setLoading(false);
        return;
      }

      // Apply filters client-side
      let filtered = records;
      for (const filter of report.filtersJSON) {
        filtered = filtered.filter(r => {
          const values = r.values as Record<string, any>;
          const val = String(values?.[filter.fieldKey] ?? '');
          switch (filter.operator) {
            case 'equals': return val === filter.value;
            case 'contains': return val.toLowerCase().includes(filter.value.toLowerCase());
            case 'gt': return Number(values?.[filter.fieldKey]) > Number(filter.value);
            case 'lt': return Number(values?.[filter.fieldKey]) < Number(filter.value);
            default: return true;
          }
        });
      }

      // Group by
      const groups = new Map<string, typeof filtered>();
      for (const record of filtered) {
        const values = record.values as Record<string, any>;
        const key = String(values?.[report.groupBy] ?? 'Unknown');
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(record);
      }

      // Aggregate metrics
      const points: ReportDataPoint[] = [];
      for (const [group, recs] of groups) {
        const point: ReportDataPoint = { group };
        for (const metric of report.metrics) {
          const key = metric.label;
          if (metric.aggregation === 'count') {
            point[key] = recs.length;
          } else {
            const nums = recs.map(r => Number((r.values as Record<string, any>)?.[metric.fieldKey] || 0));
            switch (metric.aggregation) {
              case 'sum': point[key] = nums.reduce((a, b) => a + b, 0); break;
              case 'avg': point[key] = nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0; break;
              case 'min': point[key] = Math.min(...nums); break;
              case 'max': point[key] = Math.max(...nums); break;
            }
          }
        }
        points.push(point);
      }

      setData(points);
      setLoading(false);
    };

    fetchData();
  }, [report?.id, report?.filtersJSON, report?.groupBy, report?.metrics, report?.moduleId]);

  return data;
}
