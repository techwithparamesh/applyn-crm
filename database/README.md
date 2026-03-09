# Database (MySQL migration from PostgreSQL/Supabase)

This folder contains the **MySQL 8+** schema and migration docs for Applyn CRM, converted from the original PostgreSQL/Supabase schema.

## Files

| File | Description |
|------|-------------|
| **mysql_schema.sql** | Full MySQL schema: all `CREATE TABLE` statements in dependency order, with indexes and foreign keys. No RLS; tenant isolation is application-level. |
| **mysql_setup.md** | Setup guide: create DB, run schema, env vars, connection examples, replacing RLS and Postgres functions (`search_records`, `check_permission`, `get_user_tenant_id`), JSON usage, UUIDs. |
| **migrations/001_add_field_settings_and_form_tables.sql** | Adds `settings_json` to `module_fields`, and optional `web_forms`, `form_sections`, `form_fields` tables. Run once after initial schema. |
| **migrations/002_multi_tenant_saas.sql** | Multi-tenant SaaS: `tenants` (subdomain, plan, updated_at), `users` (tenant_id, role), `dashboard_widgets` (position_x/y, width, height). Run once for existing DBs; new installs use updated mysql_schema.sql. |
| **migrations/003_workspace_organization.sql** | Workspace organization: `permissions` (name, description), `team_members` (user_id, role), `invitations` (name, team_id), `users` (status), `crm_records` (owner_user_id, visibility). Run once for existing DBs. |
| **migrations/004_template_engine.sql** | Template engine & marketplace: `template_categories`, `crm_templates`, `template_modules`, `template_fields`, `template_pipelines`, `template_pipeline_stages`, `template_forms`, `template_form_fields`. Run once for new installs or after schema. |
| **seed_default_modules.sql** | Seeds default CRM modules (Leads, Contacts, Deals, Tasks) and their fields for tenant `t1`. Run once per tenant after schema. |
| **seed_templates.sql** | Seeds template categories and one Sales CRM template (modules, fields, pipeline stages). Run once after 004_template_engine. |
| **MODULE_BUILDER_ARCHITECTURE.md** | Dynamic CRM Module Builder: multi-tenant architecture, modules, fields, records, pipelines, forms. |
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
