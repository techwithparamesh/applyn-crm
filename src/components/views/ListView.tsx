import { motion } from "framer-motion";
import { MoreHorizontal, Eye, Pencil, Trash2, Mail, Phone, Building2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field } from "@/lib/types";
import { MockRecord } from "@/lib/mock-data";
import { LeadScore } from "@/lib/lead-score-types";
import { LeadScoreBadge } from "@/components/LeadScoreBadge";
import { RecordTagsBadges } from "@/components/records/RecordTags";

const statusColors: Record<string, string> = {
  New: 'bg-brand-blue/10 text-brand-blue', Contacted: 'bg-brand-purple/10 text-brand-purple',
  Qualified: 'bg-accent/10 text-accent', Lost: 'bg-destructive/10 text-destructive',
  Proposal: 'bg-brand-purple/10 text-brand-purple', Discovery: 'bg-brand-blue/10 text-brand-blue',
  Negotiation: 'bg-accent/10 text-accent', 'Closed Won': 'bg-accent/10 text-accent', 'Closed Lost': 'bg-destructive/10 text-destructive',
};

interface ListViewProps {
  records: MockRecord[];
  fields: Field[];
  onView: (recordId: string) => void;
  onDelete: (recordId: string, name: string) => void;
  scores?: Map<string, LeadScore>;
}

export function ListView({ records, fields, onView, onDelete, scores }: ListViewProps) {
  const nameField = fields[0];
  const emailField = fields.find((f) => f.fieldType === 'email');
  const phoneField = fields.find((f) => f.fieldType === 'phone');
  const companyField = fields.find((f) => f.fieldKey === 'company');
  const amountField = fields.find((f) => f.fieldType === 'currency');
  const statusField = fields.find((f) => f.fieldType === 'select');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
      {records.map((rec, i) => {
        const name = rec.values?.[nameField?.fieldKey] || 'Untitled';
        const email = emailField ? rec.values?.[emailField.fieldKey] : '';
        const phone = phoneField ? rec.values?.[phoneField.fieldKey] : '';
        const company = companyField ? rec.values?.[companyField.fieldKey] : '';
        const amount = amountField ? rec.values?.[amountField.fieldKey] : null;
        const status = statusField ? rec.values?.[statusField.fieldKey] : '';
        const ls = scores?.get(rec.id);

        return (
          <motion.div key={rec.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            onClick={() => onView(rec.id)} className="rounded-xl border border-border bg-card p-4 hover:shadow-card-hover transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full gradient-brand flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary-foreground">{name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground truncate">{name}</h4>
                  {status && <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${statusColors[status] || ''}`}>{status}</Badge>}
                  {ls && <LeadScoreBadge score={ls.score} category={ls.category} />}
                </div>
                <RecordTagsBadges recordId={rec.id} />
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {company && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {company}</span>}
                  {email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {email}</span>}
                  {phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {phone}</span>}
                </div>
              </div>
              {amount != null && <div className="text-sm font-semibold text-foreground shrink-0">${Number(amount).toLocaleString()}</div>}
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(rec.id)}><Eye className="h-3.5 w-3.5 mr-2" /> View</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete(rec.id, name)}><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </motion.div>
        );
      })}
      {records.length === 0 && <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">No records found</div>}
    </motion.div>
  );
}
