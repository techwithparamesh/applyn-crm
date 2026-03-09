/**
 * Seed default modules, fields, and dashboard for a new tenant.
 * Used after creating a tenant on signup.
 */

import { getPool, uuid } from './db.js';

const DEFAULT_MODULES = [
  { name: 'Leads', slug: 'leads', icon: 'Users', color: '#7C3AED', description: 'Potential customers or opportunities', orderIndex: 0 },
  { name: 'Contacts', slug: 'contacts', icon: 'Contact', color: '#6366f1', description: 'People and companies', orderIndex: 1 },
  { name: 'Deals', slug: 'deals', icon: 'Handshake', color: '#10B981', description: 'Sales opportunities and pipeline', orderIndex: 2 },
  { name: 'Tasks', slug: 'tasks', icon: 'CheckSquare', color: '#F59E0B', description: 'To-dos and follow-ups', orderIndex: 3 },
];

const DEFAULT_FIELDS = {
  leads: [
    { name: 'full_name', label: 'Full Name', field_type: 'text', is_required: 1, options_json: null, order_index: 0 },
    { name: 'email', label: 'Email', field_type: 'email', is_required: 1, options_json: null, order_index: 1 },
    { name: 'phone', label: 'Phone', field_type: 'phone', is_required: 0, options_json: null, order_index: 2 },
    { name: 'company', label: 'Company', field_type: 'text', is_required: 0, options_json: null, order_index: 3 },
    { name: 'source', label: 'Source', field_type: 'select', is_required: 0, options_json: JSON.stringify(['Website', 'Referral', 'Cold Call', 'Other']), order_index: 4 },
  ],
  contacts: [
    { name: 'full_name', label: 'Full Name', field_type: 'text', is_required: 1, options_json: null, order_index: 0 },
    { name: 'email', label: 'Email', field_type: 'email', is_required: 1, options_json: null, order_index: 1 },
    { name: 'phone', label: 'Phone', field_type: 'phone', is_required: 0, options_json: null, order_index: 2 },
  ],
  deals: [
    { name: 'name', label: 'Deal Name', field_type: 'text', is_required: 1, options_json: null, order_index: 0 },
    { name: 'amount', label: 'Amount', field_type: 'currency', is_required: 0, options_json: null, order_index: 1 },
    { name: 'stage', label: 'Stage', field_type: 'select', is_required: 0, options_json: JSON.stringify(['New', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']), order_index: 2 },
    { name: 'close_date', label: 'Close Date', field_type: 'date', is_required: 0, options_json: null, order_index: 3 },
  ],
  tasks: [
    { name: 'subject', label: 'Subject', field_type: 'text', is_required: 1, options_json: null, order_index: 0 },
    { name: 'due_date', label: 'Due Date', field_type: 'date', is_required: 0, options_json: null, order_index: 1 },
    { name: 'status', label: 'Status', field_type: 'select', is_required: 0, options_json: JSON.stringify(['Pending', 'In Progress', 'Completed']), order_index: 2 },
  ],
};

const DEFAULT_WIDGETS = [
  { widget_type: 'metric_card', config_json: { title: 'Total Leads', metricKey: 'total_leads' }, order_index: 0, position_x: 0, position_y: 0, width: 3, height: 1 },
  { widget_type: 'metric_card', config_json: { title: 'Active Deals', metricKey: 'active_deals' }, order_index: 1, position_x: 3, position_y: 0, width: 3, height: 1 },
  { widget_type: 'metric_card', config_json: { title: 'Revenue', metricKey: 'revenue' }, order_index: 2, position_x: 6, position_y: 0, width: 3, height: 1 },
  { widget_type: 'metric_card', config_json: { title: 'Tasks Due Today', metricKey: 'tasks_due_today' }, order_index: 3, position_x: 9, position_y: 0, width: 3, height: 1 },
  { widget_type: 'line_chart', config_json: { title: 'Revenue Trend', metricKey: 'revenue_trend' }, order_index: 4, position_x: 0, position_y: 1, width: 6, height: 2 },
  { widget_type: 'donut_chart', config_json: { title: 'Pipeline Distribution', metricKey: 'pipeline_distribution' }, order_index: 5, position_x: 6, position_y: 1, width: 6, height: 2 },
];

export async function seedTenantDefaults(tenantId) {
  const pool = getPool();
  const moduleIds = {};

  for (const mod of DEFAULT_MODULES) {
    const id = uuid();
    await pool.execute(
      'INSERT INTO modules (id, tenant_id, name, slug, icon, color, description, is_system, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)',
      [id, tenantId, mod.name, mod.slug, mod.icon, mod.color, mod.description || '', mod.orderIndex]
    );
    moduleIds[mod.slug] = id;
  }

  for (const [slug, fields] of Object.entries(DEFAULT_FIELDS)) {
    const moduleId = moduleIds[slug];
    if (!moduleId) continue;
    for (const f of fields) {
      const id = uuid();
      await pool.execute(
        'INSERT INTO module_fields (id, module_id, tenant_id, name, label, field_type, is_required, options_json, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, moduleId, tenantId, f.name, f.label, f.field_type, f.is_required, f.options_json, f.order_index]
      );
    }
  }

  const dashboardId = uuid();
  await pool.execute('INSERT INTO dashboards (id, tenant_id, name) VALUES (?, ?, ?)', [dashboardId, tenantId, 'Default Dashboard']);

  const hasPosition = await hasDashboardWidgetsPositionColumns(pool);
  for (let i = 0; i < DEFAULT_WIDGETS.length; i++) {
    const w = DEFAULT_WIDGETS[i];
    const id = uuid();
    if (hasPosition) {
      await pool.execute(
        'INSERT INTO dashboard_widgets (id, dashboard_id, widget_type, config_json, order_index, col_span, position_x, position_y, width, height) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)',
        [id, dashboardId, w.widget_type, JSON.stringify(w.config_json), w.order_index, w.position_x, w.position_y, w.width, w.height]
      );
    } else {
      await pool.execute(
        'INSERT INTO dashboard_widgets (id, dashboard_id, widget_type, config_json, order_index, col_span) VALUES (?, ?, ?, ?, ?, 1)',
        [id, dashboardId, w.widget_type, JSON.stringify(w.config_json), w.order_index]
      );
    }
  }

  return { moduleIds, dashboardId };
}

async function hasDashboardWidgetsPositionColumns(pool) {
  try {
    const [rows] = await pool.execute("SHOW COLUMNS FROM dashboard_widgets LIKE 'position_x'");
    return rows.length > 0;
  } catch {
    return false;
  }
}
