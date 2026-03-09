import { format } from "date-fns";
import { History, Plus, Edit3, Trash2 } from "lucide-react";
import { AuditLog } from "@/lib/audit-types";

const actionConfig = {
  create: { icon: Plus, color: 'text-accent', bg: 'bg-accent/10', label: 'Created' },
  update: { icon: Edit3, color: 'text-brand-blue', bg: 'bg-brand-blue/10', label: 'Updated' },
  delete: { icon: Trash2, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Deleted' },
};

interface AuditLogTimelineProps {
  logs: AuditLog[];
}

export function AuditLogTimeline({ logs }: AuditLogTimelineProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center py-6 text-muted-foreground">
        <History className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">No change history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {logs.map((log, i) => {
        const config = actionConfig[log.action];
        const Icon = config.icon;

        return (
          <div key={log.id} className="flex gap-3 py-2.5">
            <div className="flex flex-col items-center">
              <div className={`h-6 w-6 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-3 w-3 ${config.color}`} />
              </div>
              {i < logs.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              {log.action === 'update' && log.fieldLabel ? (
                <p className="text-sm text-foreground">
                  <span className="font-medium">{log.fieldLabel}</span> changed
                  {log.oldValue && (
                    <> from <span className="line-through text-muted-foreground">{log.oldValue}</span></>
                  )}
                  {log.newValue && (
                    <> to <span className="font-medium">{log.newValue}</span></>
                  )}
                </p>
              ) : (
                <p className="text-sm text-foreground">
                  {config.label} {log.entityType}
                  {log.newValue && <span className="font-medium"> — {log.newValue}</span>}
                </p>
              )}
              <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                <span>{log.changedBy}</span>
                <span>·</span>
                <span>{format(new Date(log.createdAt), 'MMM d, h:mm a')}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
