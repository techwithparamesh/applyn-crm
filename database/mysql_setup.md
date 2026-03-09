# MySQL Setup & Migration Guide

This guide explains how to run the CRM against **MySQL 8+** instead of PostgreSQL/Supabase. The schema and application patterns are adapted for MySQL compatibility.

---

## 1. Create the database

```bash
mysql -u root -p -e "CREATE DATABASE crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Or from the MySQL shell:

```sql
CREATE DATABASE crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crm;
```

---

## 2. Run the schema

Apply the schema file (run from the project root):

```bash
mysql -u root -p crm < database/mysql_schema.sql
```

Or from the MySQL shell:

```sql
USE crm;
SOURCE /path/to/applyn-crm/database/mysql_schema.sql;
```

---

## 3. Environment variables

Use a MySQL connection instead of Supabase. Example:

```env
# MySQL (replace Supabase URL/keys when using MySQL backend)
DATABASE_URL=mysql://user:password@localhost:3306/crm

# Or separate vars for your app
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=crm_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=crm
```

Create a dedicated user (optional):

```sql
CREATE USER 'crm_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON crm.* TO 'crm_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 4. Connection examples

### Node.js (mysql2)

```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});
```

### Node.js (with Promise wrapper)

```javascript
const [rows] = await pool.execute(
  'SELECT * FROM crm_records WHERE tenant_id = ? AND module_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT ? OFFSET ?',
  [tenantId, moduleId, limit, offset]
);
```

---

## 5. Tenant isolation (replacing RLS)

PostgreSQL Row Level Security (RLS) is **not** available in MySQL. Enforce tenant isolation in your application:

- **Every query** that reads or writes tenant-scoped data must include `tenant_id` in the `WHERE` clause (or in the `INSERT`/`UPDATE` payload).
- Resolve the current user’s `tenant_id` from your auth/session (e.g. from `profiles` by `user_id`) and pass it into all data access functions.

Example:

```sql
-- List records (always filter by tenant_id)
SELECT * FROM crm_records
WHERE tenant_id = ? AND module_id = ? AND deleted_at IS NULL
ORDER BY updated_at DESC
LIMIT ? OFFSET ?;

-- Update (always scope by tenant_id)
UPDATE crm_records
SET `values` = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ? AND tenant_id = ?;

-- Delete (soft delete)
UPDATE crm_records SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?;
```

Use parameterized queries (e.g. `?` placeholders) for all user/tenant input to avoid SQL injection.

---

## 6. Replacing PostgreSQL functions

### 6.1 `search_records`

The Postgres function `search_records(_tenant_id, _filters, _text_query, _module_id, _limit_val, _offset_val)` does a text search over `crm_records.values` (JSONB). In MySQL you have two options.

**Option A – Application-side search (recommended for small/medium data):**

1. Fetch records for the tenant (and optional `module_id`) with a reasonable limit.
2. Filter in JavaScript by matching `textQuery` against `values` (e.g. `Object.values(record.values).some(v => String(v).toLowerCase().includes(textQuery))`).

**Option B – MySQL JSON and LIKE:**

```sql
SELECT id, module_id, tenant_id, `values`, created_at, updated_at
FROM crm_records
WHERE tenant_id = ?
  AND (_module_id IS NULL OR module_id = _module_id)
  AND (deleted_at IS NULL)
  AND (
    _text_query = ''
    OR JSON_UNQUOTE(JSON_SEARCH(`values`, 'one', CONCAT('%', _text_query, '%'), NULL, '$.*')) IS NOT NULL
    OR CAST(`values` AS CHAR) LIKE CONCAT('%', _text_query, '%')
  )
ORDER BY updated_at DESC
LIMIT _limit_val OFFSET _offset_val;
```

Use parameterized placeholders for `_tenant_id`, `_module_id`, `_text_query`, `_limit_val`, `_offset_val`. For more complex filters (e.g. `_filters`), build the `WHERE` clause in application code and execute a parameterized query.

### 6.2 `check_permission`

Implemented in Postgres as a security definer function. In MySQL, implement the same logic in your API/service layer:

```javascript
async function checkPermission(userId, moduleName, action) {
  const [rows] = await pool.execute(
    `SELECT 1 FROM user_roles ur
     INNER JOIN role_permissions rp ON rp.role_id = ur.role_id
     WHERE ur.user_id = ? AND rp.module_name = ? AND rp.action = ? LIMIT 1`,
    [userId, moduleName, action]
  );
  return rows.length > 0;
}
```

### 6.3 `get_user_tenant_id`

Replace with a simple query in your app:

