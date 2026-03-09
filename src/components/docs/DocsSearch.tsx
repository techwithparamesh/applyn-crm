import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DOCS_NAV, type DocNavItem } from "@/docs/structure";
import { cn } from "@/lib/utils";

interface DocsSearchProps {
  onSelect?: (id: string) => void;
  className?: string;
}

function flattenWithTitles(items: DocNavItem[], prefix = ""): { id: string; title: string; breadcrumb: string }[] {
  const out: { id: string; title: string; breadcrumb: string }[] = [];
  for (const item of items) {
    const breadcrumb = prefix ? `${prefix} › ${item.title}` : item.title;
    out.push({ id: item.id, title: item.title, breadcrumb });
    if (item.children?.length) {
      for (const c of item.children) {
        out.push(...flattenWithTitles([c], breadcrumb));
      }
    }
  }
  return out;
}

const FLAT_DOCS = flattenWithTitles(DOCS_NAV);

export function DocsSearch({ onSelect, className }: DocsSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const normalized = query.trim().toLowerCase();
  const results = normalized.length >= 2
    ? FLAT_DOCS.filter(
        (d) =>
          d.title.toLowerCase().includes(normalized) ||
          d.breadcrumb.toLowerCase().includes(normalized) ||
          d.id.toLowerCase().includes(normalized)
      ).slice(0, 12)
    : [];

  const handleSelect = useCallback(
    (id: string) => {
      navigate(`/docs?section=${encodeURIComponent(id)}`);
      onSelect?.(id);
      setQuery("");
      setFocused(false);
    },
    [navigate, onSelect]
  );

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        placeholder="Search docs..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        className="pl-8 h-9 bg-muted/50 border-border"
      />
      {focused && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-popover shadow-lg py-1 z-50 max-h-64 overflow-auto">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(r.id);
              }}
            >
              <span className="font-medium">{r.title}</span>
              {r.breadcrumb !== r.title && (
                <span className="text-muted-foreground ml-1 text-xs">{r.breadcrumb}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
