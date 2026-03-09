import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CrmDashboard, DashboardWidget, DashboardWidgetType } from '@/lib/dashboard-types';
import { useToast } from '@/hooks/use-toast';

export function useDashboards() {
  const [dashboards, setDashboards] = useState<CrmDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboards = useCallback(async () => {
    setLoading(true);
    const { data: dbDashboards, error } = await supabase
      .from('dashboards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching dashboards:', error);
      setLoading(false);
      return;
    }

    // Fetch widgets for all dashboards
    const dashboardIds = (dbDashboards || []).map(d => d.id);
    let widgets: any[] = [];
    if (dashboardIds.length > 0) {
      const { data: dbWidgets } = await supabase
        .from('dashboard_widgets')
        .select('*')
        .in('dashboard_id', dashboardIds)
        .order('order_index', { ascending: true });
      widgets = dbWidgets || [];
    }

    const mapped: CrmDashboard[] = (dbDashboards || []).map(d => ({
      id: d.id,
      tenantId: d.tenant_id,
      name: d.name,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      widgets: widgets
        .filter(w => w.dashboard_id === d.id)
        .map(w => ({
          id: w.id,
          dashboardId: w.dashboard_id,
          widgetType: w.widget_type as DashboardWidgetType,
          configJSON: w.config_json as Record<string, any>,
          orderIndex: w.order_index,
          colSpan: w.col_span as 1 | 2 | 3,
        })),
    }));

    setDashboards(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDashboards(); }, [fetchDashboards]);

  const getDashboard = useCallback((id: string) => dashboards.find(d => d.id === id), [dashboards]);

  const createDashboard = useCallback(async (name: string) => {
    const { data, error } = await supabase
      .from('dashboards')
      .insert({ name })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to create dashboard', variant: 'destructive' });
      return null;
    }

    const d: CrmDashboard = {
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      widgets: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    setDashboards(prev => [d, ...prev]);
    return d;
  }, [toast]);

  const deleteDashboard = useCallback(async (id: string) => {
    const { error } = await supabase.from('dashboards').delete().eq('id', id);
    if (!error) setDashboards(prev => prev.filter(d => d.id !== id));
  }, []);

  const addWidget = useCallback(async (dashboardId: string, widgetType: DashboardWidgetType, configJSON: Record<string, any>, colSpan: 1 | 2 | 3 = 1) => {
    const dashboard = dashboards.find(d => d.id === dashboardId);
    const orderIndex = dashboard ? dashboard.widgets.length : 0;

    const { data, error } = await supabase
      .from('dashboard_widgets')
      .insert({
        dashboard_id: dashboardId,
        widget_type: widgetType,
        config_json: configJSON,
        order_index: orderIndex,
        col_span: colSpan,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to add widget', variant: 'destructive' });
      return;
    }

    const widget: DashboardWidget = {
      id: data.id,
      dashboardId: data.dashboard_id,
      widgetType: data.widget_type as DashboardWidgetType,
      configJSON: data.config_json as Record<string, any>,
      orderIndex: data.order_index,
      colSpan: data.col_span as 1 | 2 | 3,
    };

    setDashboards(prev => prev.map(d => {
      if (d.id !== dashboardId) return d;
      return { ...d, widgets: [...d.widgets, widget], updatedAt: new Date().toISOString() };
    }));
  }, [dashboards, toast]);

  const removeWidget = useCallback(async (dashboardId: string, widgetId: string) => {
    const { error } = await supabase.from('dashboard_widgets').delete().eq('id', widgetId);
    if (!error) {
      setDashboards(prev => prev.map(d => {
        if (d.id !== dashboardId) return d;
        return { ...d, widgets: d.widgets.filter(w => w.id !== widgetId) };
      }));
    }
  }, []);

  const reorderWidgets = useCallback(async (dashboardId: string, fromIndex: number, toIndex: number) => {
    setDashboards(prev => prev.map(d => {
      if (d.id !== dashboardId) return d;
      const sorted = [...d.widgets].sort((a, b) => a.orderIndex - b.orderIndex);
      const [moved] = sorted.splice(fromIndex, 1);
      sorted.splice(toIndex, 0, moved);
      const reordered = sorted.map((w, i) => ({ ...w, orderIndex: i }));

      // Fire-and-forget DB updates
      reordered.forEach(w => {
        supabase.from('dashboard_widgets').update({ order_index: w.orderIndex }).eq('id', w.id).then();
      });

      return { ...d, widgets: reordered };
    }));
  }, []);

  const resizeWidget = useCallback(async (dashboardId: string, widgetId: string, colSpan: 1 | 2 | 3) => {
    await supabase.from('dashboard_widgets').update({ col_span: colSpan }).eq('id', widgetId);
    setDashboards(prev => prev.map(d => {
      if (d.id !== dashboardId) return d;
      return { ...d, widgets: d.widgets.map(w => w.id === widgetId ? { ...w, colSpan } : w) };
    }));
  }, []);

  const updateWidgetConfig = useCallback(async (dashboardId: string, widgetId: string, configJSON: Record<string, any>) => {
    const dashboard = dashboards.find(d => d.id === dashboardId);
    const widget = dashboard?.widgets.find(w => w.id === widgetId);
    const merged = { ...(widget?.configJSON || {}), ...configJSON };

    await supabase.from('dashboard_widgets').update({ config_json: merged }).eq('id', widgetId);
    setDashboards(prev => prev.map(d => {
      if (d.id !== dashboardId) return d;
      return { ...d, widgets: d.widgets.map(w => w.id === widgetId ? { ...w, configJSON: merged } : w) };
    }));
  }, [dashboards]);

  return { dashboards, loading, getDashboard, createDashboard, deleteDashboard, addWidget, removeWidget, reorderWidgets, resizeWidget, updateWidgetConfig, refetch: fetchDashboards };
}
