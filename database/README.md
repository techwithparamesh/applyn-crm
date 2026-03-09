# Database (MySQL 8+)

One SQL file for the whole database: **`setup.sql`** (schema + seed).

## Setup

```bash
# 1. Create database (once)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Run the setup file
mysql -u root -p crm < database/setup.sql
```

**`setup.sql`** includes:

- **Schema** – All tables: users, tenants, profiles, roles, permissions, modules, module_fields, crm_records, pipelines, pipeline_stages, web_forms, form_sections, form_fields, template_categories, crm_templates, template_modules, template_fields, template_pipelines, template_pipeline_stages, teams, invitations, dashboards, email, automations, tasks, etc.
- **Seed** – Template categories, Sales CRM template (marketplace), and default modules (Leads, Contacts, Deals, Tasks) for tenant `t1`.

Safe to re-run: `CREATE TABLE IF NOT EXISTS` and seed uses `INSERT IGNORE` / fixed IDs where possible.

## Other files in this folder

| File | Description |
|------|-------------|
| **mysql_setup.md** | Detailed setup, env vars, and query patterns. |
| **MODULE_BUILDER_ARCHITECTURE.md** | Docs for the dynamic module/field system. |
| **MIGRATION_NOTES.md** | Reference for table list and type conversions. |
| **examples/api-records-mysql.example.js** | Example API script for records. |

## Env (`.env` in project root)

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=crm
JWT_SECRET=your-secret
VITE_API_URL=http://localhost:3001
PORT=3001
```
