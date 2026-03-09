export type ScoreCategory = 'Cold' | 'Warm' | 'Hot';

export interface LeadScore {
  id: string;
  tenantId: string;
  recordId: string;
  score: number;
  category: ScoreCategory;
  updatedAt: string;
}

export function getScoreCategory(score: number): ScoreCategory {
  if (score >= 70) return 'Hot';
  if (score >= 35) return 'Warm';
  return 'Cold';
}

export function getScoreColor(category: ScoreCategory) {
  switch (category) {
    case 'Hot': return { bg: 'bg-red-500/10', text: 'text-red-600', ring: 'ring-red-500/30', fill: 'hsl(0, 84%, 60%)' };
    case 'Warm': return { bg: 'bg-amber-500/10', text: 'text-amber-600', ring: 'ring-amber-500/30', fill: 'hsl(39, 92%, 49%)' };
    case 'Cold': return { bg: 'bg-blue-500/10', text: 'text-blue-600', ring: 'ring-blue-500/30', fill: 'hsl(217, 91%, 60%)' };
  }
}
