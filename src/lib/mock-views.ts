import { ModuleView } from './view-types';

export const mockViews: Record<string, ModuleView[]> = {
  '1': [
    { id: 'v1', tenantId: 't1', moduleId: '1', name: 'All Leads', viewType: 'table', configJSON: {}, orderIndex: 0, isDefault: true },
    { id: 'v2', tenantId: 't1', moduleId: '1', name: 'Pipeline', viewType: 'kanban', configJSON: {}, orderIndex: 1 },
    { id: 'v3', tenantId: 't1', moduleId: '1', name: 'Calendar', viewType: 'calendar', configJSON: {}, orderIndex: 2 },
    { id: 'v4', tenantId: 't1', moduleId: '1', name: 'Hot Leads', viewType: 'table', configJSON: { filters: { status: 'Qualified' } }, orderIndex: 3 },
  ],
  '2': [
    { id: 'v10', tenantId: 't1', moduleId: '2', name: 'All Contacts', viewType: 'table', configJSON: {}, orderIndex: 0, isDefault: true },
    { id: 'v11', tenantId: 't1', moduleId: '2', name: 'List View', viewType: 'list', configJSON: {}, orderIndex: 1 },
  ],
  '3': [
    { id: 'v20', tenantId: 't1', moduleId: '3', name: 'All Deals', viewType: 'table', configJSON: {}, orderIndex: 0, isDefault: true },
    { id: 'v21', tenantId: 't1', moduleId: '3', name: 'Deal Pipeline', viewType: 'kanban', configJSON: {}, orderIndex: 1 },
    { id: 'v22', tenantId: 't1', moduleId: '3', name: 'Closing Soon', viewType: 'calendar', configJSON: {}, orderIndex: 2 },
  ],
};
