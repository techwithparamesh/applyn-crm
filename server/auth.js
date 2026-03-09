import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getPool, uuid } from './db.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'change-me-in-production';

export function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });
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

export async function registerUser(email, password, name) {
  const pool = getPool();
  const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) return { error: 'Email already registered' };
  const userId = uuid();
  const password_hash = await bcrypt.hash(password, 10);
  await pool.execute(
    'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
    [userId, email, password_hash, name || email.split('@')[0]]
  );
  const tenantId = 't_' + crypto.randomBytes(8).toString('hex');
  await pool.execute('INSERT INTO tenants (id, name, owner_id) VALUES (?, ?, ?)', [
    tenantId,
    (name || email.split('@')[0]) + "'s Workspace",
    userId,
  ]);
  const profileId = uuid();
  await pool.execute(
    'INSERT INTO profiles (id, user_id, tenant_id, name, email, status) VALUES (?, ?, ?, ?, ?, ?)',
    [profileId, userId, tenantId, name || email.split('@')[0], email, 'online']
  );
  return { userId, profileId, tenantId };
}

export async function verifyPassword(email, password) {
  const pool = getPool();
  const [rows] = await pool.execute('SELECT id, password_hash FROM users WHERE email = ?', [email]);
  if (!rows.length) return null;
  const ok = await bcrypt.compare(password, rows[0].password_hash);
  return ok ? rows[0].id : null;
}
