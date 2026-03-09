import { useState, useCallback, useMemo } from 'react';
import { ModuleRelationship, RecordRelation } from '@/lib/types';
import { mockRelationships, mockRecordRelations } from '@/lib/mock-relationships';
import { mockModules, mockRecords } from '@/lib/mock-data';

export function useRelationships() {
  const [relationships, setRelationships] = useState<ModuleRelationship[]>(mockRelationships);
  const [recordRelations, setRecordRelations] = useState<RecordRelation[]>(mockRecordRelations);

  const createRelationship = useCallback((sourceModuleId: string, targetModuleId: string, relationshipType: ModuleRelationship['relationshipType']) => {
    const existing = relationships.find(
      (r) => (r.sourceModuleId === sourceModuleId && r.targetModuleId === targetModuleId) ||
             (r.sourceModuleId === targetModuleId && r.targetModuleId === sourceModuleId)
    );
    if (existing) return null;

    const newRel: ModuleRelationship = {
      id: `rel-${Date.now()}`,
      tenantId: 't1',
      sourceModuleId,
      targetModuleId,
      relationshipType,
    };
    setRelationships((prev) => [...prev, newRel]);
    return newRel;
  }, [relationships]);

  const deleteRelationship = useCallback((relationshipId: string) => {
    setRelationships((prev) => prev.filter((r) => r.id !== relationshipId));
    setRecordRelations((prev) => prev.filter((r) => r.relationshipId !== relationshipId));
  }, []);

  const getModuleRelationships = useCallback((moduleId: string) => {
    return relationships.filter(
      (r) => r.sourceModuleId === moduleId || r.targetModuleId === moduleId
    );
  }, [relationships]);

  const linkRecords = useCallback((relationshipId: string, sourceRecordId: string, targetRecordId: string) => {
    const existing = recordRelations.find(
      (r) => r.relationshipId === relationshipId &&
        ((r.sourceRecordId === sourceRecordId && r.targetRecordId === targetRecordId) ||
         (r.sourceRecordId === targetRecordId && r.targetRecordId === sourceRecordId))
    );
    if (existing) return null;

    const newLink: RecordRelation = {
      id: `rr-${Date.now()}`,
      tenantId: 't1',
      relationshipId,
      sourceRecordId,
      targetRecordId,
    };
    setRecordRelations((prev) => [...prev, newLink]);
    return newLink;
  }, [recordRelations]);

  const unlinkRecords = useCallback((relationId: string) => {
    setRecordRelations((prev) => prev.filter((r) => r.id !== relationId));
  }, []);

  const getRelatedRecords = useCallback((recordId: string, moduleId: string) => {
    const moduleRels = getModuleRelationships(moduleId);
    const results: Array<{
      relationship: ModuleRelationship;
      relatedModuleId: string;
      relatedModuleName: string;
      records: Array<{ recordRelationId: string; recordId: string; recordName: string; moduleId: string }>;
    }> = [];

    moduleRels.forEach((rel) => {
      const isSource = rel.sourceModuleId === moduleId;
      const relatedModuleId = isSource ? rel.targetModuleId : rel.sourceModuleId;
      const relatedModule = mockModules.find((m) => m.id === relatedModuleId);
      if (!relatedModule) return;

      const linkedRecordRelations = recordRelations.filter((rr) => {
        if (rr.relationshipId !== rel.id) return false;
        return isSource
          ? rr.sourceRecordId === recordId
          : rr.targetRecordId === recordId;
      });

      const linkedRecords = linkedRecordRelations.map((rr) => {
        const linkedRecordId = isSource ? rr.targetRecordId : rr.sourceRecordId;
        const relModRecords = mockRecords[relatedModuleId] || [];
        const rec = relModRecords.find((r) => r.id === linkedRecordId);
        const nameVal = rec ? Object.values(rec.values)[0] : 'Unknown';
        return {
          recordRelationId: rr.id,
          recordId: linkedRecordId,
          recordName: String(nameVal),
          moduleId: relatedModuleId,
        };
      });

      results.push({
        relationship: rel,
        relatedModuleId,
        relatedModuleName: relatedModule.name,
        records: linkedRecords,
      });
    });

    return results;
  }, [getModuleRelationships, recordRelations]);

  return {
    relationships,
    recordRelations,
    createRelationship,
    deleteRelationship,
    getModuleRelationships,
    linkRecords,
    unlinkRecords,
    getRelatedRecords,
  };
}
