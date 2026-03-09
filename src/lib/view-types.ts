import { AdvancedFilter } from './filter-types';

export type ViewType = 'table' | 'kanban' | 'calendar' | 'list';

export interface ModuleView {
  id: string;
  tenantId: string;
  moduleId: string;
  name: string;
  viewType: ViewType;
  configJSON: {
    filters?: Record<string, string>;
    advancedFilter?: AdvancedFilter;
    sortField?: string;
    sortDir?: 'asc' | 'desc';
    visibleColumns?: string[];
  };
  orderIndex: number;
  isDefault?: boolean;
}
