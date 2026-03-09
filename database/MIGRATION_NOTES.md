# PostgreSQL → MySQL Migration Notes

## List of Tables (Complete)

All tables present in the MySQL schema:

| # | Table | Notes |
|---|--------|--------|
| 1 | tenants | Root tenant; owner_id = app user id |
| 2 | profiles | user_id links to auth |
| 3 | roles | Per-tenant |
| 4 | permissions | Seed data (module + action) |
| 5 | role_permissions | FK → roles |
| 6 | user_roles | FK → roles |
| 7 | api_keys | API key auth |
| 8 | crm_records | Core records; `values` JSON |
| 9 | modules | Module definitions |
| 10 | module_fields | FK → modules |
| 11 | module_relationships | FK → modules (from/to) |
| 12 | record_tags | FK → crm_records |
| 13 | pipelines | Per-tenant, per module |
| 14 | pipeline_stages | FK → pipelines |
| 15 | email_accounts | OAuth-linked accounts |
| 16 | emails | FK → email_accounts |
| 17 | email_record_links | FK → emails |
| 18 | email_attachments | FK → emails |
| 19 | automations | Per-tenant, per module |
| 20 | automation_conditions | FK → automations |
| 21 | automation_actions | FK → automations |
| 22 | automation_logs | FK → automations, crm_records |
| 23 | import_jobs | Bulk import jobs |
| 24 | import_errors | FK → import_jobs |
| 25 | teams | Per-tenant |
| 26 | team_members | FK → teams, profiles |
| 27 | invitations | FK → roles (nullable) |
| 28 | tasks | FK → crm_records (nullable) |
| 29 | notes | FK → crm_records |
| 30 | files | FK → crm_records |
| 31 | dashboards | Per-tenant |
| 32 | dashboard_widgets | FK → dashboards |
| 33 | reports | Per-tenant |
| 34 | installed_templates | Per-tenant |
| 35 | whatsapp_accounts | WhatsApp Business |
| 36 | whatsapp_conversations | FK → whatsapp_accounts, crm_records |
| 37 | whatsapp_messages | FK → whatsapp_conversations |

---

## Type Conversions Applied

| PostgreSQL | MySQL |
|------------|--------|
| `uuid` | `CHAR(36)` |
| `uuid PRIMARY KEY DEFAULT gen_random_uuid()` | `CHAR(36) PRIMARY KEY` (app generates UUID) |
| `jsonb` | `JSON` |
| `timestamptz` | `TIMESTAMP` |
| `boolean` | `TINYINT(1)` |
| `text` | `TEXT` or `VARCHAR(n)` as appropriate |
| `serial` | `INT AUTO_INCREMENT` (not used in this schema) |
| `text[]` | `JSON` |
| `bigint` | `BIGINT` |

---

## Removed / Replaced Features

- **RLS policies** – Removed. Use `WHERE tenant_id = ?` (and optionally `user_id`) in every query.
- **Postgres extensions** – None required in schema; not used.
- **Supabase auth** – Replaced by your auth; store `user_id` and resolve `tenant_id` from `profiles`.
- **`search_records` function** – Implement in app: either fetch and filter in JS or use MySQL `JSON_SEARCH`/`CAST(... AS CHAR) LIKE` (see mysql_setup.md).
- **`check_permission` function** – Implement in app with a JOIN query (see mysql_setup.md).
- **`get_user_tenant_id` function** – Single-row SELECT on `profiles` by `user_id`.
- **Trigger `on_auth_user_created`** – Run equivalent logic in your signup flow (create tenant + profile).

---

## Updated Queries (Examples)

### crm_records – list by module

**Postgres (Supabase client):**
```js
supabase.from('crm_records').select('*').eq('module_id', moduleId).is('deleted_at', null).order('updated_at', { ascending: false })
```

**MySQL (parameterized):**
```sql
SELECT * FROM crm_records
WHERE tenant_id = ? AND module_id = ? AND deleted_at IS NULL
ORDER BY updated_at DESC
LIMIT ? OFFSET ?;
```

### crm_records – insert

**Postgres:**  
`supabase.from('crm_records').insert({ tenant_id, module_id, values, created_by }).select().single()`

**MySQL:**
```sql
INSERT INTO crm_records (id, tenant_id, module_id, `values`, created_by)
VALUES (?, ?, ?, ?, ?);
-- Then SELECT * FROM crm_records WHERE id = ?;
```
Use app-generated UUID for `id`.

### crm_records – update (partial JSON)

**Postgres:**  
`supabase.from('crm_records').update({ values: merged, updated_at }).eq('id', id).eq('tenant_id', tenantId)`

**MySQL:**  
Merge in app, then:
```sql
UPDATE crm_records SET `values` = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ? AND tenant_id = ?;
```

### crm_records – soft delete

**Postgres:**  
`supabase.from('crm_records').update({ deleted_at: new Date().toISOString() }).eq('id', id)`

**MySQL:**
```sql
UPDATE crm_records SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?;
```

### JSON field access (e.g. “email” inside `values`)

**Postgres:**  
`values->>'email'` or `values->'email'`

**MySQL:**  
`JSON_UNQUOTE(JSON_EXTRACT(\`values\`, '$.email'))` or `JSON_EXTRACT(\`values\`, '$.email')`

### Search in JSON (text in any key)

**Postgres:**  
`r."values"::text ILIKE '%' || _text_query || '%'`

**MySQL:**  
`CAST(\`values\` AS CHAR) LIKE CONCAT('%', ?, '%')`  
(For case-insensitive: `LOWER(CAST(\`values\` AS CHAR)) LIKE LOWER(CONCAT('%', ?, '%'))`)

---

## Foreign Key Summary

- **role_permissions** → roles(id)
- **user_roles** → roles(id)
- **module_fields** → modules(id)
- **module_relationships** → modules(id) (from_module_id, to_module_id)
- **record_tags** → crm_records(id)
- **pipeline_stages** → pipelines(id)
- **emails** → email_accounts(id)
- **email_record_links** → emails(id)
- **email_attachments** → emails(id)
- **automation_conditions** → automations(id)
- **automation_actions** → automations(id)
- **automation_logs** → automations(id), crm_records(id)
- **import_errors** → import_jobs(id)
- **team_members** → teams(id), profiles(id)
- **invitations** → roles(id)
- **tasks** → crm_records(id)
- **notes** → crm_records(id)
- **files** → crm_records(id)
- **dashboard_widgets** → dashboards(id)
- **whatsapp_conversations** → whatsapp_accounts(id), crm_records(id)
- **whatsapp_messages** → whatsapp_conversations(id)

All IDs are `CHAR(36)` (UUIDs) except `tenant_id` and similar identifiers that are `VARCHAR(64)`.
