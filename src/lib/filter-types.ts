export type FilterOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'between' | 'is_empty' | 'is_not_empty';

export type FilterLogic = 'and' | 'or';

export interface FilterCondition {
  id: string;
  fieldKey: string;
  operator: FilterOperator;
  value: string;
  valueTo?: string; // for "between"
}

export interface AdvancedFilter {
  logic: FilterLogic;
  conditions: FilterCondition[];
}

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'equals',
  not_equals: 'not equals',
  greater_than: 'greater than',
  less_than: 'less than',
  contains: 'contains',
  not_contains: 'not contains',
  between: 'between',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
};

export const OPERATORS_BY_TYPE: Record<string, FilterOperator[]> = {
  text: ['equals', 'not_equals', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
  email: ['equals', 'not_equals', 'contains', 'is_empty', 'is_not_empty'],
  phone: ['equals', 'not_equals', 'contains', 'is_empty', 'is_not_empty'],
  textarea: ['contains', 'not_contains', 'is_empty', 'is_not_empty'],
  number: ['equals', 'not_equals', 'greater_than', 'less_than', 'between', 'is_empty', 'is_not_empty'],
  currency: ['equals', 'not_equals', 'greater_than', 'less_than', 'between', 'is_empty', 'is_not_empty'],
  date: ['equals', 'not_equals', 'greater_than', 'less_than', 'between', 'is_empty', 'is_not_empty'],
  select: ['equals', 'not_equals', 'is_empty', 'is_not_empty'],
  checkbox: ['equals'],
  default: ['equals', 'not_equals', 'contains', 'is_empty', 'is_not_empty'],
};

export function evaluateCondition(condition: FilterCondition, recordValue: any): boolean {
  const val = recordValue ?? '';
  const strVal = String(val).toLowerCase();
  const filterVal = condition.value.toLowerCase();

  switch (condition.operator) {
    case 'equals':
      return strVal === filterVal;
    case 'not_equals':
      return strVal !== filterVal;
    case 'greater_than':
      return Number(val) > Number(condition.value);
    case 'less_than':
      return Number(val) < Number(condition.value);
    case 'contains':
      return strVal.includes(filterVal);
    case 'not_contains':
      return !strVal.includes(filterVal);
    case 'between': {
      const num = Number(val);
      return num >= Number(condition.value) && num <= Number(condition.valueTo ?? condition.value);
    }
    case 'is_empty':
      return val === '' || val === null || val === undefined;
    case 'is_not_empty':
      return val !== '' && val !== null && val !== undefined;
    default:
      return true;
  }
}

export function applyAdvancedFilter(filter: AdvancedFilter, record: Record<string, any>): boolean {
  if (filter.conditions.length === 0) return true;

  const results = filter.conditions.map((c) => evaluateCondition(c, record[c.fieldKey]));

  return filter.logic === 'and'
    ? results.every(Boolean)
    : results.some(Boolean);
}

export function createEmptyCondition(): FilterCondition {
  return {
    id: `fc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fieldKey: '',
    operator: 'equals',
    value: '',
  };
}

export function createEmptyFilter(): AdvancedFilter {
  return { logic: 'and', conditions: [] };
}
