import { ModuleRelationship, RecordRelation } from './types';

export const mockRelationships: ModuleRelationship[] = [
  { id: 'rel1', tenantId: 't1', sourceModuleId: '3', targetModuleId: '2', relationshipType: 'many_to_many' }, // Deals → Contacts
  { id: 'rel2', tenantId: 't1', sourceModuleId: '3', targetModuleId: '5', relationshipType: 'many_to_many' }, // Deals → Companies
  { id: 'rel3', tenantId: 't1', sourceModuleId: '1', targetModuleId: '2', relationshipType: 'one_to_many' },  // Leads → Contacts
  { id: 'rel4', tenantId: 't1', sourceModuleId: '1', targetModuleId: '3', relationshipType: 'one_to_many' },  // Leads → Deals
];

export const mockRecordRelations: RecordRelation[] = [
  { id: 'rr1', tenantId: 't1', relationshipId: 'rel1', sourceRecordId: 'r20', targetRecordId: 'r10' }, // Acme Deal → Emily Johnson
  { id: 'rr2', tenantId: 't1', relationshipId: 'rel3', sourceRecordId: 'r1', targetRecordId: 'r10' },  // Sarah Chen (Lead) → Emily Johnson (Contact)
  { id: 'rr3', tenantId: 't1', relationshipId: 'rel4', sourceRecordId: 'r1', targetRecordId: 'r20' },  // Sarah Chen (Lead) → Acme Enterprise Deal
];
