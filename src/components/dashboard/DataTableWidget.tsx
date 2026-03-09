import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface DataTableWidgetProps {
  title: string;
  columns: { key: string; label: string }[];
  rows: Record<string, string | number>[];
  className?: string;
}

export function DataTableWidget({ title, columns, rows, className }: DataTableWidgetProps) {
  return (
    <Card className={cn('shadow-sm border-border/80', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[240px]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/80">
                {columns.map((col) => (
                  <TableHead key={col.key} className="text-xs font-medium text-muted-foreground">
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={idx} className="border-b border-border/50">
                  {columns.map((col) => (
                    <TableCell key={col.key} className="text-sm py-2.5">
                      {row[col.key] ?? '—'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
