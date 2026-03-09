import { Flame, Thermometer, Snowflake } from 'lucide-react';
import { ScoreCategory, getScoreColor } from '@/lib/lead-score-types';

interface LeadScoreBadgeProps {
  score: number;
  category: ScoreCategory;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const CATEGORY_ICONS = { Hot: Flame, Warm: Thermometer, Cold: Snowflake };

export function LeadScoreBadge({ score, category, size = 'sm', showLabel = true }: LeadScoreBadgeProps) {
  const color = getScoreColor(category);
  const Icon = CATEGORY_ICONS[category];

  if (size === 'md') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${color.bg} ring-1 ${color.ring}`}>
        <Icon className={`h-4 w-4 ${color.text}`} />
        <span className={`text-sm font-bold ${color.text}`}>{score}</span>
        {showLabel && <span className={`text-xs font-medium ${color.text}`}>{category}</span>}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md ${color.bg}`} title={`Score: ${score} — ${category}`}>
      <Icon className={`h-3 w-3 ${color.text}`} />
      <span className={`text-[10px] font-bold ${color.text}`}>{score}</span>
    </div>
  );
}
