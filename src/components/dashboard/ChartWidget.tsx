import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

const DEFAULT_COLORS = ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#14b8a6', '#ec4899'];

export interface ChartWidgetProps {
  title: string;
  type: 'revenue_trend' | 'pipeline_distribution';
  data?: { month?: string; revenue?: number; name?: string; value?: number; color?: string }[];
  className?: string;
}

export function ChartWidget({
  title,
  type,
  data = [],
  className,
}: ChartWidgetProps) {
  if (type === 'revenue_trend') {
    const chartData = data.length ? data : [{ month: 'Jan', revenue: 0 }];
    return (
      <Card className={cn('shadow-sm border-border/80', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                formatter={(value: number) => [`$${value}K`, 'Revenue']}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  const pieData = data.length ? data : [{ name: 'No data', value: 1, color: '#e5e7eb' }];
  return (
    <Card className={cn('shadow-sm border-border/80', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {pieData.map((entry, index) => (
                <Cell key={entry.name} fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
              formatter={(value: number, name: string) => [value, name]}
            />
            <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
