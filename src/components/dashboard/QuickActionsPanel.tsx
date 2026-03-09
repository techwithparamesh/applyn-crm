import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Handshake, CheckSquare, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const ACTIONS = [
  { label: 'Create Lead', icon: UserPlus, url: '/modules', module: 'leads' },
  { label: 'Create Deal', icon: Handshake, url: '/modules', module: 'deals' },
  { label: 'Create Task', icon: CheckSquare, url: '/tasks' },
  { label: 'Send Email', icon: Mail, url: '/email' },
];

export interface QuickActionsPanelProps {
  title?: string;
  className?: string;
}

export function QuickActionsPanel({ title = 'Quick Actions', className }: QuickActionsPanelProps) {
  const navigate = useNavigate();

  return (
    <Card className={cn('shadow-sm border-border/80', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2">
          {ACTIONS.map((item) => (
            <Button
              key={item.label}
              variant="outline"
              size="sm"
              className="h-auto py-3 justify-start gap-2.5 font-medium text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary"
              onClick={() => navigate(item.url)}
            >
              <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              {item.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
