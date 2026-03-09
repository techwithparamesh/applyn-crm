/**
 * Permission check: canUser(user_id, permission)
 * permission format: "module_name:action" e.g. "leads:view", "records:create"
 * Returns true if the user has at least one role that grants that permission.
 */

import { getPool } from './db.js';

/**
 * @param {string} userId
 * @param {string} permission - "module_name:action" e.g. "leads:view"
 * @returns {Promise<boolean>}
 */
export async function canUser(userId, permission) {
  if (!userId || !permission || typeof permission !== 'string') return false;
  const parts = permission.split(':');
  const moduleName = parts[0]?.trim();
  const action = parts[1]?.trim();
  if (!moduleName || !action) return false;

  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT 1 FROM user_roles ur
     INNER JOIN role_permissions rp ON rp.role_id = ur.role_id
     WHERE ur.user_id = ? AND rp.module_name = ? AND rp.action = ?
     LIMIT 1`,
    [userId, moduleName, action]
  );
  return rows.length > 0;
}

/**
 * Get all permission strings (module:action) for a user.
 * @param {string} userId
 * @returns {Promise<string[]>}
 */
export async function getUserPermissions(userId) {
  if (!userId) return [];
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT DISTINCT rp.module_name, rp.action FROM user_roles ur
     INNER JOIN role_permissions rp ON rp.role_id = ur.role_id
     WHERE ur.user_id = ?`,
    [userId]
  );
  return rows.map((r) => `${r.module_name}:${r.action}`);
}
