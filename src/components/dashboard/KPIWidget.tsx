import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Users, Handshake, DollarSign, CheckSquare, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  Handshake,
  DollarSign,
  CheckSquare,
  TrendingUp,
};

export interface KPIWidgetProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: string;
  className?: string;
}

export function KPIWidget({ title, value, change, changeType = 'neutral', icon = 'TrendingUp', className }: KPIWidgetProps) {
  const Icon = ICON_MAP[icon] || TrendingUp;
  const trendIcon = changeType === 'positive' ? TrendingUp : changeType === 'negative' ? TrendingDown : Minus;
  const trendColor =
    changeType === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : changeType === 'negative'
        ? 'text-red-600 dark:text-red-400'
        : 'text-muted-foreground';

  return (
    <Card className={cn('shadow-sm hover:shadow-md transition-shadow border-border/80', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{value}</p>
            {change && (
              <p className={cn('text-xs font-medium mt-1.5 flex items-center gap-1', trendColor)}>
                <trendIcon className="h-3.5 w-3.5 shrink-0" />
                {change}
              </p>
            )}
          </div>
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
