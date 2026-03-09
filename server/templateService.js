/**
 * CRM Template Engine: installTemplate(template_id, tenant_id), createFromWorkspace(tenant_id, payload)
 */

import { getPool, uuid } from './db.js';

/**
 * Install a template for a tenant: create modules, fields, pipelines, stages, default dashboard.
 * @param {string} templateId - crm_templates.id
 * @param {string} tenantId - tenant_id
 */
export async function installTemplate(templateId, tenantId) {
  const pool = getPool();

  const [tplRows] = await pool.execute('SELECT * FROM crm_templates WHERE id = ?', [templateId]);
  if (!tplRows.length) throw new Error('Template not found');
  const template = tplRows[0];

  const [modRows] = await pool.execute(
    'SELECT * FROM template_modules WHERE template_id = ? ORDER BY order_index',
    [templateId]
  );
  const slugToModuleId = {};

  for (const mod of modRows) {
    const moduleId = uuid();
    await pool.execute(
      'INSERT INTO modules (id, tenant_id, name, slug, icon, color, description, is_system, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)',
      [moduleId, tenantId, mod.name, mod.slug, mod.icon || 'Boxes', mod.color || '#7C3AED', mod.description || '', mod.order_index ?? 0]
    );
    slugToModuleId[mod.id] = { moduleId, slug: mod.slug };

    const [fieldRows] = await pool.execute(
      'SELECT * FROM template_fields WHERE template_module_id = ? ORDER BY order_index',
      [mod.id]
    );
    for (let i = 0; i < fieldRows.length; i++) {
      const f = fieldRows[i];
      const fieldId = uuid();
      await pool.execute(
        'INSERT INTO module_fields (id, module_id, tenant_id, name, label, field_type, is_required, options_json, settings_json, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          fieldId,
          moduleId,
          tenantId,
          f.name,
          f.label,
          f.type || 'text',
          f.required ? 1 : 0,
          null,
          f.settings_json ? JSON.stringify(f.settings_json) : null,
          f.order_index ?? i,
        ]
      );
    }

    const [pipeRows] = await pool.execute(
      'SELECT * FROM template_pipelines WHERE template_module_id = ?',
      [mod.id]
    );
    for (const pipe of pipeRows) {
      const pipelineId = uuid();
      await pool.execute(
        'INSERT INTO pipelines (id, tenant_id, module_id, name) VALUES (?, ?, ?, ?)',
        [pipelineId, tenantId, moduleId, pipe.name]
      );
      const [stageRows] = await pool.execute(
        'SELECT * FROM template_pipeline_stages WHERE pipeline_id = ? ORDER BY order_index',
        [pipe.id]
      );
      for (let i = 0; i < stageRows.length; i++) {
        const s = stageRows[i];
        await pool.execute(
          'INSERT INTO pipeline_stages (id, pipeline_id, name, color, position) VALUES (?, ?, ?, ?, ?)',
          [uuid(), pipelineId, s.name, s.color || '#6B7280', s.order_index ?? i]
        );
      }
    }
  }

  const [dashRows] = await pool.execute('SELECT id FROM dashboards WHERE tenant_id = ?', [tenantId]);
  if (!dashRows.length) {
    const dashboardId = uuid();
    await pool.execute('INSERT INTO dashboards (id, tenant_id, name) VALUES (?, ?, ?)', [dashboardId, tenantId, 'Default Dashboard']);
  }

  const slugForInstalled = templateId;
  await pool.execute(
    'INSERT INTO installed_templates (id, tenant_id, template_slug, template_name, template_id) VALUES (?, ?, ?, ?, ?)',
    [uuid(), tenantId, slugForInstalled, template.name, templateId]
  );

  return { success: true, modulesCreated: modRows.length };
}

/**
 * Save current workspace as a template.
 * @param {string} tenantId - workspace (tenant) id
 * @param {{ template_name: string, category_id?: string, description?: string }} payload
 */
export async function createFromWorkspace(tenantId, payload) {
  const pool = getPool();
  const { template_name, category_id, description } = payload;
  if (!template_name || !template_name.trim()) throw new Error('template_name required');

  const templateId = uuid();
  const [modRows] = await pool.execute('SELECT * FROM modules WHERE tenant_id = ? ORDER BY order_index', [tenantId]);
  await pool.execute(
    'INSERT INTO crm_templates (id, name, category_id, description, icon, modules_count, is_public, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, NOW())',
    [templateId, template_name.trim(), category_id || null, description || null, 'Boxes', modRows.length, null]
  );

  const templateModuleIds = {};
  for (let i = 0; i < modRows.length; i++) {
    const m = modRows[i];
    const tmId = uuid();
    templateModuleIds[m.id] = tmId;
    await pool.execute(
      'INSERT INTO template_modules (id, template_id, name, slug, icon, color, description, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [tmId, templateId, m.name, m.slug, m.icon || 'Boxes', m.color || '#7C3AED', m.description || '', i]
    );

    const [fieldRows] = await pool.execute(
      'SELECT * FROM module_fields WHERE module_id = ? ORDER BY order_index',
      [m.id]
    );
    for (let j = 0; j < fieldRows.length; j++) {
      const f = fieldRows[j];
      const tfId = uuid();
      await pool.execute(
        'INSERT INTO template_fields (id, template_module_id, name, label, type, settings_json, required, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          tfId,
          tmId,
          f.name,
          f.label,
          f.field_type || 'text',
          f.settings_json ? (typeof f.settings_json === 'string' ? f.settings_json : JSON.stringify(f.settings_json)) : null,
          f.is_required ? 1 : 0,
          j,
        ]
      );
    }

    const [pipeRows] = await pool.execute('SELECT * FROM pipelines WHERE module_id = ? AND tenant_id = ?', [m.id, tenantId]);
    for (const pipe of pipeRows) {
      const tpId = uuid();
      await pool.execute(
        'INSERT INTO template_pipelines (id, template_module_id, name) VALUES (?, ?, ?)',
        [tpId, tmId, pipe.name]
      );
      const [stageRows] = await pool.execute(
        'SELECT * FROM pipeline_stages WHERE pipeline_id = ? ORDER BY position',
        [pipe.id]
      );
      for (let k = 0; k < stageRows.length; k++) {
        const s = stageRows[k];
        await pool.execute(
          'INSERT INTO template_pipeline_stages (id, pipeline_id, name, color, order_index) VALUES (?, ?, ?, ?, ?)',
          [uuid(), tpId, s.name, s.color || '#6B7280', k]
        );
      }
    }
  }

  return { success: true, template_id: templateId, modules_count: modRows.length };
}
