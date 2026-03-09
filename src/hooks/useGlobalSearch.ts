import { useState, useCallback, useMemo, useEffect } from 'react';
import { api } from '@/lib/api';
import { mockModules, mockRecords, mockFields } from '@/lib/mock-data';
import { parseSearchQuery, matchesFilters, SearchFilter } from '@/lib/search-engine';

export interface SearchResult {
  id: string;
  moduleId: string;
  moduleName: string;
  title: string;
  subtitle: string;
  stage?: string;
  owner?: string;
  tags?: string[];
  link: string;
}

export function useGlobalSearch(query: string) {
  const [dbResults, setDbResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Parse query
  const { filters, textQuery } = useMemo(() => parseSearchQuery(query), [query]);

  // Search mock data (client-side, instant)
  const mockResults = useMemo(() => {
    if (!query || query.length < 2) return [];
    const results: SearchResult[] = [];

    for (const mod of mockModules) {
      const records = mockRecords[mod.id] || [];
      const fields = mockFields[mod.id] || [];
      const nameField = fields[0]?.fieldKey;

      for (const rec of records) {
        // Apply structured filters
        if (filters.length > 0 && !matchesFilters(rec.values, filters)) continue;

        // Apply text query
        if (textQuery && !Object.values(rec.values).some(v => String(v).toLowerCase().includes(textQuery.toLowerCase()))) continue;

        // If no filters and no text query but query exists, do general match
        if (filters.length === 0 && !textQuery) continue;

        const title = nameField ? String(rec.values[nameField] || 'Untitled') : 'Untitled';
        const subtitleParts = fields.slice(1, 3).map(f => rec.values[f.fieldKey]).filter(Boolean);

        results.push({
          id: rec.id,
          moduleId: mod.id,
          moduleName: mod.name,
          title,
          subtitle: subtitleParts.join(' · '),
          stage: rec.values.stage || rec.values.status,
          owner: rec.values.owner,
          link: `/modules/${mod.id}/records/${rec.id}`,
        });
      }
    }

    // Also match module names
    for (const mod of mockModules) {
      if (mod.name.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          id: `mod-${mod.id}`,
          moduleId: mod.id,
          moduleName: mod.name,
          title: mod.name,
          subtitle: mod.description,
          link: `/modules/${mod.id}`,
        });
      }
    }

    return results;
  }, [query, filters, textQuery]);

  // Search database (async)
  const searchDB = useCallback(async () => {
    if (!query || query.length < 2) { setDbResults([]); return; }
    setLoading(true);

    try {
      let data: any[] | null = null;
      const res = await api.get('/api/search_records', {
        _tenant_id: 't1',
        _text_query: textQuery || query,
        _limit_val: 50,
        _offset_val: 0,
      });
      data = res.data as any[];

      if (data) {
        const results: SearchResult[] = (data as any[])
          .filter(row => {
            if (filters.length === 0) return true;
            return matchesFilters(row.out_values || {}, filters);
          })
          .map((row: any) => {
            const vals = row.out_values || {};
            const mod = mockModules.find(m => m.id === row.out_module_id);
            const fields = mockFields[row.out_module_id] || [];
            const nameField = fields[0]?.fieldKey;
            const title = nameField ? String(vals[nameField] || 'Untitled') : String(vals.name || vals.full_name || vals.deal_name || 'Untitled');

            return {
              id: row.out_id,
              moduleId: row.out_module_id,
              moduleName: mod?.name || row.out_module_id,
              title,
              subtitle: fields.slice(1, 3).map(f => vals[f.fieldKey]).filter(Boolean).join(' · '),
              stage: vals.stage || vals.status,
              owner: vals.owner,
              link: `/modules/${row.out_module_id}/records/${row.out_id}`,
            };
          });

        setDbResults(results);
      }
    } catch (e) {
      console.error('Search error:', e);
    }
    setLoading(false);
  }, [query, filters, textQuery]);

  // Debounced DB search
  useEffect(() => {
    if (!query || query.length < 2) { setDbResults([]); return; }
    const timer = setTimeout(searchDB, 300);
    return () => clearTimeout(timer);
  }, [query, searchDB]);

  // Merge results (deduplicate by id)
  const allResults = useMemo(() => {
    const seen = new Set<string>();
    const merged: SearchResult[] = [];
    for (const r of [...mockResults, ...dbResults]) {
      if (!seen.has(r.id)) { seen.add(r.id); merged.push(r); }
    }
    return merged;
  }, [mockResults, dbResults]);

  return { results: allResults, loading, filters };
}

export function groupResultsByModule(results: SearchResult[]) {
  const groups = new Map<string, { moduleName: string; results: SearchResult[] }>();
  for (const r of results) {
    if (!groups.has(r.moduleId)) groups.set(r.moduleId, { moduleName: r.moduleName, results: [] });
    groups.get(r.moduleId)!.results.push(r);
  }
  return Array.from(groups.values());
}

// Recent searches hook
export function useRecentSearches() {
  const [searches, setSearches] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('crm_recent_searches');
    if (stored) setSearches(JSON.parse(stored));
  }, []);

  const addSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    setSearches(prev => {
      const next = [query, ...prev.filter(s => s !== query)].slice(0, 10);
      localStorage.setItem('crm_recent_searches', JSON.stringify(next));

      return next;
    });
  }, []);

  const clearSearches = useCallback(() => {
    setSearches([]);
    localStorage.removeItem('crm_recent_searches');
  }, []);

  return { searches, addSearch, clearSearches };
}
