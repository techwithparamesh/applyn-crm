import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search, X, ArrowRight, Clock, Trash2, Hash, Loader2,
  Users, Contact, Handshake, CheckSquare, Building2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGlobalSearch, groupResultsByModule, useRecentSearches } from '@/hooks/useGlobalSearch';
import { useNavigate } from 'react-router-dom';
import { SEARCH_FIELD_SUGGESTIONS, FIELD_VALUE_SUGGESTIONS } from '@/lib/search-engine';

const MODULE_ICONS: Record<string, typeof Users> = {
  Leads: Users,
  Contacts: Contact,
  Deals: Handshake,
  Tasks: CheckSquare,
  Companies: Building2,
};

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ open, onClose }: GlobalSearchModalProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const { results, loading, filters } = useGlobalSearch(query);
  const { searches: recentSearches, addSearch, clearSearches } = useRecentSearches();
  const grouped = groupResultsByModule(results);

  // Suggestions
  const suggestions = useMemo(() => {
    if (!query) return [];
    const lastToken = query.split(' ').pop() || '';

    // If typing field:, suggest values
    const colonIdx = lastToken.indexOf(':');
    if (colonIdx > 0 && colonIdx === lastToken.length - 1) {
      const field = lastToken.slice(0, colonIdx);
      const vals = FIELD_VALUE_SUGGESTIONS[field];
      if (vals) return vals.map(v => `${field}:${v}`);
    }

    // Suggest field names
    if (lastToken.length > 0 && !lastToken.includes(':') && !lastToken.includes('>') && !lastToken.includes('<')) {
      return SEARCH_FIELD_SUGGESTIONS
        .filter(f => f.startsWith(lastToken.toLowerCase()))
        .map(f => f + ':')
        .slice(0, 5);
    }

    return [];
  }, [query]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [open]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleSelect = (link: string) => {
    addSearch(query);
    navigate(link);
    onClose();
  };

  const applySuggestion = (s: string) => {
    const parts = query.split(' ');
    parts[parts.length - 1] = s;
    setQuery(parts.join(' '));
    inputRef.current?.focus();
  };

  const handleRecentSelect = (q: string) => {
    setQuery(q);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl bg-popover border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search records... (e.g. company:tesla amount > 10000)"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            onKeyDown={e => {
              if (e.key === 'Enter' && query) addSearch(query);
            }}
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {query && (
            <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Active Filters */}
        {filters.length > 0 && (
          <div className="flex items-center gap-1.5 px-4 py-2 bg-muted/30 border-b border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Filters:</span>
            {filters.map((f, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] gap-1">
                <Hash className="h-2.5 w-2.5" />
                {f.field} {f.operator === 'equals' ? '=' : f.operator === 'greater_than' ? '>' : f.operator === 'less_than' ? '<' : f.operator} {f.value}
              </Badge>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="flex items-center gap-1.5 px-4 py-2 bg-muted/20 border-b border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Suggestions:</span>
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => applySuggestion(s)}
                className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <ScrollArea className="max-h-[50vh]">
          {/* No query — show recent searches */}
          {!query && recentSearches.length > 0 && (
            <div className="py-2">
              <div className="flex items-center justify-between px-4 py-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Recent Searches</span>
                <button onClick={clearSearches} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1">
                  <Trash2 className="h-3 w-3" />Clear
                </button>
              </div>
              {recentSearches.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleRecentSelect(q)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-muted/50 transition-colors"
                >
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground">{q}</span>
                </button>
              ))}
            </div>
          )}

          {/* No query, no recent */}
          {!query && recentSearches.length === 0 && (
            <div className="py-12 text-center">
              <Search className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Type to search across all modules</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Try <code className="bg-muted px-1 rounded">company:tesla</code> or <code className="bg-muted px-1 rounded">amount {'>'} 10000</code>
              </p>
            </div>
          )}

          {/* Query but no results */}
          {query.length >= 2 && results.length === 0 && !loading && (
            <div className="py-12 text-center">
              <Search className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No results for "{query}"</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Try different keywords or filters</p>
            </div>
          )}

          {/* Grouped Results */}
          {query.length >= 2 && grouped.length > 0 && (
            <div className="py-1">
              {grouped.map(group => {
                const ModIcon = MODULE_ICONS[group.moduleName] || Users;
                return (
                  <div key={group.moduleName}>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-muted/30">
                      <ModIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{group.moduleName}</span>
                      <Badge variant="secondary" className="text-[9px] ml-auto">{group.results.length}</Badge>
                    </div>
                    {group.results.map(r => (
                      <button
                        key={r.id}
                        onClick={() => handleSelect(r.link)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">{r.title.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-popover-foreground truncate">{r.title}</p>
                          {r.subtitle && <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {r.stage && (
                            <Badge variant="outline" className="text-[9px]">{r.stage}</Badge>
                          )}
                          {r.owner && (
                            <span className="text-[10px] text-muted-foreground">{r.owner}</span>
                          )}
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </div>
                );
              })}
              <div className="px-4 py-2 border-t border-border/50 text-[11px] text-muted-foreground">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
