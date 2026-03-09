import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
}

export function MetricCard({ title, value, change, changeType = 'neutral', icon: Icon, iconColor }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-card-foreground mt-1">{value}</p>
          {change && (
            <p className={`text-xs mt-1 font-medium ${
              changeType === 'positive' ? 'text-accent' : changeType === 'negative' ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${iconColor || 'bg-primary/10'}`}>
          <Icon className={`h-5 w-5 ${iconColor ? 'text-primary-foreground' : 'text-primary'}`} />
        </div>
      </div>
    </motion.div>
  );
}
