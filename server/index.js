import 'dotenv/config';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { getPool, uuid } from './db.js';
import bcrypt from 'bcryptjs';
import { authMiddleware, optionalAuth, signToken, registerUser, verifyPassword } from './auth.js';
import { canUser, getUserPermissions } from './permissions.js';
import { installTemplate as doInstallTemplate, createFromWorkspace as doCreateFromWorkspace } from './templateService.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

const pool = getPool();

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
['avatars', 'files'].forEach((d) => {
  const p = path.join(UPLOAD_DIR, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sub = req.baseUrl.includes('avatar') ? 'avatars' : 'files';
    cb(null, path.join(UPLOAD_DIR, sub));
  },
  filename: (req, file, cb) => {
    const ext = (file.originalname && path.extname(file.originalname)) || '';
    cb(null, `${uuid()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

app.use('/uploads', express.static(UPLOAD_DIR));

// ---------- Auth (no /api prefix; no auth middleware) ----------
app.post('/auth/signup', async (req, res) => {
  const { company_name, admin_name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const result = await registerUser({ company_name: company_name || '', admin_name: admin_name || '', email, password });
    if (result.error) return res.status(400).json({ error: result.error });
    const token = signToken(result.userId);
    const [prof] = await pool.execute(
      'SELECT id, user_id, tenant_id, name, email, avatar_url, status, phone, timezone, notifications_enabled FROM profiles WHERE user_id = ?',
      [result.userId]
    );
    const user = prof[0];
    const [tenRows] = await pool.execute('SELECT id, name, subdomain, plan FROM tenants WHERE id = ?', [result.tenantId]);
    const tenant = tenRows[0] || null;
    res.status(201).json({
      token,
      session_token: token,
      user_id: result.userId,
      tenant_id: result.tenantId,
      user: user ? { ...user, tenant } : user,
      tenant,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const userId = await verifyPassword(email, password);
  if (!userId) return res.status(401).json({ error: 'Invalid email or password' });
  const token = signToken(userId);
  const [prof] = await pool.execute(
    'SELECT id, user_id, tenant_id, name, email, avatar_url, status, phone, timezone, notifications_enabled FROM profiles WHERE user_id = ?',
    [userId]
  );
  const user = prof[0];
  const tenantId = user?.tenant_id || 't1';
  const [tenRows] = await pool.execute('SELECT id, name, subdomain, plan FROM tenants WHERE id = ?', [tenantId]);
  const tenant = tenRows[0] || null;
  res.json({
    token,
    session_token: token,
    user_id: userId,
    tenant_id: tenantId,
    user: user ? { ...user, tenant } : user,
    tenant,
  });
});

app.get('/auth/me', authMiddleware, async (req, res) => {
  const [tenRows] = await pool.execute('SELECT id, name, subdomain, plan FROM tenants WHERE id = ?', [req.tenantId]);
  const tenant = tenRows[0] || null;
  res.json({ ...req.profile, tenant });
});

app.post('/auth/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword and newPassword required' });
  const [rows] = await pool.execute('SELECT id, password_hash FROM users WHERE id = ?', [req.userId]);
  if (!rows.length) return res.status(401).json({ error: 'User not found' });
  const ok = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
  const password_hash = await bcrypt.hash(newPassword, 10);
  await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, req.userId]);
  res.json({ ok: true });
});

// ---------- File upload (auth required) ----------
app.post('/api/upload/avatar', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/uploads/avatars/${req.file.filename}`;
  const [prof] = await pool.execute('SELECT id FROM profiles WHERE user_id = ?', [req.userId]);
  if (prof.length) await pool.execute('UPDATE profiles SET avatar_url = ? WHERE user_id = ?', [url, req.userId]);
  res.json({ url });
});

app.post('/api/upload/file', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/uploads/files/${req.file.filename}`;
  res.json({ url, filename: req.file.originalname });
});

function rowToCamel(row) {
  if (!row || typeof row !== 'object') return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const key = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[key] = v;
  }
  return out;
}

function rowsToCamel(rows) {
  return Array.isArray(rows) ? rows.map(rowToCamel) : [];
}

// ---------- Auth required for /api ----------
app.use('/api', authMiddleware);

// ---------- Dashboard KPIs (tenant-scoped) ----------
app.get('/api/dashboard/kpis', async (req, res) => {
  const tenantId = req.tenantId;
  try {
    const [modRows] = await pool.execute(
      "SELECT id, slug FROM modules WHERE tenant_id = ? AND slug IN ('leads', 'deals')",
      [tenantId]
    );
    const bySlug = {};
    modRows.forEach((r) => { bySlug[r.slug] = r.id; });
    const leadsModuleId = bySlug.leads || null;
    const dealsModuleId = bySlug.deals || null;

    let total_leads = 0;
    let active_deals = 0;
    let revenue = 0;

    if (leadsModuleId) {
      const [r] = await pool.execute(
        'SELECT COUNT(*) AS c FROM crm_records WHERE tenant_id = ? AND module_id = ? AND (deleted_at IS NULL OR deleted_at = 0)',
        [tenantId, leadsModuleId]
      );
      total_leads = r[0]?.c ?? 0;
    }

    if (dealsModuleId) {
      const [r] = await pool.execute(
        'SELECT COUNT(*) AS c FROM crm_records WHERE tenant_id = ? AND module_id = ? AND (deleted_at IS NULL OR deleted_at = 0)',
        [tenantId, dealsModuleId]
      );
      active_deals = r[0]?.c ?? 0;
      const [sumRows] = await pool.execute(
        `SELECT SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(\`values\`, '$.amount')) AS DECIMAL(15,2))) AS s FROM crm_records WHERE tenant_id = ? AND module_id = ? AND (deleted_at IS NULL OR deleted_at = 0) AND JSON_EXTRACT(\`values\`, '$.amount') IS NOT NULL`,
        [tenantId, dealsModuleId]
      );
      revenue = Number(sumRows[0]?.s) || 0;
    }

    const [taskRows] = await pool.execute(
      'SELECT COUNT(*) AS c FROM tasks WHERE tenant_id = ? AND DATE(due_date) = CURDATE()',
      [tenantId]
    );
    const tasks_due_today = taskRows[0]?.c ?? 0;

    res.json({ total_leads, active_deals, revenue, tasks_due_today });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- CRM Records (owner_user_id, visibility: private | team | organization) ----------
app.get('/api/crm_records', async (req, res) => {
  try {
    const { module_id, limit = 50, offset = 0 } = req.query;
    let sql = 'SELECT * FROM crm_records WHERE tenant_id = ? AND (deleted_at IS NULL OR deleted_at = 0)';
    const params = [req.tenantId];
    sql += ` AND (COALESCE(visibility,'organization') = 'organization' OR (COALESCE(visibility,'organization') = 'private' AND owner_user_id = ?) OR (COALESCE(visibility,'organization') = 'team' AND (owner_user_id = ? OR owner_user_id IN (SELECT user_id FROM team_members WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = ?) AND user_id IS NOT NULL))))`;
    params.push(req.userId, req.userId, req.userId);
    if (module_id) { sql += ' AND module_id = ?'; params.push(module_id); }
    sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10) || 50, parseInt(offset, 10) || 0);
    let rows;
    try {
      [rows] = await pool.execute(sql, params);
    } catch (colErr) {
      if (colErr.code === 'ER_BAD_FIELD_ERROR') {
        const fallback = module_id
          ? 'SELECT * FROM crm_records WHERE tenant_id = ? AND deleted_at IS NULL AND module_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?'
          : 'SELECT * FROM crm_records WHERE tenant_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT ? OFFSET ?';
        const p = [req.tenantId];
        if (module_id) p.push(module_id);
        p.push(parseInt(limit, 10) || 50, parseInt(offset, 10) || 0);
        [rows] = await pool.execute(fallback, p);
      } else throw colErr;
    }
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/crm_records/:id', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM crm_records WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL', [req.params.id, req.tenantId]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

app.post('/api/crm_records', async (req, res) => {
  const { module_id, values, created_by, owner_user_id, visibility = 'organization' } = req.body;
  if (!module_id || values === undefined) return res.status(400).json({ error: 'module_id and values required' });
  const id = uuid();
  const vis = ['private', 'team', 'organization'].includes(visibility) ? visibility : 'organization';
  try {
    await pool.execute(
      'INSERT INTO crm_records (id, tenant_id, module_id, owner_user_id, visibility, `values`, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.tenantId, module_id, owner_user_id || null, vis, JSON.stringify(values || {}), created_by || 'User']
    );
  } catch (e) {
    if (e.code === 'ER_BAD_FIELD_ERROR') {
      await pool.execute(
        'INSERT INTO crm_records (id, tenant_id, module_id, `values`, created_by) VALUES (?, ?, ?, ?, ?)',
        [id, req.tenantId, module_id, JSON.stringify(values || {}), created_by || 'User']
      );
    } else throw e;
  }
  const [r] = await pool.execute('SELECT * FROM crm_records WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.patch('/api/crm_records/:id', async (req, res) => {
  const { values, deleted_at, owner_user_id, visibility } = req.body;
  const [r] = await pool.execute('SELECT id FROM crm_records WHERE id = ? AND tenant_id = ?', [req.params.id, req.tenantId]);
  if (!r.length) return res.status(404).json({ error: 'Not found' });
  const updates = [];
  const params = [];
  if (values !== undefined) { updates.push('`values` = ?'); params.push(JSON.stringify(values)); }
  if (deleted_at !== undefined) { updates.push('deleted_at = ?'); params.push(deleted_at); }
  if (owner_user_id !== undefined) { updates.push('owner_user_id = ?'); params.push(owner_user_id || null); }
  if (visibility !== undefined && ['private', 'team', 'organization'].includes(visibility)) { updates.push('visibility = ?'); params.push(visibility); }
  if (!updates.length) return res.json(r[0]);
  params.push(req.params.id, req.tenantId);
  await pool.execute(`UPDATE crm_records SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?`, params);
  const [out] = await pool.execute('SELECT * FROM crm_records WHERE id = ?', [req.params.id]);
  res.json(out[0]);
});

app.delete('/api/crm_records/:id', async (req, res) => {
  const [r] = await pool.execute('UPDATE crm_records SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?', [req.params.id, req.tenantId]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

// ---------- Search (replaces search_records RPC) ----------
app.get('/api/search_records', async (req, res) => {
  const { _text_query: textQuery = '', _module_id: moduleId, _limit_val: limit = 50, _offset_val: offset = 0 } = req.query;
  let sql = 'SELECT id, module_id, tenant_id, `values`, created_at, updated_at FROM crm_records WHERE tenant_id = ? AND deleted_at IS NULL';
  const params = [req.tenantId];
  if (moduleId) { sql += ' AND module_id = ?'; params.push(moduleId); }
  if (textQuery && String(textQuery).trim()) {
    sql += ' AND (CAST(`values` AS CHAR) LIKE ?)';
    params.push('%' + String(textQuery).trim() + '%');
  }
  sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit, 10) || 50, parseInt(offset, 10) || 0);
  const [rows] = await pool.execute(sql, params);
  res.json(rows.map(row => ({ out_id: row.id, out_module_id: row.module_id, out_tenant_id: row.tenant_id, out_values: typeof row.values === 'string' ? JSON.parse(row.values) : row.values, out_created_at: row.created_at, out_updated_at: row.updated_at })));
});

// ---------- Modules ----------
app.get('/api/modules', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM modules WHERE tenant_id = ? ORDER BY order_index', [req.tenantId]);
  res.json(rows);
});

app.post('/api/modules', async (req, res) => {
  const id = uuid();
  const { name, slug, icon = 'Boxes', color = '#7C3AED', description = '', order_index = 0 } = req.body;
  await pool.execute(
    'INSERT INTO modules (id, tenant_id, name, slug, icon, color, description, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, req.tenantId, name, slug || name.toLowerCase().replace(/\s+/g, '_'), icon, color, description, order_index]
  );
  const [r] = await pool.execute('SELECT * FROM modules WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.patch('/api/modules/:id', async (req, res) => {
  const [existing] = await pool.execute('SELECT id FROM modules WHERE id = ? AND tenant_id = ?', [req.params.id, req.tenantId]);
  if (!existing.length) return res.status(404).json({ error: 'Not found' });
  const allowed = ['name', 'slug', 'icon', 'color', 'description', 'order_index'];
  const updates = [];
  const params = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) { updates.push(`${k} = ?`); params.push(req.body[k]); }
  }
  if (!updates.length) return res.json(existing[0]);
  params.push(req.params.id, req.tenantId);
  await pool.execute(`UPDATE modules SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`, params);
  const [r] = await pool.execute('SELECT * FROM modules WHERE id = ?', [req.params.id]);
  res.json(r[0]);
});

app.delete('/api/modules/:id', async (req, res) => {
  const [r] = await pool.execute('DELETE FROM modules WHERE id = ? AND tenant_id = ?', [req.params.id, req.tenantId]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

// ---------- Module fields ----------
app.get('/api/module_fields', async (req, res) => {
  const { module_id } = req.query;
  if (!module_id) return res.status(400).json({ error: 'module_id required' });
  const [rows] = await pool.execute('SELECT * FROM module_fields WHERE module_id = ? AND tenant_id = ? ORDER BY order_index', [module_id, req.tenantId]);
  res.json(rows);
});

app.post('/api/module_fields', async (req, res) => {
  const id = uuid();
  const { module_id, name, label, field_type = 'text', is_required = false, options_json, settings_json, order_index = 0 } = req.body;
  await pool.execute(
    'INSERT INTO module_fields (id, module_id, tenant_id, name, label, field_type, is_required, options_json, settings_json, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, module_id, req.tenantId, name, label, field_type, is_required ? 1 : 0, options_json ? JSON.stringify(options_json) : null, settings_json ? JSON.stringify(settings_json) : null, order_index]
  );
  const [r] = await pool.execute('SELECT * FROM module_fields WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.patch('/api/module_fields/:id', async (req, res) => {
  const [existing] = await pool.execute('SELECT id FROM module_fields WHERE id = ? AND tenant_id = ?', [req.params.id, req.tenantId]);
  if (!existing.length) return res.status(404).json({ error: 'Not found' });
  const allowed = ['name', 'label', 'field_type', 'is_required', 'options_json', 'settings_json', 'order_index'];
  const updates = [];
  const params = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      updates.push(`${k} = ?`);
      const val = k === 'is_required' ? (req.body[k] ? 1 : 0)
        : (k === 'options_json' || k === 'settings_json') && req.body[k] != null ? JSON.stringify(req.body[k]) : req.body[k];
      params.push(val);
    }
  }
  if (!updates.length) return res.json(existing[0]);
  params.push(req.params.id, req.tenantId);
  await pool.execute(`UPDATE module_fields SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`, params);
  const [r] = await pool.execute('SELECT * FROM module_fields WHERE id = ?', [req.params.id]);
  res.json(r[0]);
});

app.delete('/api/module_fields/:id', async (req, res) => {
  const [r] = await pool.execute('DELETE FROM module_fields WHERE id = ? AND tenant_id = ?', [req.params.id, req.tenantId]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

// ---------- Permission check (canUser) ----------
app.get('/api/can', async (req, res) => {
  const { permission } = req.query;
  if (!permission) return res.status(400).json({ error: 'permission query required (e.g. leads:view)' });
  const allowed = await canUser(req.userId, String(permission));
  res.json({ can: !!allowed });
});

app.get('/api/permissions', async (req, res) => {
  const list = await getUserPermissions(req.userId);
  res.json(list);
});

// ---------- Profiles & Tenants (for AuthProvider) ----------
app.get('/api/profiles', async (req, res) => {
  const { user_id } = req.query;
  if (user_id) {
    const [rows] = await pool.execute('SELECT * FROM profiles WHERE user_id = ? LIMIT 1', [user_id]);
    return res.json(rows[0] || null);
  }
  const [rows] = await pool.execute('SELECT * FROM profiles WHERE tenant_id = ? ORDER BY name', [req.tenantId]);
  res.json(rows);
});

app.post('/api/profiles', async (req, res) => {
  const id = uuid();
  const { user_id, tenant_id, name, email, status = 'online' } = req.body;
  await pool.execute(
    'INSERT INTO profiles (id, user_id, tenant_id, name, email, status) VALUES (?, ?, ?, ?, ?, ?)',
    [id, user_id, tenant_id || req.tenantId, name, email, status]
  );
  const [r] = await pool.execute('SELECT * FROM profiles WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.patch('/api/profiles/me', async (req, res) => {
  const [r] = await pool.execute('SELECT * FROM profiles WHERE user_id = ? LIMIT 1', [req.userId]);
  if (!r.length) return res.status(404).json({ error: 'Not found' });
  const allowed = ['name', 'email', 'avatar_url', 'status', 'phone', 'timezone', 'notifications_enabled'];
  const updates = [];
  const params = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) { updates.push(`${k} = ?`); params.push(req.body[k]); }
  }
  if (!updates.length) return res.json(r[0]);
  params.push(req.userId);
  await pool.execute(`UPDATE profiles SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`, params);
  const [out] = await pool.execute('SELECT * FROM profiles WHERE user_id = ?', [req.userId]);
  res.json(out[0]);
});

app.patch('/api/profiles/:id', async (req, res) => {
  const [r] = await pool.execute('SELECT * FROM profiles WHERE id = ?', [req.params.id]);
  if (!r.length) return res.status(404).json({ error: 'Not found' });
  const allowed = ['name', 'email', 'avatar_url', 'status', 'phone', 'timezone', 'notifications_enabled', 'updated_at'];
  const updates = [];
  const params = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) { updates.push(`${k} = ?`); params.push(req.body[k]); }
  }
  if (!updates.length) return res.json(r[0]);
  params.push(req.params.id);
  await pool.execute(`UPDATE profiles SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, params);
  const [out] = await pool.execute('SELECT * FROM profiles WHERE id = ?', [req.params.id]);
  res.json(out[0]);
});

app.delete('/api/profiles/:id', async (req, res) => {
  const [r] = await pool.execute('DELETE FROM profiles WHERE id = ?', [req.params.id]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

app.post('/api/tenants', async (req, res) => {
  const id = 't_' + crypto.randomBytes(8).toString('hex');
  const { name, owner_id } = req.body;
  await pool.execute('INSERT INTO tenants (id, name, owner_id) VALUES (?, ?, ?)', [id, name || '', owner_id || null]);
  res.status(201).json({ id });
});

// ---------- Roles, role_permissions, user_roles ----------
app.get('/api/roles', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM roles WHERE tenant_id = ?', [req.tenantId]);
  res.json(rows);
});

app.get('/api/role_permissions', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM role_permissions');
  res.json(rows);
});

app.get('/api/user_roles', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM user_roles WHERE tenant_id = ?', [req.tenantId]);
  res.json(rows);
});

app.post('/api/roles', async (req, res) => {
  const id = uuid();
  const { name, description = '' } = req.body;
  await pool.execute('INSERT INTO roles (id, tenant_id, name, description) VALUES (?, ?, ?, ?)', [id, req.tenantId, name, description]);
  const [r] = await pool.execute('SELECT * FROM roles WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.patch('/api/roles/:id', async (req, res) => {
  const [r] = await pool.execute('UPDATE roles SET name = ?, description = ? WHERE id = ? AND tenant_id = ?', [req.body.name, req.body.description ?? '', req.params.id, req.tenantId]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  const [out] = await pool.execute('SELECT * FROM roles WHERE id = ?', [req.params.id]);
  res.json(out[0]);
});

app.delete('/api/roles/:id', async (req, res) => {
  const [r] = await pool.execute('DELETE FROM roles WHERE id = ? AND tenant_id = ?', [req.params.id, req.tenantId]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

app.delete('/api/role_permissions', async (req, res) => {
  const { role_id } = req.query;
  if (!role_id) return res.status(400).json({ error: 'role_id required' });
  await pool.execute('DELETE FROM role_permissions WHERE role_id = ?', [role_id]);
  res.json({ deleted: true });
});

app.post('/api/role_permissions', async (req, res) => {
  const body = Array.isArray(req.body) ? req.body : [req.body];
  for (const row of body) {
    const id = uuid();
    await pool.execute('INSERT INTO role_permissions (id, role_id, module_name, action) VALUES (?, ?, ?, ?)', [id, row.role_id, row.module_name, row.action]);
  }
  res.status(201).json({ ok: true });
});

app.delete('/api/user_roles', async (req, res) => {
  const { user_id, role_id, tenant_id } = req.query;
  if (user_id && tenant_id) {
    await pool.execute('DELETE FROM user_roles WHERE user_id = ? AND tenant_id = ?', [user_id, tenant_id]);
  } else if (role_id) {
    await pool.execute('DELETE FROM user_roles WHERE role_id = ?', [role_id]);
  }
  res.json({ deleted: true });
});

app.post('/api/user_roles', async (req, res) => {
  const id = uuid();
  const { user_id, role_id } = req.body;
  await pool.execute('INSERT INTO user_roles (id, user_id, role_id, tenant_id) VALUES (?, ?, ?, ?)', [id, user_id, role_id, req.tenantId]);
  const [r] = await pool.execute('SELECT * FROM user_roles WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

// ---------- Pipelines ----------
app.get('/api/pipelines', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM pipelines WHERE tenant_id = ?', [req.tenantId]);
  res.json(rows);
});

app.post('/api/pipelines', async (req, res) => {
  const id = uuid();
  const { name, module_id } = req.body;
  await pool.execute('INSERT INTO pipelines (id, tenant_id, module_id, name) VALUES (?, ?, ?, ?)', [id, req.tenantId, module_id, name]);
  const [r] = await pool.execute('SELECT * FROM pipelines WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.patch('/api/pipelines/:id', async (req, res) => {
  const [r] = await pool.execute('UPDATE pipelines SET name = ? WHERE id = ? AND tenant_id = ?', [req.body.name, req.params.id, req.tenantId]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  const [out] = await pool.execute('SELECT * FROM pipelines WHERE id = ?', [req.params.id]);
  res.json(out[0]);
});

app.delete('/api/pipelines/:id', async (req, res) => {
  await pool.execute('DELETE FROM pipeline_stages WHERE pipeline_id = ?', [req.params.id]);
  const [r] = await pool.execute('DELETE FROM pipelines WHERE id = ? AND tenant_id = ?', [req.params.id, req.tenantId]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

app.get('/api/pipeline_stages', async (req, res) => {
  const { pipeline_id } = req.query;
  if (!pipeline_id) return res.status(400).json({ error: 'pipeline_id required' });
  const [rows] = await pool.execute('SELECT * FROM pipeline_stages WHERE pipeline_id = ? ORDER BY position', [pipeline_id]);
  res.json(rows);
});

app.post('/api/pipeline_stages', async (req, res) => {
  const body = Array.isArray(req.body) ? req.body : [req.body];
  const inserted = [];
  for (const row of body) {
    const id = uuid();
    await pool.execute('INSERT INTO pipeline_stages (id, pipeline_id, name, color, position) VALUES (?, ?, ?, ?, ?)', [id, row.pipeline_id, row.name, row.color || '#6B7280', row.position ?? 0]);
    const [r] = await pool.execute('SELECT * FROM pipeline_stages WHERE id = ?', [id]);
    inserted.push(r[0]);
  }
  res.status(201).json(inserted.length === 1 ? inserted[0] : inserted);
});

app.delete('/api/pipeline_stages', async (req, res) => {
  const { pipeline_id } = req.query;
  if (!pipeline_id) return res.status(400).json({ error: 'pipeline_id required' });
  await pool.execute('DELETE FROM pipeline_stages WHERE pipeline_id = ?', [pipeline_id]);
  res.json({ deleted: true });
});

// ---------- Tasks ----------
app.get('/api/tasks', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM tasks WHERE tenant_id = ? ORDER BY created_at DESC', [req.tenantId]);
  res.json(rows);
});

app.post('/api/tasks', async (req, res) => {
  const id = uuid();
  const { record_id, title, description = '', status = 'todo', priority = 'medium', due_date, assigned_to, created_by = 'User' } = req.body;
  await pool.execute(
    'INSERT INTO tasks (id, tenant_id, record_id, title, description, status, priority, due_date, assigned_to, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, req.tenantId, record_id || null, title, description, status, priority, due_date || null, assigned_to || null, created_by]
  );
  const [r] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.patch('/api/tasks/:id', async (req, res) => {
  const [r] = await pool.execute('SELECT * FROM tasks WHERE id = ? AND tenant_id = ?', [req.params.id, req.tenantId]);
  if (!r.length) return res.status(404).json({ error: 'Not found' });
  const allowed = ['title', 'description', 'status', 'priority', 'due_date', 'assigned_to'];
  const updates = [];
  const params = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) { updates.push(`${k} = ?`); params.push(req.body[k]); }
  }
  if (!updates.length) return res.json(r[0]);
  params.push(req.params.id, req.tenantId);
  await pool.execute(`UPDATE tasks SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?`, params);
  const [out] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  res.json(out[0]);
});

app.delete('/api/tasks/:id', async (req, res) => {
  const [r] = await pool.execute('DELETE FROM tasks WHERE id = ? AND tenant_id = ?', [req.params.id, req.tenantId]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

// ---------- Notes ----------
app.get('/api/notes', async (req, res) => {
  const { record_id } = req.query;
  if (!record_id) return res.status(400).json({ error: 'record_id required' });
  const [rows] = await pool.execute('SELECT * FROM notes WHERE record_id = ? AND tenant_id = ?', [record_id, req.tenantId]);
  res.json(rows);
});

app.post('/api/notes', async (req, res) => {
  const id = uuid();
  const { record_id, content, created_by = 'User' } = req.body;
  await pool.execute('INSERT INTO notes (id, tenant_id, record_id, content, created_by) VALUES (?, ?, ?, ?, ?)', [id, req.tenantId, record_id, content, created_by]);
  const [r] = await pool.execute('SELECT * FROM notes WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.delete('/api/notes/:id', async (req, res) => {
  const [r] = await pool.execute('DELETE FROM notes WHERE id = ? AND tenant_id = ?', [req.params.id, req.tenantId]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

// ---------- Files ----------
app.get('/api/files', async (req, res) => {
  const { record_id } = req.query;
  if (!record_id) return res.status(400).json({ error: 'record_id required' });
  const [rows] = await pool.execute('SELECT * FROM files WHERE record_id = ? AND tenant_id = ?', [record_id, req.tenantId]);
  res.json(rows);
});

app.post('/api/files', async (req, res) => {
  const id = uuid();
  const { record_id, file_name, file_url, file_size = 0, uploaded_by = 'User' } = req.body;
  await pool.execute('INSERT INTO files (id, tenant_id, record_id, file_name, file_url, file_size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, req.tenantId, record_id, file_name, file_url, file_size, uploaded_by]);
  const [r] = await pool.execute('SELECT * FROM files WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.delete('/api/files/:id', async (req, res) => {
  const [r] = await pool.execute('DELETE FROM files WHERE id = ? AND tenant_id = ?', [req.params.id, req.tenantId]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

// ---------- Dashboards ----------
app.get('/api/dashboards', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM dashboards WHERE tenant_id = ?', [req.tenantId]);
  res.json(rows);
});

app.post('/api/dashboards', async (req, res) => {
  const id = uuid();
  const { name } = req.body;
  await pool.execute('INSERT INTO dashboards (id, tenant_id, name) VALUES (?, ?, ?)', [id, req.tenantId, name]);
  const [r] = await pool.execute('SELECT * FROM dashboards WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.delete('/api/dashboards/:id', async (req, res) => {
  await pool.execute('DELETE FROM dashboard_widgets WHERE dashboard_id = ?', [req.params.id]);
  const [r] = await pool.execute('DELETE FROM dashboards WHERE id = ? AND tenant_id = ?', [req.params.id, req.tenantId]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

app.get('/api/dashboard_widgets', async (req, res) => {
  const { dashboard_id } = req.query;
  if (!dashboard_id) return res.status(400).json({ error: 'dashboard_id required' });
  const [rows] = await pool.execute('SELECT * FROM dashboard_widgets WHERE dashboard_id = ? ORDER BY order_index', [dashboard_id]);
  res.json(rows);
});

app.post('/api/dashboard_widgets', async (req, res) => {
  const id = uuid();
  const { dashboard_id, widget_type = 'metric_card', config_json = {}, order_index = 0, col_span = 1 } = req.body;
  await pool.execute('INSERT INTO dashboard_widgets (id, dashboard_id, widget_type, config_json, order_index, col_span) VALUES (?, ?, ?, ?, ?, ?)', [id, dashboard_id, widget_type, JSON.stringify(config_json), order_index, col_span]);
  const [r] = await pool.execute('SELECT * FROM dashboard_widgets WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.patch('/api/dashboard_widgets/:id', async (req, res) => {
  const allowed = ['order_index', 'col_span', 'config_json'];
  const updates = [];
  const params = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      updates.push(`${k} = ?`);
      params.push(k === 'config_json' ? JSON.stringify(req.body[k]) : req.body[k]);
    }
  }
  if (!updates.length) return res.status(400).json({ error: 'No updates' });
  params.push(req.params.id);
  await pool.execute(`UPDATE dashboard_widgets SET ${updates.join(', ')} WHERE id = ?`, params);
  const [r] = await pool.execute('SELECT * FROM dashboard_widgets WHERE id = ?', [req.params.id]);
  res.json(r[0]);
});

app.delete('/api/dashboard_widgets/:id', async (req, res) => {
  const [r] = await pool.execute('DELETE FROM dashboard_widgets WHERE id = ?', [req.params.id]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

// ---------- Reports ----------
app.get('/api/reports', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM reports WHERE tenant_id = ?', [req.tenantId]);
  res.json(rows);
});

app.post('/api/reports', async (req, res) => {
  const id = uuid();
  const b = req.body;
  await pool.execute(
    'INSERT INTO reports (id, tenant_id, name, module_id, filters_json, group_by, metrics, chart_type, schedule_email, schedule_cron, is_dashboard_widget) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, req.tenantId, b.name, b.module_id, JSON.stringify(b.filters_json || []), b.group_by || '', JSON.stringify(b.metrics || []), b.chart_type || 'bar', b.schedule_email || null, b.schedule_cron || null, b.is_dashboard_widget ? 1 : 0]
  );
  const [r] = await pool.execute('SELECT * FROM reports WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.patch('/api/reports/:id', async (req, res) => {
  const [r] = await pool.execute('SELECT * FROM reports WHERE id = ? AND tenant_id = ?', [req.params.id, req.tenantId]);
  if (!r.length) return res.status(404).json({ error: 'Not found' });
  const allowed = ['name', 'module_id', 'filters_json', 'group_by', 'metrics', 'chart_type', 'schedule_email', 'schedule_cron', 'is_dashboard_widget'];
  const updates = [];
  const params = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      updates.push(`${k} = ?`);
      params.push((k === 'filters_json' || k === 'metrics') && typeof req.body[k] === 'object' ? JSON.stringify(req.body[k]) : (k === 'is_dashboard_widget' ? (req.body[k] ? 1 : 0) : req.body[k]));
    }
  }
  if (!updates.length) return res.json(r[0]);
  params.push(req.params.id, req.tenantId);
  await pool.execute(`UPDATE reports SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?`, params);
  const [out] = await pool.execute('SELECT * FROM reports WHERE id = ?', [req.params.id]);
  res.json(out[0]);
});

app.delete('/api/reports/:id', async (req, res) => {
  const [r] = await pool.execute('DELETE FROM reports WHERE id = ? AND tenant_id = ?', [req.params.id, req.tenantId]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

// ---------- API Keys ----------
app.get('/api/api_keys', async (req, res) => {
  const [rows] = await pool.execute('SELECT id, tenant_id, key_name, api_key, is_active, created_at, last_used_at FROM api_keys WHERE tenant_id = ?', [req.tenantId]);
  res.json(rows);
});

app.post('/api/api_keys', async (req, res) => {
  const id = uuid();
  const keyName = req.body.key_name || 'New key';
  const apiKey = 'ak_' + crypto.randomBytes(24).toString('hex');
  await pool.execute('INSERT INTO api_keys (id, tenant_id, key_name, api_key) VALUES (?, ?, ?, ?)', [id, req.tenantId, keyName, apiKey]);
  const [r] = await pool.execute('SELECT * FROM api_keys WHERE id = ?', [id]);
  const row = r[0];
  res.status(201).json({ ...row, api_key: apiKey });
});

app.patch('/api/api_keys/:id', async (req, res) => {
  const [r] = await pool.execute('UPDATE api_keys SET is_active = ? WHERE id = ? AND tenant_id = ?', [req.body.is_active ? 1 : 0, req.params.id, req.tenantId]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  const [out] = await pool.execute('SELECT * FROM api_keys WHERE id = ?', [req.params.id]);
  res.json(out[0]);
});

app.delete('/api/api_keys/:id', async (req, res) => {
  const [r] = await pool.execute('DELETE FROM api_keys WHERE id = ? AND tenant_id = ?', [req.params.id, req.tenantId]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

// ---------- Automations ----------
app.get('/api/automations', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM automations WHERE tenant_id = ?', [req.tenantId]);
  res.json(rows);
});

app.post('/api/automations', async (req, res) => {
  const id = uuid();
  const { name, module_id, trigger_event = 'record_created' } = req.body;
  await pool.execute('INSERT INTO automations (id, tenant_id, name, module_id, trigger_event) VALUES (?, ?, ?, ?, ?)', [id, req.tenantId, name, module_id, trigger_event]);
  const [r] = await pool.execute('SELECT * FROM automations WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.patch('/api/automations/:id', async (req, res) => {
  const allowed = ['name', 'module_id', 'trigger_event', 'is_active'];
  const updates = [];
  const params = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      updates.push(`${k} = ?`);
      params.push(k === 'is_active' ? (req.body[k] ? 1 : 0) : req.body[k]);
    }
  }
  if (!updates.length) return res.status(400).json({ error: 'No updates' });
  params.push(req.params.id, req.tenantId);
  await pool.execute(`UPDATE automations SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?`, params);
  const [r] = await pool.execute('SELECT * FROM automations WHERE id = ?', [req.params.id]);
  res.json(r[0]);
});

app.delete('/api/automations/:id', async (req, res) => {
  const [r] = await pool.execute('DELETE FROM automations WHERE id = ? AND tenant_id = ?', [req.params.id, req.tenantId]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

app.get('/api/automation_conditions', async (req, res) => {
  const { automation_id } = req.query;
  if (!automation_id) return res.status(400).json({ error: 'automation_id required' });
  const ids = automation_id.split(',').filter(Boolean);
  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await pool.execute(`SELECT * FROM automation_conditions WHERE automation_id IN (${placeholders}) ORDER BY sort_order`, ids);
  res.json(rows);
});

app.post('/api/automation_conditions', async (req, res) => {
  const id = uuid();
  const { automation_id, field_name, operator = 'equals', value = '', sort_order = 0 } = req.body;
  await pool.execute('INSERT INTO automation_conditions (id, automation_id, field_name, operator, value, sort_order) VALUES (?, ?, ?, ?, ?, ?)', [id, automation_id, field_name, operator, value, sort_order]);
  const [r] = await pool.execute('SELECT * FROM automation_conditions WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.delete('/api/automation_conditions/:id', async (req, res) => {
  await pool.execute('DELETE FROM automation_conditions WHERE id = ?', [req.params.id]);
  res.json({ deleted: true });
});

app.get('/api/automation_actions', async (req, res) => {
  const { automation_id } = req.query;
  if (!automation_id) return res.status(400).json({ error: 'automation_id required' });
  const ids = automation_id.split(',');
  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await pool.execute(`SELECT * FROM automation_actions WHERE automation_id IN (${placeholders}) ORDER BY sort_order`, ids);
  res.json(rows);
});

app.post('/api/automation_actions', async (req, res) => {
  const id = uuid();
  const { automation_id, action_type, action_config = {}, sort_order = 0 } = req.body;
  await pool.execute('INSERT INTO automation_actions (id, automation_id, action_type, action_config, sort_order) VALUES (?, ?, ?, ?, ?)', [id, automation_id, action_type, JSON.stringify(action_config), sort_order]);
  const [r] = await pool.execute('SELECT * FROM automation_actions WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.delete('/api/automation_actions/:id', async (req, res) => {
  await pool.execute('DELETE FROM automation_actions WHERE id = ?', [req.params.id]);
  res.json({ deleted: true });
});

app.get('/api/automation_logs', async (req, res) => {
  const { automation_id } = req.query;
  let sql = 'SELECT * FROM automation_logs WHERE tenant_id = ?';
  const params = [req.tenantId];
  if (automation_id) { sql += ' AND automation_id = ?'; params.push(automation_id); }
  sql += ' ORDER BY created_at DESC LIMIT 50';
  const [rows] = await pool.execute(sql, params);
  res.json(rows);
});

app.post('/api/run-automation', async (req, res) => {
  const { module_id, trigger_event, record, tenant_id } = req.body;
  const tid = tenant_id || req.tenantId;
  const [autos] = await pool.execute('SELECT * FROM automations WHERE tenant_id = ? AND module_id = ? AND trigger_event = ? AND is_active = 1', [tid, module_id, trigger_event]);
  let executed = 0;
  for (const auto of autos) {
    const [conds] = await pool.execute('SELECT * FROM automation_conditions WHERE automation_id = ? ORDER BY sort_order', [auto.id]);
    let match = true;
    for (const c of conds) {
      const val = record?.values?.[c.field_name];
      if (c.operator === 'equals' && val != c.value) match = false;
      if (c.operator === 'not_equals' && val == c.value) match = false;
    }
    if (match) {
      const [actions] = await pool.execute('SELECT * FROM automation_actions WHERE automation_id = ? ORDER BY sort_order', [auto.id]);
      for (const a of actions) executed++;
    }
  }
  res.json({ matched: autos.length, executed });
});

// ---------- Teams, team_members, invitations ----------
app.get('/api/teams', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM teams WHERE tenant_id = ? ORDER BY name', [req.tenantId]);
  res.json(rows);
});

app.post('/api/teams', async (req, res) => {
  const id = uuid();
  const { name, description = '' } = req.body;
  await pool.execute('INSERT INTO teams (id, tenant_id, name, description) VALUES (?, ?, ?, ?)', [id, req.tenantId, name, description]);
  const [r] = await pool.execute('SELECT * FROM teams WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.delete('/api/teams/:id', async (req, res) => {
  await pool.execute('DELETE FROM team_members WHERE team_id = ?', [req.params.id]);
  const [r] = await pool.execute('DELETE FROM teams WHERE id = ? AND tenant_id = ?', [req.params.id, req.tenantId]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

app.get('/api/team_members', async (req, res) => {
  const { team_id } = req.query;
  if (!team_id) return res.status(400).json({ error: 'team_id required' });
  const [rows] = await pool.execute('SELECT tm.*, p.id as profile_id, p.name as profile_name, p.email as profile_email FROM team_members tm JOIN profiles p ON p.id = tm.profile_id WHERE tm.team_id = ?', [team_id]);
  res.json(rows);
});

app.post('/api/team_members', async (req, res) => {
  const id = uuid();
  const { team_id, profile_id, user_id, role } = req.body;
  const uid = user_id || null;
  const pid = profile_id || null;
  try {
    await pool.execute('INSERT INTO team_members (id, team_id, user_id, profile_id, role) VALUES (?, ?, ?, ?, ?)', [id, team_id, uid, pid, role || 'member']);
  } catch (e) {
    if (e.code === 'ER_BAD_FIELD_ERROR') {
      await pool.execute('INSERT INTO team_members (id, team_id, profile_id) VALUES (?, ?, ?)', [id, team_id, profile_id]);
    } else throw e;
  }
  const [r] = await pool.execute('SELECT * FROM team_members WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.delete('/api/team_members', async (req, res) => {
  const { team_id, profile_id } = req.query;
  if (!team_id || !profile_id) return res.status(400).json({ error: 'team_id and profile_id required' });
  await pool.execute('DELETE FROM team_members WHERE team_id = ? AND profile_id = ?', [team_id, profile_id]);
  res.json({ deleted: true });
});

app.get('/api/invitations', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM invitations WHERE tenant_id = ? ORDER BY created_at DESC', [req.tenantId]);
  res.json(rows);
});

app.post('/api/invitations', async (req, res) => {
  const id = uuid();
  const token = crypto.randomBytes(32).toString('hex');
  const { email, name, role_id, team_id } = req.body;
  const invited_by = req.profile?.name || req.userId || '';
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  try {
    await pool.execute(
      'INSERT INTO invitations (id, tenant_id, email, name, role_id, team_id, token, expires_at, invited_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.tenantId, email, name || null, role_id || null, team_id || null, token, expiresAt, invited_by]
    );
  } catch (e) {
    if (e.code === 'ER_BAD_FIELD_ERROR') {
      await pool.execute('INSERT INTO invitations (id, tenant_id, email, role_id, token, expires_at, invited_by) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, req.tenantId, email, role_id || null, token, expiresAt, invited_by]);
    } else throw e;
  }
  const [r] = await pool.execute('SELECT * FROM invitations WHERE id = ?', [id]);
  // TODO: Send invitation email (e.g. nodemailer) with link containing token; accept flow sets password and creates profile
  res.status(201).json(r[0]);
});

app.delete('/api/invitations/:id', async (req, res) => {
  const [r] = await pool.execute('DELETE FROM invitations WHERE id = ? AND tenant_id = ?', [req.params.id, req.tenantId]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

// ---------- Record tags ----------
app.get('/api/record_tags', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM record_tags WHERE tenant_id = ?', [req.tenantId]);
  res.json(rows);
});

app.post('/api/record_tags', async (req, res) => {
  const id = uuid();
  const { record_id, tag, color = 'blue' } = req.body;
  await pool.execute('INSERT INTO record_tags (id, record_id, tag, color, tenant_id) VALUES (?, ?, ?, ?, ?)', [id, record_id, tag, color, req.tenantId]);
  const [r] = await pool.execute('SELECT * FROM record_tags WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.delete('/api/record_tags', async (req, res) => {
  const { tag, record_id } = req.query;
  if (tag) {
    await pool.execute('DELETE FROM record_tags WHERE tag = ? AND tenant_id = ?', [tag, req.tenantId]);
  } else if (record_id) {
    const { tag: t } = req.query;
    if (t) await pool.execute('DELETE FROM record_tags WHERE record_id = ? AND tag = ?', [record_id, t]);
    else await pool.execute('DELETE FROM record_tags WHERE record_id = ?', [record_id]);
  }
  res.json({ deleted: true });
});

// ---------- Installed templates ----------
app.get('/api/installed_templates', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT template_slug, template_id FROM installed_templates WHERE tenant_id = ?', [req.tenantId]);
    const slugs = rows.map(r => r.template_slug);
    const ids = (rows.map(r => r.template_id).filter(Boolean));
    res.json({ slugs, ids });
  } catch (e) {
    const [rows] = await pool.execute('SELECT template_slug FROM installed_templates WHERE tenant_id = ?', [req.tenantId]);
    res.json({ slugs: rows.map(r => r.template_slug), ids: [] });
  }
});

app.post('/api/installed_templates', async (req, res) => {
  const id = uuid();
  const { template_slug, template_name, template_id } = req.body;
  try {
    await pool.execute('INSERT INTO installed_templates (id, tenant_id, template_slug, template_name, template_id) VALUES (?, ?, ?, ?, ?)', [id, req.tenantId, template_slug, template_name, template_id || null]);
  } catch (e) {
    if (e.code === 'ER_BAD_FIELD_ERROR') {
      await pool.execute('INSERT INTO installed_templates (id, tenant_id, template_slug, template_name) VALUES (?, ?, ?, ?)', [id, req.tenantId, template_slug, template_name]);
    } else throw e;
  }
  res.status(201).json({ id });
});

// ---------- Template Engine & Marketplace ----------
app.get('/api/template_categories', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM template_categories ORDER BY order_index, name');
    res.json(rows);
  } catch (e) {
    res.json([]);
  }
});

app.get('/api/templates', async (req, res) => {
  try {
    const { category_id, search } = req.query;
    let sql = 'SELECT t.*, c.name AS category_name FROM crm_templates t LEFT JOIN template_categories c ON c.id = t.category_id WHERE t.is_public = 1';
    const params = [];
    if (category_id) { sql += ' AND t.category_id = ?'; params.push(category_id); }
    if (search && String(search).trim()) { sql += ' AND (t.name LIKE ? OR t.description LIKE ?)'; const term = '%' + String(search).trim() + '%'; params.push(term, term); }
    sql += ' ORDER BY t.name';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (e) {
    res.json([]);
  }
});

app.get('/api/templates/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT t.*, c.name AS category_name FROM crm_templates t LEFT JOIN template_categories c ON c.id = t.category_id WHERE t.id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const [mods] = await pool.execute('SELECT * FROM template_modules WHERE template_id = ? ORDER BY order_index', [req.params.id]);
    res.json({ ...rows[0], modules: mods });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/templates/install', async (req, res) => {
  const { template_id } = req.body;
  if (!template_id) return res.status(400).json({ error: 'template_id required' });
  try {
    const result = await doInstallTemplate(template_id, req.tenantId);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/templates/create-from-workspace', async (req, res) => {
  const { workspace_id, template_name, category_id, description } = req.body;
  const tenantId = workspace_id || req.tenantId;
  if (!template_name || !String(template_name).trim()) return res.status(400).json({ error: 'template_name required' });
  try {
    const result = await doCreateFromWorkspace(tenantId, { template_name: template_name.trim(), category_id: category_id || null, description: description || null });
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ---------- Email (minimal for hooks) ----------
app.get('/api/email_accounts', async (req, res) => {
  const [rows] = await pool.execute('SELECT id, tenant_id, user_id, provider, email_address, is_active, last_sync_at, created_at FROM email_accounts WHERE tenant_id = ?', [req.tenantId]);
  res.json(rows);
});

app.patch('/api/email_accounts/:id', async (req, res) => {
  const [r] = await pool.execute('UPDATE email_accounts SET is_active = ? WHERE id = ? AND tenant_id = ?', [req.body.is_active ? 1 : 0, req.params.id, req.tenantId]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  const [out] = await pool.execute('SELECT * FROM email_accounts WHERE id = ?', [req.params.id]);
  res.json(out[0]);
});

app.get('/api/emails', async (req, res) => {
  const { account_id, id } = req.query;
  if (id) {
    const [rows] = await pool.execute('SELECT * FROM emails WHERE id = ? AND tenant_id = ?', [id, req.tenantId]);
    return res.json(rows[0] || null);
  }
  if (!account_id) return res.status(400).json({ error: 'account_id required' });
  const [rows] = await pool.execute('SELECT * FROM emails WHERE account_id = ? AND tenant_id = ? ORDER BY sent_at DESC', [account_id, req.tenantId]);
  res.json(rows);
});

app.patch('/api/emails/:id', async (req, res) => {
  const allowed = ['is_read', 'is_starred'];
  const updates = [];
  const params = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) { updates.push(`${k} = ?`); params.push(req.body[k] ? 1 : 0); }
  }
  if (!updates.length) return res.status(400).json({ error: 'No updates' });
  params.push(req.params.id);
  await pool.execute(`UPDATE emails SET ${updates.join(', ')} WHERE id = ?`, params);
  const [r] = await pool.execute('SELECT * FROM emails WHERE id = ?', [req.params.id]);
  res.json(r[0]);
});

app.delete('/api/emails/:id', async (req, res) => {
  const [r] = await pool.execute('DELETE FROM emails WHERE id = ?', [req.params.id]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

app.get('/api/email_record_links', async (req, res) => {
  const { record_id } = req.query;
  if (!record_id) return res.status(400).json({ error: 'record_id required' });
  const [rows] = await pool.execute('SELECT * FROM email_record_links WHERE record_id = ?', [record_id]);
  res.json(rows);
});

app.post('/api/email_record_links', async (req, res) => {
  const id = uuid();
  const { email_id, record_id, module_name } = req.body;
  await pool.execute('INSERT INTO email_record_links (id, email_id, record_id, module_name) VALUES (?, ?, ?, ?)', [id, email_id, record_id, module_name]);
  const [r] = await pool.execute('SELECT * FROM email_record_links WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.delete('/api/email_record_links', async (req, res) => {
  const { email_id, record_id } = req.query;
  if (email_id && record_id) {
    await pool.execute('DELETE FROM email_record_links WHERE email_id = ? AND record_id = ?', [email_id, record_id]);
  }
  res.json({ deleted: true });
});

app.get('/api/email_attachments', async (req, res) => {
  const { email_id } = req.query;
  if (!email_id) return res.status(400).json({ error: 'email_id required' });
  const [rows] = await pool.execute('SELECT * FROM email_attachments WHERE email_id = ?', [email_id]);
  res.json(rows);
});

// ---------- Import ----------
app.post('/api/import_jobs', async (req, res) => {
  const id = uuid();
  const b = req.body;
  await pool.execute(
    'INSERT INTO import_jobs (id, tenant_id, module_id, file_name, status, total_rows, processed_rows, success_rows, failed_rows, column_mapping) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, req.tenantId, b.module_id, b.file_name || '', b.status || 'pending', b.total_rows || 0, b.processed_rows || 0, b.success_rows || 0, b.failed_rows || 0, JSON.stringify(b.column_mapping || {})]
  );
  const [r] = await pool.execute('SELECT * FROM import_jobs WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.patch('/api/import_jobs/:id', async (req, res) => {
  const [r] = await pool.execute('SELECT * FROM import_jobs WHERE id = ? AND tenant_id = ?', [req.params.id, req.tenantId]);
  if (!r.length) return res.status(404).json({ error: 'Not found' });
  const allowed = ['status', 'processed_rows', 'success_rows', 'failed_rows', 'completed_at'];
  const updates = [];
  const params = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) { updates.push(`${k} = ?`); params.push(req.body[k]); }
  }
  if (!updates.length) return res.json(r[0]);
  params.push(req.params.id, req.tenantId);
  await pool.execute(`UPDATE import_jobs SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`, params);
  const [out] = await pool.execute('SELECT * FROM import_jobs WHERE id = ?', [req.params.id]);
  res.json(out[0]);
});

app.post('/api/import_errors', async (req, res) => {
  const body = Array.isArray(req.body) ? req.body : [req.body];
  for (const row of body) {
    const id = uuid();
    await pool.execute('INSERT INTO import_errors (id, job_id, row_number, row_data, error_message) VALUES (?, ?, ?, ?, ?)', [id, row.job_id, row.row_number, row.row_data ? JSON.stringify(row.row_data) : null, row.error_message]);
  }
  res.status(201).json({ ok: true });
});

// ---------- WhatsApp ----------
app.get('/api/whatsapp_accounts', async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM whatsapp_accounts WHERE tenant_id = ?', [req.tenantId]);
  res.json(rows);
});

app.post('/api/whatsapp_accounts', async (req, res) => {
  const id = uuid();
  const b = req.body;
  await pool.execute(
    'INSERT INTO whatsapp_accounts (id, tenant_id, business_account_id, phone_number_id, display_phone_number, access_token, webhook_verify_token, is_connected) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, req.tenantId, b.business_account_id, b.phone_number_id, b.display_phone_number, b.access_token, b.webhook_verify_token || '', b.is_connected !== false ? 1 : 0]
  );
  const [r] = await pool.execute('SELECT * FROM whatsapp_accounts WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.patch('/api/whatsapp_accounts/:id', async (req, res) => {
  const [r] = await pool.execute('UPDATE whatsapp_accounts SET is_connected = ? WHERE id = ? AND tenant_id = ?', [req.body.is_connected ? 1 : 0, req.params.id, req.tenantId]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  const [out] = await pool.execute('SELECT * FROM whatsapp_accounts WHERE id = ?', [req.params.id]);
  res.json(out[0]);
});

app.get('/api/whatsapp_conversations', async (req, res) => {
  const { account_id } = req.query;
  if (!account_id) return res.status(400).json({ error: 'account_id required' });
  const [rows] = await pool.execute('SELECT * FROM whatsapp_conversations WHERE account_id = ? AND tenant_id = ? ORDER BY last_message_at DESC', [account_id, req.tenantId]);
  res.json(rows);
});

app.post('/api/whatsapp_conversations', async (req, res) => {
  const id = uuid();
  const b = req.body;
  await pool.execute(
    'INSERT INTO whatsapp_conversations (id, account_id, tenant_id, contact_phone, contact_name, contact_id, record_id, module_name, last_message, last_message_at, unread_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, b.account_id, req.tenantId, b.contact_phone, b.contact_name || null, b.contact_id || null, b.record_id || null, b.module_name || null, b.last_message || null, b.last_message_at || new Date(), b.unread_count || 0]
  );
  const [r] = await pool.execute('SELECT * FROM whatsapp_conversations WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

app.patch('/api/whatsapp_conversations/:id', async (req, res) => {
  const [r] = await pool.execute('SELECT * FROM whatsapp_conversations WHERE id = ?', [req.params.id]);
  if (!r.length) return res.status(404).json({ error: 'Not found' });
  const allowed = ['last_message', 'last_message_at', 'unread_count', 'contact_id', 'record_id'];
  const updates = [];
  const params = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) { updates.push(`${k} = ?`); params.push(req.body[k]); }
  }
  if (!updates.length) return res.json(r[0]);
  params.push(req.params.id);
  await pool.execute(`UPDATE whatsapp_conversations SET ${updates.join(', ')} WHERE id = ?`, params);
  const [out] = await pool.execute('SELECT * FROM whatsapp_conversations WHERE id = ?', [req.params.id]);
  res.json(out[0]);
});

app.get('/api/whatsapp_messages', async (req, res) => {
  const { conversation_id } = req.query;
  if (!conversation_id) return res.status(400).json({ error: 'conversation_id required' });
  const [rows] = await pool.execute('SELECT * FROM whatsapp_messages WHERE conversation_id = ? AND tenant_id = ? ORDER BY sent_at', [conversation_id, req.tenantId]);
  res.json(rows);
});

app.post('/api/whatsapp_messages', async (req, res) => {
  const id = uuid();
  const b = req.body;
  await pool.execute(
    'INSERT INTO whatsapp_messages (id, conversation_id, tenant_id, content, message_type, direction, status, whatsapp_message_id, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, b.conversation_id, req.tenantId, b.content, b.message_type || 'text', b.direction || 'outgoing', b.status || 'sent', b.whatsapp_message_id || null, b.sent_at || new Date()]
  );
  const [r] = await pool.execute('SELECT * FROM whatsapp_messages WHERE id = ?', [id]);
  res.status(201).json(r[0]);
});

// ---------- Bulk insert for imports ----------
app.post('/api/crm_records/bulk', async (req, res) => {
  const rows = Array.isArray(req.body) ? req.body : [req.body];
  const inserted = [];
  for (const row of rows) {
    const id = uuid();
    await pool.execute(
      'INSERT INTO crm_records (id, tenant_id, module_id, `values`, created_by) VALUES (?, ?, ?, ?, ?)',
      [id, req.tenantId, row.module_id, JSON.stringify(row.values || {}), row.created_by || 'Import']
    );
    inserted.push(id);
  }
  res.status(201).json(inserted);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MySQL API server running at http://localhost:${PORT}`);
});
