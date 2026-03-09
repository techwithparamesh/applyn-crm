import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TemplateDefinition } from '@/lib/template-definitions';

export interface InstallProgress {
  step: string;
  current: number;
  total: number;
}

export function useTemplateInstaller() {
  const [installedSlugs, setInstalledSlugs] = useState<Set<string>>(new Set());
  const [installing, setInstalling] = useState<string | null>(null);
  const [progress, setProgress] = useState<InstallProgress | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch already-installed templates
  const fetchInstalled = useCallback(async () => {
    const { data } = await supabase
      .from('installed_templates')
      .select('template_slug');
    if (data) {
      setInstalledSlugs(new Set(data.map((d: any) => d.template_slug)));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchInstalled(); }, [fetchInstalled]);

  const installTemplate = useCallback(async (template: TemplateDefinition) => {
    if (installedSlugs.has(template.slug)) return { success: false, error: 'Already installed' };

    setInstalling(template.slug);
    const totalSteps = template.modules.length + template.pipelines.length + (template.sampleRecords.length > 0 ? 1 : 0) + 1;
    let stepNum = 0;

    try {
      // Step 1: Create modules and collect slug→id mapping
      const slugToModuleId: Record<string, string> = {};

      for (const mod of template.modules) {
        stepNum++;
        setProgress({ step: `Creating module: ${mod.name}`, current: stepNum, total: totalSteps });

        // Check if module with same slug already exists
        const { data: existing } = await supabase
          .from('modules')
          .select('id')
          .eq('slug', mod.slug)
          .maybeSingle();

        let moduleId: string;

        if (existing) {
          moduleId = existing.id;
        } else {
          const { data: moduleData, error: moduleErr } = await supabase
            .from('modules')
            .insert({
              name: mod.name,
              slug: mod.slug,
              icon: mod.icon,
              color: mod.color,
              description: mod.description,
              order_index: stepNum - 1,
            })
            .select('id')
            .single();

          if (moduleErr) throw new Error(`Failed to create module ${mod.name}: ${moduleErr.message}`);
          moduleId = moduleData.id;
        }

        slugToModuleId[mod.slug] = moduleId;

        // Create fields for this module
        if (mod.fields.length > 0) {
          // Check existing fields
          const { data: existingFields } = await supabase
            .from('module_fields')
            .select('name')
            .eq('module_id', moduleId);

          const existingNames = new Set((existingFields || []).map((f: any) => f.name));

          const newFields = mod.fields
            .filter(f => !existingNames.has(f.name))
            .map((f, idx) => ({
              module_id: moduleId,
              name: f.name,
              label: f.label,
              field_type: f.field_type,
              is_required: f.is_required,
              options_json: f.options || [],
              order_index: (existingFields?.length || 0) + idx,
            }));

          if (newFields.length > 0) {
            const { error: fieldsErr } = await supabase
              .from('module_fields')
              .insert(newFields);
            if (fieldsErr) throw new Error(`Failed to create fields for ${mod.name}: ${fieldsErr.message}`);
          }
        }
      }

      // Step 2: Create pipelines
      for (const pipeline of template.pipelines) {
        stepNum++;
        setProgress({ step: `Creating pipeline: ${pipeline.name}`, current: stepNum, total: totalSteps });

        const moduleId = slugToModuleId[pipeline.module_slug];
        if (!moduleId) continue;

        // Check if pipeline already exists
        const { data: existingPipeline } = await supabase
          .from('pipelines')
          .select('id')
          .eq('module_id', moduleId)
          .eq('name', pipeline.name)
          .maybeSingle();

        if (!existingPipeline) {
          const { data: pipelineData, error: pipelineErr } = await supabase
            .from('pipelines')
            .insert({
              name: pipeline.name,
              module_id: moduleId,
            })
            .select('id')
            .single();

          if (pipelineErr) throw new Error(`Failed to create pipeline ${pipeline.name}: ${pipelineErr.message}`);

          // Create stages
          const stages = pipeline.stages.map((s, idx) => ({
            pipeline_id: pipelineData.id,
            name: s.name,
            color: s.color,
            position: idx,
          }));

          const { error: stagesErr } = await supabase
            .from('pipeline_stages')
            .insert(stages);
          if (stagesErr) throw new Error(`Failed to create pipeline stages: ${stagesErr.message}`);
        }
      }

      // Step 3: Insert sample records
      if (template.sampleRecords.length > 0) {
        stepNum++;
        setProgress({ step: 'Inserting sample records', current: stepNum, total: totalSteps });

        const records = template.sampleRecords
          .filter(r => slugToModuleId[r.module_slug])
          .map(r => ({
            module_id: slugToModuleId[r.module_slug],
            values: r.values,
          }));

        if (records.length > 0) {
          const { error: recordsErr } = await supabase
            .from('crm_records')
            .insert(records);
          if (recordsErr) throw new Error(`Failed to insert sample records: ${recordsErr.message}`);
        }
      }

      // Step 4: Mark as installed
      stepNum++;
      setProgress({ step: 'Finalizing installation', current: stepNum, total: totalSteps });

      const { error: installErr } = await supabase
        .from('installed_templates')
        .insert({
          template_slug: template.slug,
          template_name: template.name,
        });

      if (installErr) throw new Error(`Failed to mark template as installed: ${installErr.message}`);

      setInstalledSlugs(prev => new Set(prev).add(template.slug));
      setInstalling(null);
      setProgress(null);
      return { success: true, modulesCreated: Object.keys(slugToModuleId).length };

    } catch (err: any) {
      setInstalling(null);
      setProgress(null);
      return { success: false, error: err.message };
    }
  }, [installedSlugs]);

  return { installedSlugs, installing, progress, loading, installTemplate, fetchInstalled };
}
