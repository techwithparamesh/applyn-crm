/**
 * Example: MySQL-backed replacement for Supabase api-records edge function.
 * Use with Express (or similar). Requires mysql2 and env: MYSQL_*, or DATABASE_URL.
 *
 * Authenticates via X-API-Key header, then CRUD on crm_records scoped by tenant_id.
 * Run schema first: mysql -u root -p crm < ../setup.sql
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'crm',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

function jsonResponse(data, status = 200) {
  return { status, body: data };
}

async function getTenantByApiKey(apiKey) {
  const [rows] = await pool.execute(
    'SELECT id, tenant_id FROM api_keys WHERE api_key = ? AND is_active = 1 LIMIT 1',
    [apiKey]
  );
  if (rows.length === 0) return null;
  await pool.execute(
    'UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?',
    [rows[0].id]
  );
  return rows[0].tenant_id;
}

// GET /api-records or GET /api-records/:id
async function handleGet(tenantId, recordId, query) {
  const limit = Math.min(parseInt(query.limit || '50', 10) || 50, 100);
  const offset = parseInt(query.offset || '0', 10) || 0;
  const moduleId = query.module_id || null;

  if (recordId) {
    const [rows] = await pool.execute(
      'SELECT * FROM crm_records WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL LIMIT 1',
      [recordId, tenantId]
    );
    if (rows.length === 0) return jsonResponse({ error: 'Record not found' }, 404);
    return jsonResponse({ record: rows[0] });
  }

  let sql = 'SELECT * FROM crm_records WHERE tenant_id = ? AND deleted_at IS NULL';
  const params = [tenantId];
  if (moduleId) {
    sql += ' AND module_id = ?';
    params.push(moduleId);
  }
  sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.execute(sql, params);
  const [countRows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM crm_records WHERE tenant_id = ? AND deleted_at IS NULL' + (moduleId ? ' AND module_id = ?' : ''),
    moduleId ? [tenantId, moduleId] : [tenantId]
  );
  const total = countRows[0].total;

  return jsonResponse({ records: rows, total, limit, offset });
}

// POST /api-records
async function handlePost(tenantId, body) {
  if (!body.module_id) return jsonResponse({ error: 'module_id is required' }, 400);
  if (!body.values || typeof body.values !== 'object') return jsonResponse({ error: 'values object is required' }, 400);

  const id = require('crypto').randomUUID();
  const [result] = await pool.execute(
    'INSERT INTO crm_records (id, tenant_id, module_id, `values`, created_by) VALUES (?, ?, ?, ?, ?)',
    [id, tenantId, body.module_id, JSON.stringify(body.values), body.created_by || 'API']
  );
  const [rows] = await pool.execute('SELECT * FROM crm_records WHERE id = ?', [id]);
  return jsonResponse({ record: rows[0] }, 201);
}

// PUT /api-records/:id
async function handlePut(tenantId, recordId, body) {
  const [existing] = await pool.execute(
    'SELECT id FROM crm_records WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL LIMIT 1',
    [recordId, tenantId]
  );
  if (existing.length === 0) return jsonResponse({ error: 'Record not found' }, 404);

  const updates = ['updated_at = CURRENT_TIMESTAMP'];
  const params = [];
  if (body.values !== undefined) {
    updates.push('`values` = ?');
    params.push(JSON.stringify(body.values));
  }
  if (body.module_id !== undefined) {
    updates.push('module_id = ?');
    params.push(body.module_id);
  }
  params.push(recordId, tenantId);
  await pool.execute(
    `UPDATE crm_records SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`,
    params
  );
  const [rows] = await pool.execute('SELECT * FROM crm_records WHERE id = ?', [recordId]);
  return jsonResponse({ record: rows[0] });
}

// DELETE /api-records/:id
async function handleDelete(tenantId, recordId) {
  const [result] = await pool.execute(
    'UPDATE crm_records SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?',
    [recordId, tenantId]
  );
  if (result.affectedRows === 0) return jsonResponse({ error: 'Record not found' }, 404);
  return jsonResponse({ deleted: true });
}

/**
 * Express-style handler (example).
 * Mount: app.use('/api-records', apiRecordsHandler);
 */
async function apiRecordsHandler(req, res) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'Missing X-API-Key header' });

  const tenantId = await getTenantByApiKey(apiKey);
  if (!tenantId) return res.status(401).json({ error: 'Invalid or inactive API key' });

  const recordId = req.params.id || null;

  try {
    if (req.method === 'GET') {
      const out = await handleGet(tenantId, recordId, req.query);
      return res.status(out.status).json(out.body);
    }
    if (req.method === 'POST' && !recordId) {
      const out = await handlePost(tenantId, req.body);
      return res.status(out.status).json(out.body);
    }
    if ((req.method === 'PUT' || req.method === 'PATCH') && recordId) {
      const out = await handlePut(tenantId, recordId, req.body);
      return res.status(out.status).json(out.body);
    }
    if (req.method === 'DELETE' && recordId) {
      const out = await handleDelete(tenantId, recordId);
      return res.status(out.status).json(out.body);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { apiRecordsHandler, getTenantByApiKey, handleGet, handlePost, handlePut, handleDelete };
