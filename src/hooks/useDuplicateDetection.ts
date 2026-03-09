import { useMemo, useCallback } from 'react';
import { MockRecord } from '@/hooks/useRecords';
import { Field } from '@/lib/types';
import { DuplicateMatch } from '@/components/records/DuplicateWarningDialog';

const DUPLICATE_FIELD_KEYS = ['email', 'phone', 'company'];

function normalize(val: any): string {
  if (!val) return '';
  return String(val).toLowerCase().replace(/[\s\-\(\)\.]+/g, '').trim();
}

export function useDuplicateDetection(records: MockRecord[], fields: Field[]) {
  const checkableFields = useMemo(() => {
    return fields.filter((f) => DUPLICATE_FIELD_KEYS.includes(f.fieldKey));
  }, [fields]);

  const findDuplicates = useCallback(
    (newValues: Record<string, any>): DuplicateMatch[] => {
      const matches: Map<string, DuplicateMatch> = new Map();

      for (const field of checkableFields) {
        const newVal = normalize(newValues[field.fieldKey]);
        if (!newVal) continue;

        for (const record of records) {
          const existingVal = normalize(record.values[field.fieldKey]);
          if (!existingVal) continue;

          if (newVal === existingVal) {
            const existing = matches.get(record.id);
            if (existing) {
              existing.matchedFields.push(field.label);
            } else {
              matches.set(record.id, {
                record,
                matchedFields: [field.label],
              });
            }
          }
        }
      }

      // Sort: more matched fields first
      return Array.from(matches.values()).sort(
        (a, b) => b.matchedFields.length - a.matchedFields.length
      );
    },
    [records, checkableFields]
  );

  return { findDuplicates, checkableFields };
}
