import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface TaskRow {
  id: string;
  subject: string;
  dueDate: string;
  status: string;
  priority: string;
}

export interface TasksWidgetProps {
  title?: string;
  tasks: TaskRow[];
  className?: string;
}

const statusVariant = (status: string) => {
  if (status.toLowerCase().includes('progress')) return 'default';
  if (status.toLowerCase() === 'done') return 'secondary';
  return 'outline';
};

const priorityColor = (priority: string) => {
  if (priority === 'High') return 'text-red-600 dark:text-red-400';
  if (priority === 'Medium') return 'text-amber-600 dark:text-amber-400';
  return 'text-muted-foreground';
};

export function TasksWidget({ title = 'My Tasks', tasks, className }: TasksWidgetProps) {
  return (
    <Card className={cn('shadow-sm border-border/80', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[260px]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/80">
                <TableHead className="text-xs font-medium text-muted-foreground">Subject</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground w-24">Due</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground w-24">Status</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground w-20">Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id} className="border-b border-border/50">
                  <TableCell className="text-sm font-medium py-2.5">{task.subject}</TableCell>
                  <TableCell className="text-sm text-muted-foreground py-2.5">{task.dueDate}</TableCell>
                  <TableCell className="py-2.5">
                    <Badge variant={statusVariant(task.status)} className="text-[10px] font-medium">
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn('text-xs font-medium py-2.5', priorityColor(task.priority))}>
                    {task.priority}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
