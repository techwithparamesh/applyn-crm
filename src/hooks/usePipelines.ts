import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

export interface PipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  color: string;
  position: number;
}

export interface Pipeline {
  id: string;
  tenantId: string;
  moduleId: string;
  name: string;
  stages: PipelineStage[];
}

function mapStage(row: any): PipelineStage {
  return {
    id: row.id,
    pipelineId: row.pipeline_id,
    name: row.name,
    color: row.color,
    position: row.position,
  };
}

export function usePipelines(moduleId?: string) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const fetchPipelines = useCallback(async () => {
    setLoading(true);
    const params = moduleId ? { module_id: moduleId } : {};
    const { data: pipelineRows } = await api.get('/api/pipelines', params);
    const rows = (pipelineRows || []) as any[];
    if (rows.length === 0) {
      setPipelines([]);
      setLoading(false);
      return;
    }
    const result: Pipeline[] = [];
    for (const p of rows) {
      const { data: stageRows } = await api.get('/api/pipeline_stages', { pipeline_id: p.id });
      const stages = ((stageRows || []) as any[]).map(mapStage);
      result.push({ id: p.id, tenantId: p.tenant_id, moduleId: p.module_id, name: p.name, stages });
    }
    setPipelines(result);
    setLoading(false);
  }, [moduleId]);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  const createPipeline = useCallback(async (name: string, modId: string, stages: { name: string; color: string }[]) => {
    const { data: row, error } = await api.post('/api/pipelines', { name, module_id: modId });
    if (error || !row) return;
    const stageInserts = stages.map((s, i) => ({ pipeline_id: (row as any).id, name: s.name, color: s.color, position: i }));
    await api.post('/api/pipeline_stages', stageInserts);
    await fetchPipelines();
  }, [fetchPipelines]);

  const updatePipeline = useCallback(async (pipelineId: string, name: string, stages: { name: string; color: string }[]) => {
    await api.patch(`/api/pipelines/${pipelineId}`, { name });
    await api.delete('/api/pipeline_stages', { pipeline_id: pipelineId });
    const stageInserts = stages.map((s, i) => ({ pipeline_id: pipelineId, name: s.name, color: s.color, position: i }));
    await api.post('/api/pipeline_stages', stageInserts);
    await fetchPipelines();
  }, [fetchPipelines]);

  const deletePipeline = useCallback(async (pipelineId: string) => {
    await api.delete(`/api/pipelines/${pipelineId}`);
    setPipelines((prev) => prev.filter((p) => p.id !== pipelineId));
  }, []);

  return { pipelines, loading, createPipeline, updatePipeline, deletePipeline, refetch: fetchPipelines };
}
