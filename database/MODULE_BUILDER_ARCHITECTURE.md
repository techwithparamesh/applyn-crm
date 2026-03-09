# Dynamic CRM Module Builder — Architecture

This document describes the **multi-tenant Dynamic CRM Module Builder** used by Applyn CRM. The system allows each tenant (company) to define its own modules, fields, forms, pipelines, and records—similar to Zoho CRM, HubSpot, and Salesforce.

---

## 1. Core concept

The CRM does **not** use fixed modules. Users create **modules** dynamically (e.g. Loan Applications, Properties, Patients). Each module defines a record type and its structure (fields). All record data is stored in a flexible **values** JSON column keyed by field name.

---

## 2. Multi-tenant isolation

- Every core table includes **tenant_id**.
- All API and UI operations must be scoped by the current tenant (from auth/session).
- Data is isolated per company; no cross-tenant access.

**Tables with tenant_id:**  
`tenants`, `modules`, `module_fields`, `module_relationships`, `crm_records`, `pipelines`, `pipeline_stages`, `automations`, `dashboards`, `dashboard_widgets`, and other workspace-scoped tables.

---

## 3. Database architecture (summary)

| Table | Purpose |
|-------|--------|
| **tenants** | Companies / workspaces (id, name, created_at). |
| **modules** | Record types (id, tenant_id, name, slug, icon, color, description, order_index). |
| **module_fields** | Field definitions per module (name, label, type, required, options_json, **settings_json**, order_index). |
| **form_sections** | Optional form section definitions (title, description, layout, order_index). |
| **form_fields** / **web_forms** | Optional form builder persistence; app can also use JSON on web_forms (fields_json, sections_json, layout_order). |
| **crm_records** | Records (tenant_id, module_id, **values** JSON, created_at, updated_at). |
| **module_relationships** | Links between modules (from_module_id, to_module_id, relation_type). |
| **pipelines** | Per-module pipelines (e.g. sales pipeline). |
| **pipeline_stages** | Stages per pipeline (name, color, order_index). |
| **automations** | Triggers and actions (trigger_type, etc.). |
| **dashboards** / **dashboard_widgets** | Dashboard layout and widget config (widget_type, config_json, position, size). |

---

## 4. Field types (module_fields)

Supported **field_type** values include:  
Text, Textarea, Email, Phone, Number, Currency, Percentage, URL, Dropdown, MultiSelect, Checkbox, Radio, Date, DateTime, Time, FileUpload, ImageUpload, Address, Location, User, Lookup.

**settings_json** can store: placeholder, default_value, help_text, min_length, max_length, regex (validation rules).

---

## 5. Record storage (crm_records)

Records store dynamic key-value data in **values** JSON, e.g.:

```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "loan_amount": 500000
}
```

Field names in `values` match **module_fields.name** for that module. The app validates and renders using module field definitions.

---

## 6. UI / flows

- **Module Builder:** `/settings/modules` — Create, edit, delete modules (name, icon, color, description).
- **Field Builder:** Inside each module — Add/edit/delete fields (label, type, required, placeholder, default value, validation).
- **Form Builder:** Per-module forms — Left: add fields; Center: layout (sections, drag-drop); Right: field settings. Supports sections, two-column layout, dividers, headings.
- **Records:** Table, List, Kanban, Calendar views; create/edit records with dynamic values.
- **Pipelines:** Create pipelines and stages; drag records between stages.
- **Relationships:** Link modules; show related records on record pages.
- **Automations:** Triggers (e.g. Record Created, Stage Changed), actions (Assign Owner, Send Email, Create Task).
- **Dashboards:** Widgets (KPI, Chart, Table, Activity, Tasks); Recharts for charts; optional react-grid-layout for drag-drop.

---

## 7. Default modules (seed)

When a workspace is created (or via **seed_default_modules.sql**), seed:

- **Leads** — full_name, email, phone, company, source  
- **Contacts** — full_name, email, phone  
- **Deals** — name, amount, stage, close_date  
- **Tasks** — subject, due_date, status  

Each has default fields; tenants can add more modules and fields.

---

## 8. Files reference

- **Schema:** `database/mysql_schema.sql`  
- **Migration (settings_json, form tables):** `database/migrations/001_add_field_settings_and_form_tables.sql`  
- **Default seed:** `database/seed_default_modules.sql`  
- **Module Builder UI:** `src/pages/settings/ModuleBuilderPage.tsx`  
- **Field Builder:** `src/components/FieldBuilder.tsx`  
- **Form Builder:** `src/pages/FormBuilderPage.tsx`  
- **Field types config:** `src/lib/field-types.ts`  
- **API (modules/fields):** `server/index.js` (e.g. `/api/modules`, `/api/module_fields`)
