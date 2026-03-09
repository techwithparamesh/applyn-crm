import { useMemo } from 'react';
import { MockRecord } from '@/hooks/useRecords';
import { LeadScore, getScoreCategory } from '@/lib/lead-score-types';

// Deterministic scoring based on record factors
function computeScore(record: MockRecord): number {
  let score = 0;
  const v = record.values || {};

  // Factor 1: Lead source (0–20)
  const sourceScores: Record<string, number> = { Referral: 20, Event: 18, LinkedIn: 15, Website: 12, 'Cold Call': 5 };
  score += sourceScores[v.source] || 10;

  // Factor 2: Deal value / lead value (0–25)
  const value = Number(v.value || v.amount || 0);
  if (value >= 100000) score += 25;
  else if (value >= 50000) score += 20;
  else if (value >= 25000) score += 15;
  else if (value >= 10000) score += 10;
  else if (value > 0) score += 5;

  // Factor 3: Activity count (0–20) - simplified without mock data
  score += 10; // baseline activity score

  // Factor 4: Recent interaction (0–20)
  const daysSinceUpdate = (Date.now() - new Date(record.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate <= 1) score += 20;
  else if (daysSinceUpdate <= 3) score += 15;
  else if (daysSinceUpdate <= 7) score += 10;
  else if (daysSinceUpdate <= 14) score += 5;

  // Factor 5: Completeness / email present (0–15)
  if (v.email) score += 5;
  if (v.phone) score += 5;
  if (v.company) score += 5;

  return Math.min(100, Math.max(0, score));
}

export function useLeadScores(records: MockRecord[]): Map<string, LeadScore> {
  return useMemo(() => {
    const map = new Map<string, LeadScore>();
    for (const rec of records) {
      const score = computeScore(rec);
      map.set(rec.id, {
        id: `ls-${rec.id}`,
        tenantId: 't1',
        recordId: rec.id,
        score,
        category: getScoreCategory(score),
        updatedAt: new Date().toISOString(),
      });
    }
    return map;
  }, [records]);
}
