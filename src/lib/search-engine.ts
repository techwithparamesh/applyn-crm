export interface SearchFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'gte' | 'lte';
  value: string;
}

/**
 * Parses a HubSpot-style search query into structured filters.
 *
 * Supported syntax:
 *   field:value        → equals
 *   field > value      → greater_than
 *   field < value      → less_than
 *   field >= value     → gte
 *   field <= value     → lte
 *   bare text          → free-text search (field = "_text")
 */
export function parseSearchQuery(input: string): { filters: SearchFilter[]; textQuery: string } {
  const filters: SearchFilter[] = [];
  let textParts: string[] = [];

  if (!input.trim()) return { filters, textQuery: '' };

  // Tokenize: split on spaces but respect quoted values
  const tokens: string[] = [];
  let current = '';
  let inQuote = false;
  for (const ch of input) {
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === ' ' && !inQuote) {
      if (current) tokens.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    // Check for colon-based filter: field:value
    const colonIdx = token.indexOf(':');
    if (colonIdx > 0 && colonIdx < token.length - 1) {
      filters.push({
        field: token.slice(0, colonIdx),
        operator: 'equals',
        value: token.slice(colonIdx + 1),
      });
      i++;
      continue;
    }

    // Check for comparison operators: field > value, field >= value
    if (i + 2 < tokens.length) {
      const op = tokens[i + 1];
      const val = tokens[i + 2];
      if (op === '>') { filters.push({ field: token, operator: 'greater_than', value: val }); i += 3; continue; }
      if (op === '<') { filters.push({ field: token, operator: 'less_than', value: val }); i += 3; continue; }
      if (op === '>=') { filters.push({ field: token, operator: 'gte', value: val }); i += 3; continue; }
      if (op === '<=') { filters.push({ field: token, operator: 'lte', value: val }); i += 3; continue; }
    }

    // Free text
    textParts.push(token);
    i++;
  }

  return { filters, textQuery: textParts.join(' ') };
}

/**
 * Checks if a record's JSONB values match a set of filters (client-side).
 */
export function matchesFilters(values: Record<string, any>, filters: SearchFilter[]): boolean {
  return filters.every(f => {
    const val = values[f.field];
    if (val === undefined || val === null) return false;

    const strVal = String(val).toLowerCase();
    const filterVal = f.value.toLowerCase();

    switch (f.operator) {
      case 'equals': return strVal === filterVal;
      case 'contains': return strVal.includes(filterVal);
      case 'greater_than': return parseFloat(String(val)) > parseFloat(f.value);
      case 'less_than': return parseFloat(String(val)) < parseFloat(f.value);
      case 'gte': return parseFloat(String(val)) >= parseFloat(f.value);
      case 'lte': return parseFloat(String(val)) <= parseFloat(f.value);
      default: return false;
    }
  });
}

// Known field suggestions for autocomplete
export const SEARCH_FIELD_SUGGESTIONS = [
  'company', 'email', 'phone', 'status', 'stage', 'amount', 'source',
  'owner', 'tag', 'name', 'full_name', 'deal_name', 'title', 'value',
  'created', 'updated',
];

export const FIELD_VALUE_SUGGESTIONS: Record<string, string[]> = {
  status: ['New', 'Contacted', 'Qualified', 'Lost'],
  stage: ['Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
  source: ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Event'],
};
