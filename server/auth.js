import jwt from 'jsonwebtoken';
import { getPool } from './db.js';

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  let userId = null;
  if (JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
      userId = decoded.sub || decoded.user_id;
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } else {
    return res.status(401).json({ error: 'Server auth not configured (JWT_SECRET)' });
  }
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT id, tenant_id, name, email, avatar_url, status, phone, timezone FROM profiles WHERE user_id = ? LIMIT 1',
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
      getPool().execute('SELECT id, tenant_id, name, email, avatar_url, status, phone, timezone FROM profiles WHERE user_id = ? LIMIT 1', [req.userId])
        .then(([r]) => {
          req.profile = r[0] || null;
          req.tenantId = req.profile?.tenant_id ?? 't1';
          next();
        })
        .catch(() => next());
    }
  });
}