```sql
SELECT tenant_id FROM profiles WHERE user_id = ? LIMIT 1;
```

---

## 7. JSON column usage (Postgres → MySQL)

| Postgres | MySQL |
|----------|--------|
| `values->>'email'` | `JSON_UNQUOTE(JSON_EXTRACT(values, '$.email'))` |
| `values->'email'` | `JSON_EXTRACT(values, '$.email')` |
| `values @> '{"status":"won"}'` | `JSON_CONTAINS(values, '{"status":"won"}', '$')` |
| `values::text ILIKE '%foo%'` | `CAST(values AS CHAR) LIKE '%foo%'` (no ILIKE; use LOWER() if case-insensitive) |

Use parameterized queries when building JSON paths or search strings (e.g. pass `?` for the key or the search term).

---

## 8. UUIDs and generated keys

- Postgres used `gen_random_uuid()`. In MySQL there is no built-in UUID type; we use **CHAR(36)** and generate UUIDs in the application (e.g. Node: `crypto.randomUUID()`, or `uuid` package).
- For `api_keys.api_key`, generate a secure random string (e.g. `'ak_' + crypto.randomBytes(24).toString('hex')`) and insert it explicitly.

---

## 9. Tables list (reference)

| Table | Purpose |
|-------|---------|
| tenants | Workspace/tenant root |
| profiles | User profile and tenant link |
| roles | Role definitions per tenant |
| permissions | Global permission definitions (module + action) |
| role_permissions | Role ↔ permission mapping |
| user_roles | User ↔ role per tenant |
| api_keys | API key auth per tenant |
| crm_records | Core CRM records (EAV-style `values` JSON) |
| modules | Module definitions |
| module_fields | Field definitions per module |
| module_relationships | Links between modules |
| record_tags | Tags on records |
| pipelines | Pipeline definitions |
| pipeline_stages | Stages per pipeline |
| email_accounts | Connected email accounts |
| emails | Email messages |
| email_record_links | Email ↔ record link |
| email_attachments | Attachments per email |
| automations | Automation definitions |
| automation_conditions | Conditions per automation |
| automation_actions | Actions per automation |
| automation_logs | Automation run log |
| import_jobs | Import job metadata |
| import_errors | Per-row import errors |
| teams | Teams per tenant |
| team_members | Team ↔ profile |
| invitations | Pending invites |
| tasks | Tasks (optional record link) |
| notes | Notes on records |
| files | File metadata on records |
| dashboards | Dashboard definitions |
| dashboard_widgets | Widgets per dashboard |
| reports | Report definitions |
| installed_templates | Installed template slugs per tenant |
| whatsapp_accounts | WhatsApp Business accounts |
| whatsapp_conversations | Conversations (optional record link) |
| whatsapp_messages | Messages per conversation |

---

## 10. Differences: PostgreSQL vs MySQL

| Aspect | PostgreSQL (Supabase) | MySQL 8+ |
|--------|------------------------|----------|
| UUID | `uuid` type, `gen_random_uuid()` | `CHAR(36)`, app-generated UUIDs |
| JSON | `jsonb`, `->`, `->>`, `@>` | `JSON`, `JSON_EXTRACT`, `JSON_UNQUOTE`, `JSON_CONTAINS` |
| Timestamps | `timestamptz`, `now()` | `TIMESTAMP`, `CURRENT_TIMESTAMP` |
| Booleans | `boolean` | `TINYINT(1)` |
| RLS | Policies on tables | No RLS; enforce `tenant_id` in app |
| Functions | `search_records`, `check_permission`, `get_user_tenant_id` | Implement in application or raw SQL as above |
| Auth | Supabase Auth + `auth.uid()` | Your auth; store `user_id` and resolve `tenant_id` from `profiles` |

---

## 11. Backend API when using MySQL

The current frontend uses **Supabase client** (`@supabase/supabase-js`) for all data access. To run on MySQL you need a **backend API** (e.g. Node/Express, Next.js API routes, or serverless) that:

1. Connects to MySQL with the credentials above.
2. Authenticates users (your auth provider) and resolves `tenant_id` (e.g. from `profiles`).
3. Exposes REST or GraphQL endpoints that mirror the current Supabase usage (e.g. list/insert/update/delete for `crm_records`, `modules`, `profiles`, etc.).
4. Enforces tenant isolation on every query using the resolved `tenant_id`.
5. Implements `search_records` and `check_permission` logic as described in sections 6 and 7.

The provided **mysql_schema.sql** and this guide give you the schema and patterns; the actual API layer and replacement of Supabase client calls in the frontend are left to your stack and deployment choices.
