-- Seed default CRM modules for a tenant (run after mysql_schema.sql)
-- Default tenant_id: t1. Replace @tenant_id if needed. Run once per tenant.

SET @tenant_id = 't1';

-- Fixed IDs for default modules (idempotent: re-run skips existing)
SET @mod_leads    = 'a1000001-0000-0000-0000-000000000001';
SET @mod_contacts = 'a1000002-0000-0000-0000-000000000002';
SET @mod_deals    = 'a1000003-0000-0000-0000-000000000003';
SET @mod_tasks    = 'a1000004-0000-0000-0000-000000000004';

INSERT IGNORE INTO modules (id, tenant_id, name, slug, icon, color, description, is_system, order_index)
VALUES
  (@mod_leads,    @tenant_id, 'Leads',    'leads',    'Users',      '#7C3AED', 'Potential customers or opportunities', 1, 0),
  (@mod_contacts, @tenant_id, 'Contacts', 'contacts', 'Contact',    '#6366f1', 'People and companies', 1, 1),
  (@mod_deals,    @tenant_id, 'Deals',    'deals',    'Handshake',  '#10B981', 'Sales opportunities and pipeline', 1, 2),
  (@mod_tasks,    @tenant_id, 'Tasks',    'tasks',    'CheckSquare', '#F59E0B', 'To-dos and follow-ups', 1, 3);

-- Default fields for Leads (run after modules insert; run once)
INSERT INTO module_fields (id, module_id, tenant_id, name, label, field_type, is_required, options_json, order_index)
VALUES (REPLACE(UUID(),'-',''), @mod_leads, @tenant_id, 'full_name', 'Full Name', 'text', 1, NULL, 0),
       (REPLACE(UUID(),'-',''), @mod_leads, @tenant_id, 'email', 'Email', 'email', 1, NULL, 1),
       (REPLACE(UUID(),'-',''), @mod_leads, @tenant_id, 'phone', 'Phone', 'phone', 0, NULL, 2),
       (REPLACE(UUID(),'-',''), @mod_leads, @tenant_id, 'company', 'Company', 'text', 0, NULL, 3),
       (REPLACE(UUID(),'-',''), @mod_leads, @tenant_id, 'source', 'Source', 'select', 0, CAST('["Website","Referral","Cold Call","Other"]' AS JSON), 4);

-- Default fields for Contacts
INSERT INTO module_fields (id, module_id, tenant_id, name, label, field_type, is_required, options_json, order_index)
VALUES (REPLACE(UUID(),'-',''), @mod_contacts, @tenant_id, 'full_name', 'Full Name', 'text', 1, NULL, 0),
       (REPLACE(UUID(),'-',''), @mod_contacts, @tenant_id, 'email', 'Email', 'email', 1, NULL, 1),
       (REPLACE(UUID(),'-',''), @mod_contacts, @tenant_id, 'phone', 'Phone', 'phone', 0, NULL, 2);

-- Default fields for Deals
INSERT INTO module_fields (id, module_id, tenant_id, name, label, field_type, is_required, options_json, order_index)
VALUES (REPLACE(UUID(),'-',''), @mod_deals, @tenant_id, 'name', 'Deal Name', 'text', 1, NULL, 0),
       (REPLACE(UUID(),'-',''), @mod_deals, @tenant_id, 'amount', 'Amount', 'currency', 0, NULL, 1),
       (REPLACE(UUID(),'-',''), @mod_deals, @tenant_id, 'stage', 'Stage', 'select', 0, CAST('["New","Qualified","Proposal","Negotiation","Closed Won","Closed Lost"]' AS JSON), 2),
       (REPLACE(UUID(),'-',''), @mod_deals, @tenant_id, 'close_date', 'Close Date', 'date', 0, NULL, 3);

-- Default fields for Tasks
INSERT INTO module_fields (id, module_id, tenant_id, name, label, field_type, is_required, options_json, order_index)
VALUES (REPLACE(UUID(),'-',''), @mod_tasks, @tenant_id, 'subject', 'Subject', 'text', 1, NULL, 0),
       (REPLACE(UUID(),'-',''), @mod_tasks, @tenant_id, 'due_date', 'Due Date', 'date', 0, NULL, 1),
       (REPLACE(UUID(),'-',''), @mod_tasks, @tenant_id, 'status', 'Status', 'select', 0, CAST('["Pending","In Progress","Completed"]' AS JSON), 2);
