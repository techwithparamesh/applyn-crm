-- Seed template categories and one Sales CRM template (run after 004_template_engine / template tables exist)
-- Uses UUID() for CHAR(36) id columns.

-- Categories
INSERT IGNORE INTO template_categories (id, name, icon, order_index) VALUES
(UUID(), 'Sales', 'TrendingUp', 0),
(UUID(), 'Healthcare', 'Heart', 1),
(UUID(), 'Real Estate', 'Home', 2),
(UUID(), 'Education', 'GraduationCap', 3),
(UUID(), 'Marketing', 'Megaphone', 4),
(UUID(), 'Finance', 'DollarSign', 5);

-- Get first category id for Sales
SET @cat_id = (SELECT id FROM template_categories WHERE name = 'Sales' LIMIT 1);

-- Sales CRM template
SET @tpl_id = UUID();
INSERT INTO crm_templates (id, name, category_id, description, icon, modules_count, is_public) VALUES
(@tpl_id, 'Sales CRM', @cat_id, 'Leads, Contacts, Deals and pipeline', 'TrendingUp', 3, 1);

SET @mod_leads = UUID();
SET @mod_contacts = UUID();
SET @mod_deals = UUID();
INSERT INTO template_modules (id, template_id, name, slug, icon, color, description, order_index) VALUES
(@mod_leads, @tpl_id, 'Leads', 'leads', 'Users', '#7C3AED', 'Track leads', 0),
(@mod_contacts, @tpl_id, 'Contacts', 'contacts', 'Contact', '#2563EB', 'Contact database', 1),
(@mod_deals, @tpl_id, 'Deals', 'deals', 'Handshake', '#16A34A', 'Deals pipeline', 2);

INSERT INTO template_fields (id, template_module_id, name, label, type, required, order_index) VALUES
(UUID(), @mod_leads, 'full_name', 'Full Name', 'text', 1, 0),
(UUID(), @mod_leads, 'email', 'Email', 'email', 1, 1),
(UUID(), @mod_leads, 'phone', 'Phone', 'phone', 0, 2),
(UUID(), @mod_contacts, 'name', 'Name', 'text', 1, 0),
(UUID(), @mod_contacts, 'email', 'Email', 'email', 1, 1),
(UUID(), @mod_deals, 'deal_name', 'Deal Name', 'text', 1, 0),
(UUID(), @mod_deals, 'amount', 'Amount', 'currency', 1, 1),
(UUID(), @mod_deals, 'stage', 'Stage', 'select', 1, 2);

SET @pipe_id = UUID();
INSERT INTO template_pipelines (id, template_module_id, name) VALUES (@pipe_id, @mod_deals, 'Sales Pipeline');
INSERT INTO template_pipeline_stages (id, pipeline_id, name, color, order_index) VALUES
(UUID(), @pipe_id, 'Lead', '#6B7280', 0),
(UUID(), @pipe_id, 'Qualified', '#3B82F6', 1),
(UUID(), @pipe_id, 'Proposal', '#8B5CF6', 2),
(UUID(), @pipe_id, 'Negotiation', '#F59E0B', 3),
(UUID(), @pipe_id, 'Closed Won', '#10B981', 4),
(UUID(), @pipe_id, 'Closed Lost', '#EF4444', 5);
