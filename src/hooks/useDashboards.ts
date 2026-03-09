import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { CrmDashboard, DashboardWidget, DashboardWidgetType } from '@/lib/dashboard-types';
import { useToast } from '@/hooks/use-toast';

export function useDashboards() {
  const [dashboards, setDashboards] = useState<CrmDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboards = useCallback(async () => {
    setLoading(true);
    const { data: dbDashboards, error } = await api.get('/api/dashboards');
    if (error || !dbDashboards) {
      setLoading(false);
      return;
    }
    const list = (dbDashboards || []) as any[];
    const mapped: CrmDashboard[] = [];
    for (const d of list) {
      const { data: widgetRows } = await api.get('/api/dashboard_widgets', { dashboard_id: d.id });
      const widgets = ((widgetRows || []) as any[]).map((w: any) => ({
          id: w.id,
          dashboardId: w.dashboard_id,
          widgetType: w.widget_type as DashboardWidgetType,
          configJSON: (w.config_json as Record<string, any>) || {},
          orderIndex: w.order_index,
        colSpan: (w.col_span as 1 | 2 | 3) || 1,
      }));
      mapped.push({
        id: d.id,
        tenantId: d.tenant_id,
        name: d.name,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        widgets,
      });
    }
    setDashboards(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboards();
  }, [fetchDashboards]);

  const getDashboard = useCallback((id: string) => dashboards.find((d) => d.id === id), [dashboards]);

  const createDashboard = useCallback(
    async (name: string) => {
      const { data, error } = await api.post('/api/dashboards', { name });
      if (error) {
        toast({ title: 'Error', description: 'Failed to create dashboard', variant: 'destructive' });
        return null;
      }
      const d = data as any;
      const dash: CrmDashboard = {
        id: d.id,
        tenantId: d.tenant_id,
        name: d.name,
        widgets: [],
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      };
      setDashboards((prev) => [dash, ...prev]);
      return dash;
    },
    [toast]
  );

  const deleteDashboard = useCallback(async (id: string) => {
    const { error } = await api.delete(`/api/dashboards/${id}`);
    if (!error) setDashboards((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const addWidget = useCallback(
    async (dashboardId: string, widgetType: DashboardWidgetType, configJSON: Record<string, any>, colSpan: 1 | 2 | 3 = 1) => {
      const dashboard = dashboards.find((d) => d.id === dashboardId);
      const orderIndex = dashboard ? dashboard.widgets.length : 0;
      const { data, error } = await api.post('/api/dashboard_widgets', {
        dashboard_id: dashboardId,
        widget_type: widgetType,
        config_json: configJSON,
        order_index: orderIndex,
        col_span: colSpan,
      });
      if (error) {
        toast({ title: 'Error', description: 'Failed to add widget', variant: 'destructive' });
        return;
      }
      const w = data as any;
      const widget: DashboardWidget = {
        id: w.id,
        dashboardId: w.dashboard_id,
        widgetType: w.widget_type as DashboardWidgetType,
        configJSON: (w.config_json as Record<string, any>) || {},
        orderIndex: w.order_index,
        colSpan: (w.col_span as 1 | 2 | 3) || 1,
      };
      setDashboards((prev) =>
        prev.map((d) => {
          if (d.id !== dashboardId) return d;
          return { ...d, widgets: [...d.widgets, widget], updatedAt: new Date().toISOString() };
        })
      );
    },
    [dashboards, toast]
  );

  const removeWidget = useCallback(async (dashboardId: string, widgetId: string) => {
    const { error } = await api.delete(`/api/dashboard_widgets/${widgetId}`);
    if (!error) {
      setDashboards((prev) =>
        prev.map((d) => {
          if (d.id !== dashboardId) return d;
          return { ...d, widgets: d.widgets.filter((w) => w.id !== widgetId) };
        })
      );
    }
  }, []);

  const reorderWidgets = useCallback(async (dashboardId: string, fromIndex: number, toIndex: number) => {
    setDashboards((prev) =>
      prev.map((d) => {
        if (d.id !== dashboardId) return d;
        const sorted = [...d.widgets].sort((a, b) => a.orderIndex - b.orderIndex);
        const [moved] = sorted.splice(fromIndex, 1);
        sorted.splice(toIndex, 0, moved);
        const reordered = sorted.map((w, i) => ({ ...w, orderIndex: i }));
        reordered.forEach((w) => api.patch(`/api/dashboard_widgets/${w.id}`, { order_index: w.orderIndex }));
        return { ...d, widgets: reordered };
      })
    );
  }, []);

  const resizeWidget = useCallback(async (dashboardId: string, widgetId: string, colSpan: 1 | 2 | 3) => {
    await api.patch(`/api/dashboard_widgets/${widgetId}`, { col_span: colSpan });
    setDashboards((prev) =>
      prev.map((d) => {
        if (d.id !== dashboardId) return d;
        return { ...d, widgets: d.widgets.map((w) => (w.id === widgetId ? { ...w, colSpan } : w)) };
      })
    );
  }, []);

  const updateWidgetConfig = useCallback(async (dashboardId: string, widgetId: string, configJSON: Record<string, any>) => {
    const dashboard = dashboards.find((d) => d.id === dashboardId);
    const widget = dashboard?.widgets.find((w) => w.id === widgetId);
    const merged = { ...(widget?.configJSON || {}), ...configJSON };
    await api.patch(`/api/dashboard_widgets/${widgetId}`, { config_json: merged });
    setDashboards((prev) =>
      prev.map((d) => {
        if (d.id !== dashboardId) return d;
        return { ...d, widgets: d.widgets.map((w) => (w.id === widgetId ? { ...w, configJSON: merged } : w)) };
      })
    );
  }, [dashboards]);

  return {
    dashboards,
    loading,
    getDashboard,
    createDashboard,
    deleteDashboard,
    addWidget,
    removeWidget,
    reorderWidgets,
    resizeWidget,
    updateWidgetConfig,
    refetch: fetchDashboards,
  };
}
