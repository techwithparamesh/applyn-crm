import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/UserAvatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  time: string;
  type?: string;
}

export interface ActivityFeedProps {
  title?: string;
  items: ActivityItem[];
  className?: string;
}

export function ActivityFeed({ title = 'Recent Activity', items, className }: ActivityFeedProps) {
  return (
    <Card className={cn('shadow-sm border-border/80', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[260px] pr-3">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <UserAvatar
                  name={item.user}
                  avatarUrl={null}
                  size="sm"
                  className="shrink-0 mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">
                    <span className="font-medium text-foreground">{item.user}</span>
                    <span className="text-muted-foreground"> {item.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
