import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { TemplateDefinition } from '@/lib/template-definitions';

export interface InstallProgress {
  step: string;
  current: number;
  total: number;
}

export function useTemplateInstaller() {
  const [installedSlugs, setInstalledSlugs] = useState<Set<string>>(new Set());
  const [installedTemplateIds, setInstalledTemplateIds] = useState<Set<string>>(new Set());
  const [installing, setInstalling] = useState<string | null>(null);
  const [progress, setProgress] = useState<InstallProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInstalled = useCallback(async () => {
    const { data } = await api.get('/api/installed_templates');
    const raw = data as { slugs?: string[]; ids?: string[] } | string[] | undefined;
    const slugs = Array.isArray(raw) ? raw : (raw?.slugs ?? []);
    const ids = Array.isArray(raw) ? [] : (raw?.ids ?? []);
    setInstalledSlugs(new Set(slugs));
    setInstalledTemplateIds(new Set(ids));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInstalled();
  }, [fetchInstalled]);

  const installTemplate = useCallback(
    async (template: TemplateDefinition) => {
      if (installedSlugs.has(template.slug)) return { success: false, error: 'Already installed' };

      setInstalling(template.slug);
      const totalSteps =
        template.modules.length +
        template.pipelines.length +
        (template.sampleRecords.length > 0 ? 1 : 0) +
        1;
      let stepNum = 0;
      const slugToModuleId: Record<string, string> = {};

      try {
        const { data: modulesList } = await api.get('/api/modules');
        const allModules = (modulesList || []) as any[];

        for (const mod of template.modules) {
          stepNum++;
          setProgress({ step: `Creating module: ${mod.name}`, current: stepNum, total: totalSteps });
          const existing = allModules.find((m: any) => m.slug === mod.slug);
          let moduleId: string;

          if (existing) {
            moduleId = existing.id;
          } else {
            const { data: moduleData, error: moduleErr } = await api.post('/api/modules', {
              name: mod.name,
              slug: mod.slug,
              icon: mod.icon,
              color: mod.color,
              description: mod.description,
              order_index: stepNum - 1,
            });
            if (moduleErr || !moduleData) throw new Error(`Failed to create module ${mod.name}`);
            moduleId = (moduleData as any).id;
          }
          slugToModuleId[mod.slug] = moduleId;

          if (mod.fields.length > 0) {
            const { data: existingFields } = await api.get('/api/module_fields', { module_id: moduleId });
            const existingNames = new Set(((existingFields || []) as any[]).map((f: any) => f.name));
            for (let idx = 0; idx < mod.fields.length; idx++) {
              const f = mod.fields[idx];
              if (existingNames.has(f.name)) continue;
              const { error: fieldErr } = await api.post('/api/module_fields', {
                module_id: moduleId,
                name: f.name,
                label: f.label,
                field_type: f.field_type,
                is_required: f.is_required,
                options_json: f.options || [],
                order_index: ((existingFields || []) as any[]).length + idx,
              });
              if (fieldErr) throw new Error(`Failed to create field ${f.name}`);
            }
          }
        }

        for (const pipeline of template.pipelines) {
          stepNum++;
          setProgress({ step: `Creating pipeline: ${pipeline.name}`, current: stepNum, total: totalSteps });
          const moduleId = slugToModuleId[pipeline.module_slug];
          if (!moduleId) continue;

          const { data: pipelineList } = await api.get('/api/pipelines', { module_id: moduleId });
          const existingPipeline = ((pipelineList || []) as any[]).find((p: any) => p.name === pipeline.name);
          if (!existingPipeline) {
            const { data: pipelineData, error: pipelineErr } = await api.post('/api/pipelines', {
              name: pipeline.name,
              module_id: moduleId,
            });
            if (pipelineErr || !pipelineData) throw new Error(`Failed to create pipeline ${pipeline.name}`);
            const stages = pipeline.stages.map((s, idx) => ({
              pipeline_id: (pipelineData as any).id,
              name: s.name,
              color: s.color,
              position: idx,
            }));
            for (const s of stages) {
              await api.post('/api/pipeline_stages', s);
            }
          }
        }

        if (template.sampleRecords.length > 0) {
          stepNum++;
          setProgress({ step: 'Inserting sample records', current: stepNum, total: totalSteps });
          const records = template.sampleRecords
            .filter((r) => slugToModuleId[r.module_slug])
            .map((r) => ({ module_id: slugToModuleId[r.module_slug], values: r.values }));
          if (records.length > 0) {
            const { error: recordsErr } = await api.post('/api/crm_records/bulk', records);
            if (recordsErr) throw new Error('Failed to insert sample records');
          }
        }

        stepNum++;
        setProgress({ step: 'Finalizing installation', current: stepNum, total: totalSteps });
        await api.post('/api/installed_templates', {
          template_slug: template.slug,
          template_name: template.name,
        });

        setInstalledSlugs((prev) => new Set(prev).add(template.slug));
        setInstalling(null);
        setProgress(null);
        return { success: true, modulesCreated: Object.keys(slugToModuleId).length };
      } catch (err: any) {
        setInstalling(null);
        setProgress(null);
        return { success: false, error: err?.message || 'Install failed' };
      }
    },
    [installedSlugs]
  );

  const installTemplateById = useCallback(async (templateId: string) => {
    if (installedTemplateIds.has(templateId)) return { success: false, error: 'Already installed' };
    setInstalling(templateId);
    setProgress({ step: 'Installing template...', current: 1, total: 1 });
    try {
      const { data, error } = await api.post('/api/templates/install', { template_id: templateId });
      if (error || !data) throw new Error((data as any)?.error || error?.message || 'Install failed');
      const result = data as { success?: boolean; modulesCreated?: number };
      setInstalledTemplateIds((prev) => new Set(prev).add(templateId));
      setInstalledSlugs((prev) => new Set(prev).add(templateId));
      setInstalling(null);
      setProgress(null);
      return { success: true, modulesCreated: result.modulesCreated ?? 0 };
    } catch (err: any) {
      setInstalling(null);
      setProgress(null);
      return { success: false, error: err?.message || 'Install failed' };
    }
  }, [installedTemplateIds]);

  return { installedSlugs, installedTemplateIds, installing, progress, loading, installTemplate, installTemplateById, fetchInstalled };
}
