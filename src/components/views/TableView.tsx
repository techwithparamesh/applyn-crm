import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Pencil, Trash2, Columns } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Field } from "@/lib/types";
import { MockRecord } from "@/lib/mock-data";
import { LeadScore } from "@/lib/lead-score-types";
import { LeadScoreBadge } from "@/components/LeadScoreBadge";
import { RecordTagsBadges } from "@/components/records/RecordTags";

const statusColors: Record<string, string> = {
  New: 'bg-brand-blue/10 text-brand-blue',
  Contacted: 'bg-brand-purple/10 text-brand-purple',
  Qualified: 'bg-accent/10 text-accent',
  Lost: 'bg-destructive/10 text-destructive',
  Proposal: 'bg-brand-purple/10 text-brand-purple',
  Discovery: 'bg-brand-blue/10 text-brand-blue',
  Negotiation: 'bg-accent/10 text-accent',
  'Closed Won': 'bg-accent/10 text-accent',
  'Closed Lost': 'bg-destructive/10 text-destructive',
};

interface TableViewProps {
  records: MockRecord[];
  fields: Field[];
  sortField: string;
  sortDir: 'asc' | 'desc';
  onSort: (field: string) => void;
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onView: (recordId: string) => void;
  onDelete: (recordId: string, name: string) => void;
  visibleColumns?: string[];
  onVisibleColumnsChange?: (columns: string[]) => void;
  scores?: Map<string, LeadScore>;
}

export function TableView({
  records, fields, sortField, sortDir, onSort,
  page, totalPages, totalCount, onPageChange,
  onView, onDelete, visibleColumns, onVisibleColumnsChange, scores,
}: TableViewProps) {
  const allFieldKeys = fields.map((f) => f.fieldKey);
  const visible = visibleColumns && visibleColumns.length > 0 ? visibleColumns : allFieldKeys.slice(0, 5);
  const displayFields = fields.filter((f) => visible.includes(f.fieldKey));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      {onVisibleColumnsChange && (
        <div className="flex justify-end px-3 py-2 border-b border-border bg-muted/20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs"><Columns className="h-3 w-3 mr-1.5" /> Columns</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {fields.map((f) => (
                <DropdownMenuCheckboxItem key={f.id} checked={visible.includes(f.fieldKey)} onCheckedChange={(checked) => {
                  const next = checked ? [...visible, f.fieldKey] : visible.filter((k) => k !== f.fieldKey);
                  onVisibleColumnsChange(next);
                }}>{f.label}</DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {displayFields.map((f) => (
                <th key={f.id} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none" onClick={() => onSort(f.fieldKey)}>
                  <span className="flex items-center gap-1">
                    {f.label}
                    {sortField === f.fieldKey && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </span>
                </th>
              ))}
              {scores && <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score</th>}
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => {
              const ls = scores?.get(rec.id);
              return (
                <tr key={rec.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => onView(rec.id)}>
                  {displayFields.map((f) => {
                    const val = rec.values?.[f.fieldKey];
                    return (
                      <td key={f.id} className="px-4 py-3 text-sm text-card-foreground">
                        {f.fieldType === 'select' ? (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[val] || 'bg-muted text-muted-foreground'}`}>{val}</span>
                        ) : f.fieldType === 'currency' ? (
                          <span className="font-medium">${Number(val).toLocaleString()}</span>
                        ) : f.fieldType === 'email' ? (
                          <span className="text-muted-foreground">{val}</span>
                        ) : (
                          <span className={f.orderIndex === 0 ? 'font-medium' : ''}>{val || '—'}</span>
                        )}
                      </td>
                    );
                  })}
                  {scores && (
                    <td className="px-4 py-3">{ls && <LeadScoreBadge score={ls.score} category={ls.category} />}</td>
                  )}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <RecordTagsBadges recordId={rec.id} />
                  </td>
                  <td className="px-2" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(rec.id)}><Eye className="h-3.5 w-3.5 mr-2" /> View</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onView(rec.id)}><Pencil className="h-3.5 w-3.5 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => { const nf = fields[0]; onDelete(rec.id, rec.values?.[nf?.fieldKey] || 'Untitled'); }}><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
            {records.length === 0 && (<tr><td colSpan={displayFields.length + (scores ? 3 : 2)} className="px-4 py-12 text-center text-muted-foreground">No records found</td></tr>)}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
          <span className="text-xs text-muted-foreground">Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, totalCount)} of {totalCount}</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => onPageChange(page - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (<Button key={i} variant={page === i + 1 ? 'default' : 'ghost'} size="icon" className="h-7 w-7 text-xs" onClick={() => onPageChange(i + 1)}>{i + 1}</Button>))}
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
