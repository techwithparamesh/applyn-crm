# Database (MySQL migration from PostgreSQL/Supabase)

This folder contains the **MySQL 8+** schema and migration docs for Applyn CRM, converted from the original PostgreSQL/Supabase schema.

## Files

| File | Description |
|------|-------------|
| **mysql_schema.sql** | Full MySQL schema: all `CREATE TABLE` statements in dependency order, with indexes and foreign keys. No RLS; tenant isolation is application-level. |
| **mysql_setup.md** | Setup guide: create DB, run schema, env vars, connection examples, replacing RLS and Postgres functions (`search_records`, `check_permission`, `get_user_tenant_id`), JSON usage, UUIDs. |
| **MIGRATION_NOTES.md** | Migration reference: full table list, type conversions, removed features, example query conversions (Supabase client → MySQL parameterized SQL), and FK summary. |
| **examples/api-records-mysql.example.js** | Example Node.js (Express + mysql2) replacement for the Supabase api-records edge function: X-API-Key auth and CRUD on `crm_records` with tenant scoping. |

## Quick start (MySQL)

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Apply schema
mysql -u root -p crm < database/mysql_schema.sql
```

Then configure your app with a MySQL connection and follow **mysql_setup.md** for tenant isolation, function replacements, and JSON/query patterns.

## Differences at a glance

- **UUIDs:** Store as `CHAR(36)`; generate in application (e.g. `crypto.randomUUID()`).
- **JSON:** Use `JSON` type and `JSON_EXTRACT` / `JSON_UNQUOTE` / `JSON_CONTAINS` instead of `jsonb` and `->` / `->>`.
- **RLS:** Not available in MySQL; always add `WHERE tenant_id = ?` (and resolve tenant from your auth) in application queries.
- **Functions:** Implement `search_records`, `check_permission`, and `get_user_tenant_id` in your backend (see mysql_setup.md).
