import { useState, useCallback } from 'react';
import { ModuleView, ViewType } from '@/lib/view-types';
import { mockViews } from '@/lib/mock-views';

export function useModuleViews(moduleId: string) {
  const [views, setViews] = useState<ModuleView[]>(mockViews[moduleId] || [
    { id: `v-default-${moduleId}`, tenantId: 't1', moduleId, name: 'All Records', viewType: 'table', configJSON: {}, orderIndex: 0, isDefault: true },
  ]);

  const [activeViewId, setActiveViewId] = useState<string>(
    views.find((v) => v.isDefault)?.id || views[0]?.id || ''
  );

  const activeView = views.find((v) => v.id === activeViewId) || views[0];

  const createView = useCallback((name: string, viewType: ViewType, configJSON: ModuleView['configJSON'] = {}) => {
    const newView: ModuleView = {
      id: `v-${Date.now()}`,
      tenantId: 't1',
      moduleId,
      name,
      viewType,
      configJSON,
      orderIndex: views.length,
    };
    setViews((prev) => [...prev, newView]);
    setActiveViewId(newView.id);
    return newView;
  }, [moduleId, views.length]);

  const deleteView = useCallback((viewId: string) => {
    setViews((prev) => prev.filter((v) => v.id !== viewId));
    if (activeViewId === viewId) {
      setActiveViewId(views[0]?.id || '');
    }
  }, [activeViewId, views]);

  const updateViewConfig = useCallback((viewId: string, configJSON: ModuleView['configJSON']) => {
    setViews((prev) =>
      prev.map((v) => v.id === viewId ? { ...v, configJSON: { ...v.configJSON, ...configJSON } } : v)
    );
  }, []);

  return {
    views,
    activeView,
    activeViewId,
    setActiveViewId,
    createView,
    deleteView,
    updateViewConfig,
  };
}
