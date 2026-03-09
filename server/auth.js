import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getPool, uuid } from './db.js';
import crypto from 'crypto';
import { seedTenantDefaults } from './tenantSeed.js';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'change-me-in-production';

export function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });
}

function slugFromName(name) {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 32) || 'workspace';
}

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  let userId = null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    userId = decoded.sub || decoded.user_id;
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT id, user_id, tenant_id, name, email, avatar_url, status, phone, timezone, notifications_enabled FROM profiles WHERE user_id = ? LIMIT 1',
    [userId]
  );
  const profile = rows[0] || null;
  req.userId = userId;
  req.tenantId = profile?.tenant_id ?? 't1';
  req.profile = profile;
  next();
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || !JWT_SECRET) {
    req.userId = null;
    req.tenantId = 't1';
    req.profile = null;
    return next();
  }
  jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      req.userId = null;
      req.tenantId = 't1';
      req.profile = null;
    } else {
      req.userId = decoded.sub || decoded.user_id;
      getPool().execute('SELECT id, user_id, tenant_id, name, email, avatar_url, status, phone, timezone, notifications_enabled FROM profiles WHERE user_id = ? LIMIT 1', [req.userId])
        .then(([r]) => {
          req.profile = r[0] || null;
          req.tenantId = req.profile?.tenant_id ?? 't1';
          next();
        })
        .catch(() => next());
    }
  });
}

/**
 * Full signup: create tenant, admin user, profile, and seed default modules/fields/dashboard.
 * @param {{ company_name: string, admin_name: string, email: string, password: string }}
 */
export async function registerUser({ company_name, admin_name, email, password }) {
  const pool = getPool();
  const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) return { error: 'Email already registered' };

  const subdomain = slugFromName(company_name);
  const [existingSub] = await pool.execute('SELECT id FROM tenants WHERE subdomain = ?', [subdomain]);
  if (existingSub.length) return { error: 'Subdomain already taken; try a different company name' };

  const tenantId = 't_' + crypto.randomBytes(8).toString('hex');
  const tenantName = (company_name || '').trim() || (admin_name || email.split('@')[0]) + "'s Workspace";
  await pool.execute(
    'INSERT INTO tenants (id, name, subdomain, plan, owner_id) VALUES (?, ?, ?, ?, ?)',
    [tenantId, tenantName, subdomain, 'free', null]
  );

  const userId = uuid();
  const password_hash = await bcrypt.hash(password, 10);
  const hasTenantRole = await hasUsersTenantRoleColumns(pool);
  if (hasTenantRole) {
    await pool.execute(
      'INSERT INTO users (id, tenant_id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, tenantId, email, password_hash, (admin_name || '').trim() || email.split('@')[0], 'admin']
    );
  } else {
    await pool.execute(
      'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
      [userId, email, password_hash, (admin_name || '').trim() || email.split('@')[0]]
    );
  }

  await pool.execute('UPDATE tenants SET owner_id = ? WHERE id = ?', [userId, tenantId]);

  const profileId = uuid();
  await pool.execute(
    'INSERT INTO profiles (id, user_id, tenant_id, name, email, status) VALUES (?, ?, ?, ?, ?, ?)',
    [profileId, userId, tenantId, (admin_name || '').trim() || email.split('@')[0], email, 'online']
  );

  await seedTenantDefaults(tenantId);

  return { userId, profileId, tenantId };
}

async function hasUsersTenantRoleColumns(pool) {
  try {
    const [rows] = await pool.execute("SHOW COLUMNS FROM users LIKE 'tenant_id'");
    return rows.length > 0;
  } catch {
    return false;
  }
}

export async function verifyPassword(email, password) {
  const pool = getPool();
  const [rows] = await pool.execute('SELECT id, password_hash FROM users WHERE email = ?', [email]);
  if (!rows.length) return null;
  const ok = await bcrypt.compare(password, rows[0].password_hash);
  return ok ? rows[0].id : null;
}
