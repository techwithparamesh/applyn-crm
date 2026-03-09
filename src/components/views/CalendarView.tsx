import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/lib/types";
import { MockRecord } from "@/lib/mock-data";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isToday } from "date-fns";

interface CalendarViewProps {
  records: MockRecord[];
  fields: Field[];
  onView: (recordId: string) => void;
}

export function CalendarView({ records, fields, onView }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Find date fields
  const dateField = fields.find((f) => f.fieldType === 'date') || null;
  const nameField = fields[0];

  // Use createdAt as fallback date
  const getRecordDate = (rec: MockRecord): Date => {
    if (dateField && rec.values?.[dateField.fieldKey]) {
      return new Date(rec.values[dateField.fieldKey]);
    }
    return new Date(rec.createdAt);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart); // 0=Sun

  const recordsByDay = useMemo(() => {
    const map = new Map<string, MockRecord[]>();
    records.forEach((rec) => {
      const d = getRecordDate(rec);
      const key = format(d, 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(rec);
    });
    return map;
  }, [records, dateField]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-semibold text-foreground">{format(currentMonth, 'MMMM yyyy')}</h3>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Date field indicator */}
      <div className="px-4 py-1.5 bg-muted/20 border-b border-border">
        <span className="text-[11px] text-muted-foreground">
          Showing by: {dateField ? dateField.label : 'Created Date'}
        </span>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {/* Padding for first week */}
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="min-h-[90px] border-b border-r border-border bg-muted/10" />
        ))}

        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayRecords = recordsByDay.get(key) || [];
          const today = isToday(day);

          return (
            <div
              key={key}
              className={`min-h-[90px] border-b border-r border-border p-1.5 ${today ? 'bg-primary/5' : 'hover:bg-muted/20'} transition-colors`}
            >
              <div className={`text-xs font-medium mb-1 ${today ? 'text-primary' : 'text-muted-foreground'}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayRecords.slice(0, 3).map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => onView(rec.id)}
                    className="w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors truncate block"
                  >
                    {rec.values?.[nameField?.fieldKey] || 'Untitled'}
                  </button>
                ))}
                {dayRecords.length > 3 && (
                  <span className="text-[10px] text-muted-foreground px-1.5">+{dayRecords.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
