-- Applyn CRM - MySQL 8+ Schema
-- Converted from PostgreSQL/Supabase. RLS removed; enforce tenant_id in application queries.
-- UUIDs stored as CHAR(36). JSON columns use MySQL JSON type.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- Users (local auth; password_hash from bcrypt)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(64) NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT '',
  role VARCHAR(32) NOT NULL DEFAULT 'user' COMMENT 'admin, manager, user',
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_email (email),
  INDEX idx_users_email (email),
  INDEX idx_users_tenant (tenant_id)
);

-- ---------------------------------------------------------------------------
-- Tenants (owner_id references users.id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL DEFAULT '',
  subdomain VARCHAR(64) NULL,
  plan VARCHAR(32) NOT NULL DEFAULT 'free',
  owner_id CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_tenants_subdomain (subdomain),
  INDEX idx_tenants_subdomain (subdomain)
);

-- ---------------------------------------------------------------------------
-- Profiles (user_id references users.id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  user_id VARCHAR(255) NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT '',
  avatar_url TEXT NULL,
  phone VARCHAR(64) DEFAULT '',
  timezone VARCHAR(64) DEFAULT 'UTC',
  notifications_enabled TINYINT(1) DEFAULT 1,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_profiles_tenant (tenant_id),
  INDEX idx_profiles_email (email),
  INDEX idx_profiles_user_id (user_id)
);

-- ---------------------------------------------------------------------------
-- Roles & RBAC
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id CHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_roles_tenant_name (tenant_id, name),
  INDEX idx_roles_tenant (tenant_id)
);

CREATE TABLE IF NOT EXISTS permissions (
  id CHAR(36) PRIMARY KEY,
  module_name VARCHAR(255) NOT NULL,
  action VARCHAR(32) NOT NULL,
  name VARCHAR(255) NULL COMMENT 'e.g. module:action',
  description TEXT NULL,
  UNIQUE KEY uk_permissions_module_action (module_name, action),
  CONSTRAINT chk_permissions_action CHECK (action IN ('view', 'create', 'edit', 'delete', 'export', 'import'))
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id CHAR(36) PRIMARY KEY,
  role_id CHAR(36) NOT NULL,
  module_name VARCHAR(255) NOT NULL,
  action VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_role_permissions (role_id, module_name, action),
  CONSTRAINT chk_rp_action CHECK (action IN ('view', 'create', 'edit', 'delete', 'export', 'import')),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  INDEX idx_role_permissions_role (role_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  id CHAR(36) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  role_id CHAR(36) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_roles (user_id, role_id),
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  INDEX idx_user_roles_tenant (tenant_id),
  INDEX idx_user_roles_user (user_id)
);

-- ---------------------------------------------------------------------------
-- API Keys
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
  id CHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  key_name VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP NULL,
  UNIQUE KEY uk_api_keys_key (api_key),
  INDEX idx_api_keys_tenant (tenant_id)
);

-- ---------------------------------------------------------------------------
-- CRM Records (core entity table)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_records (
  id CHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  module_id VARCHAR(64) NOT NULL,
  owner_user_id VARCHAR(255) NULL,
  visibility VARCHAR(32) NOT NULL DEFAULT 'organization' COMMENT 'private | team | organization',
  `values` JSON NOT NULL,
  created_by VARCHAR(255) NOT NULL DEFAULT 'API',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_crm_records_tenant (tenant_id),
  INDEX idx_crm_records_module (module_id),
  INDEX idx_crm_records_module_tenant (module_id, tenant_id),
  INDEX idx_crm_records_owner (owner_user_id),
  INDEX idx_crm_records_updated (updated_at DESC),
  INDEX idx_crm_records_deleted (deleted_at)
);

-- ---------------------------------------------------------------------------
-- Modules & Fields
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS modules (
  id CHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  icon VARCHAR(64) NOT NULL DEFAULT 'Boxes',
  color VARCHAR(32) NOT NULL DEFAULT '#7C3AED',
  description TEXT NULL,
  is_system TINYINT(1) NOT NULL DEFAULT 0,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_modules_tenant (tenant_id)
);

CREATE TABLE IF NOT EXISTS module_fields (
  id CHAR(36) PRIMARY KEY,
  module_id CHAR(36) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  name VARCHAR(255) NOT NULL,
  label VARCHAR(255) NOT NULL,
  field_type VARCHAR(64) NOT NULL DEFAULT 'text',
  is_required TINYINT(1) NOT NULL DEFAULT 0,
  options_json JSON DEFAULT NULL,
  settings_json JSON DEFAULT NULL COMMENT 'placeholder, default_value, min_length, max_length, regex, etc.',
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_module_fields_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  INDEX idx_module_fields_module (module_id)
);

CREATE TABLE IF NOT EXISTS module_relationships (
  id CHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  from_module_id CHAR(36) NOT NULL,
  to_module_id CHAR(36) NOT NULL,
  relationship_type VARCHAR(64) NOT NULL DEFAULT 'one_to_many',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_module_rel_from FOREIGN KEY (from_module_id) REFERENCES modules(id) ON DELETE CASCADE,
  CONSTRAINT fk_module_rel_to FOREIGN KEY (to_module_id) REFERENCES modules(id) ON DELETE CASCADE,
  INDEX idx_module_relationships_from (from_module_id),
  INDEX idx_module_relationships_to (to_module_id)
);

-- ---------------------------------------------------------------------------
-- Record Tags (FK to crm_records)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS record_tags (
  id CHAR(36) PRIMARY KEY,
  record_id CHAR(36) NOT NULL,
  tag VARCHAR(255) NOT NULL,
  color VARCHAR(32) NOT NULL DEFAULT 'blue',
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_record_tags_record_tag (record_id, tag),
  CONSTRAINT fk_record_tags_record FOREIGN KEY (record_id) REFERENCES crm_records(id) ON DELETE CASCADE,
  INDEX idx_record_tags_record (record_id)
);

-- ---------------------------------------------------------------------------
-- Pipelines
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pipelines (
  id CHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  module_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pipelines_module (module_id),
  INDEX idx_pipelines_module_tenant (module_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id CHAR(36) PRIMARY KEY,
  pipeline_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(32) NOT NULL DEFAULT '#6B7280',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pipeline_stages_pipeline FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE,
  INDEX idx_pipeline_stages_pipeline (pipeline_id),
  INDEX idx_pipeline_stages_pipeline_pos (pipeline_id, position)
);

-- ---------------------------------------------------------------------------
-- Email
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_accounts (
  id CHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  user_id VARCHAR(255) NOT NULL,
  provider VARCHAR(32) NOT NULL,
  email_address VARCHAR(255) NOT NULL,
  access_token TEXT NULL,
  refresh_token TEXT NULL,
  token_expiry TIMESTAMP NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_sync_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_email_accounts_provider CHECK (provider IN ('gmail', 'outlook')),
  UNIQUE KEY uk_email_accounts_tenant_email (tenant_id, email_address),
  INDEX idx_email_accounts_tenant (tenant_id)
);

CREATE TABLE IF NOT EXISTS emails (
  id CHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  account_id CHAR(36) NOT NULL,
  provider_message_id VARCHAR(512) NULL,
  subject VARCHAR(1024) NOT NULL DEFAULT '',
  body_html LONGTEXT NULL,
  body_text LONGTEXT NULL,
  from_email VARCHAR(255) NOT NULL,
  to_emails JSON NOT NULL DEFAULT (CAST('[]' AS JSON)),
  cc_emails JSON NOT NULL DEFAULT (CAST('[]' AS JSON)),
  bcc_emails JSON NOT NULL DEFAULT (CAST('[]' AS JSON)),
  thread_id VARCHAR(512) NULL,
  direction VARCHAR(16) NOT NULL DEFAULT 'incoming',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  is_starred TINYINT(1) NOT NULL DEFAULT 0,
  is_opened TINYINT(1) NOT NULL DEFAULT 0,
  opened_at TIMESTAMP NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_emails_direction CHECK (direction IN ('incoming', 'outgoing')),
  UNIQUE KEY uk_emails_account_provider_msg (account_id, provider_message_id(255)),
  CONSTRAINT fk_emails_account FOREIGN KEY (account_id) REFERENCES email_accounts(id) ON DELETE CASCADE,
  INDEX idx_emails_thread (thread_id(255)),
  INDEX idx_emails_from (from_email),
  INDEX idx_emails_account (account_id),
  INDEX idx_emails_sent_at (sent_at DESC)
);

CREATE TABLE IF NOT EXISTS email_record_links (
  id CHAR(36) PRIMARY KEY,
  email_id CHAR(36) NOT NULL,
  record_id VARCHAR(255) NOT NULL,
  module_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_email_record_links_email FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE,
  INDEX idx_email_record_links_email (email_id),
  INDEX idx_email_record_links_record (record_id)
);

CREATE TABLE IF NOT EXISTS email_attachments (
  id CHAR(36) PRIMARY KEY,
  email_id CHAR(36) NOT NULL,
  file_name VARCHAR(512) NOT NULL,
  file_url TEXT NULL,
  content_type VARCHAR(128) NULL,
  size INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_email_attachments_email FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE,
  INDEX idx_email_attachments_email (email_id)
);

-- ---------------------------------------------------------------------------
-- Automations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS automations (
  id CHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  name VARCHAR(255) NOT NULL,
  module_id VARCHAR(64) NOT NULL,
  trigger_event VARCHAR(64) NOT NULL DEFAULT 'record_created',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_automations_tenant (tenant_id),
  INDEX idx_automations_module (module_id)
);

CREATE TABLE IF NOT EXISTS automation_conditions (
  id CHAR(36) PRIMARY KEY,
  automation_id CHAR(36) NOT NULL,
  field_name VARCHAR(255) NOT NULL,
  operator VARCHAR(64) NOT NULL DEFAULT 'equals',
  value TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_automation_conditions_automation FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE,
  INDEX idx_automation_conditions_automation (automation_id)
);

CREATE TABLE IF NOT EXISTS automation_actions (
  id CHAR(36) PRIMARY KEY,
  automation_id CHAR(36) NOT NULL,
  action_type VARCHAR(64) NOT NULL,
  action_config JSON NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_automation_actions_automation FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE,
  INDEX idx_automation_actions_automation (automation_id)
);

CREATE TABLE IF NOT EXISTS automation_logs (
  id CHAR(36) PRIMARY KEY,
  automation_id CHAR(36) NOT NULL,
  record_id CHAR(36) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'success',
  details JSON NOT NULL,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_automation_logs_automation FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE,
  CONSTRAINT fk_automation_logs_record FOREIGN KEY (record_id) REFERENCES crm_records(id) ON DELETE SET NULL,
  INDEX idx_automation_logs_automation (automation_id),
  INDEX idx_automation_logs_record (record_id)
);

-- ---------------------------------------------------------------------------
-- Import
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS import_jobs (
  id CHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  module_id VARCHAR(64) NOT NULL,
  file_name VARCHAR(512) NOT NULL DEFAULT '',
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  total_rows INT NOT NULL DEFAULT 0,
  processed_rows INT NOT NULL DEFAULT 0,
  success_rows INT NOT NULL DEFAULT 0,
  failed_rows INT NOT NULL DEFAULT 0,
  column_mapping JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  INDEX idx_import_jobs_tenant (tenant_id)
);

CREATE TABLE IF NOT EXISTS import_errors (
  id CHAR(36) PRIMARY KEY,
  job_id CHAR(36) NOT NULL,
  `row_number` INT NOT NULL,
  `row_data` JSON NULL,
  error_message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_import_errors_job FOREIGN KEY (job_id) REFERENCES import_jobs(id) ON DELETE CASCADE,
  INDEX idx_import_errors_job (job_id)
);

-- ---------------------------------------------------------------------------
-- Teams & Invitations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
  id CHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_teams_tenant (tenant_id)
);

CREATE TABLE IF NOT EXISTS team_members (
  id CHAR(36) PRIMARY KEY,
  team_id CHAR(36) NOT NULL,
  user_id VARCHAR(255) NULL,
  profile_id CHAR(36) NULL,
  role VARCHAR(32) NULL DEFAULT 'member',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_team_members_team_user (team_id, user_id),
  CONSTRAINT fk_team_members_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT fk_team_members_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_team_members_team (team_id),
  INDEX idx_team_members_profile (profile_id),
  INDEX idx_team_members_user (user_id)
);

CREATE TABLE IF NOT EXISTS invitations (
  id CHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NULL,
  role_id CHAR(36) NULL,
  team_id CHAR(36) NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accepted TINYINT(1) NOT NULL DEFAULT 0,
  invited_by VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_invitations_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
  INDEX idx_invitations_token (token),
  INDEX idx_invitations_email (email),
  INDEX idx_invitations_tenant (tenant_id),
  INDEX idx_invitations_team (team_id)
);

-- ---------------------------------------------------------------------------
-- Tasks, Notes, Files
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id CHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  record_id CHAR(36) NULL,
  title VARCHAR(512) NOT NULL,
  description TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'todo',
  priority VARCHAR(32) NOT NULL DEFAULT 'medium',
  due_date DATE NULL,
  assigned_to VARCHAR(255) NULL,
  created_by VARCHAR(255) NOT NULL DEFAULT 'User',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_record FOREIGN KEY (record_id) REFERENCES crm_records(id) ON DELETE SET NULL,
  INDEX idx_tasks_tenant (tenant_id),
  INDEX idx_tasks_record (record_id)
);

CREATE TABLE IF NOT EXISTS notes (
  id CHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  record_id CHAR(36) NOT NULL,
  content TEXT NOT NULL,
  created_by VARCHAR(255) NOT NULL DEFAULT 'User',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notes_record FOREIGN KEY (record_id) REFERENCES crm_records(id) ON DELETE CASCADE,
  INDEX idx_notes_record (record_id)
);

CREATE TABLE IF NOT EXISTS files (
  id CHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  record_id CHAR(36) NOT NULL,
  file_name VARCHAR(512) NOT NULL,
  file_url VARCHAR(2048) NOT NULL,
  file_size INT NOT NULL DEFAULT 0,
  uploaded_by VARCHAR(255) NOT NULL DEFAULT 'User',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_files_record FOREIGN KEY (record_id) REFERENCES crm_records(id) ON DELETE CASCADE,
  INDEX idx_files_record (record_id)
);

-- ---------------------------------------------------------------------------
-- Dashboards & Reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dashboards (
  id CHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dashboards_tenant (tenant_id)
);

CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id CHAR(36) PRIMARY KEY,
  dashboard_id CHAR(36) NOT NULL,
  widget_type VARCHAR(64) NOT NULL DEFAULT 'metric_card',
  config_json JSON NOT NULL,
  position_x INT NOT NULL DEFAULT 0,
  position_y INT NOT NULL DEFAULT 0,
  width INT NOT NULL DEFAULT 4,
  height INT NOT NULL DEFAULT 1,
  order_index INT NOT NULL DEFAULT 0,
  col_span INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dashboard_widgets_dashboard FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE,
  INDEX idx_dashboard_widgets_dashboard (dashboard_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id CHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  name VARCHAR(255) NOT NULL,
  module_id VARCHAR(64) NOT NULL,
  filters_json JSON NOT NULL,
  group_by VARCHAR(255) NOT NULL DEFAULT '',
  metrics JSON NOT NULL,
  chart_type VARCHAR(64) NOT NULL DEFAULT 'bar',
  schedule_email VARCHAR(255) NULL,
  schedule_cron VARCHAR(128) NULL,
  is_dashboard_widget TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reports_tenant_module (tenant_id, module_id)
);

-- ---------------------------------------------------------------------------
-- Templates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS installed_templates (
  id CHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  template_slug VARCHAR(255) NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  template_id CHAR(36) NULL,
  installed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_installed_templates (tenant_id, template_slug),
  INDEX idx_installed_templates_tenant (tenant_id),
  INDEX idx_installed_templates_template (template_id)
);

-- ---------------------------------------------------------------------------
-- Template Engine & Marketplace
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS template_categories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(64) NULL DEFAULT 'Boxes',
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_template_categories_order (order_index)
);

CREATE TABLE IF NOT EXISTS crm_templates (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id CHAR(36) NULL,
  description TEXT NULL,
  icon VARCHAR(64) NULL DEFAULT 'Boxes',
  modules_count INT NOT NULL DEFAULT 0,
  is_public TINYINT(1) NOT NULL DEFAULT 1,
  created_by VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_crm_templates_category (category_id),
  INDEX idx_crm_templates_public (is_public)
);

CREATE TABLE IF NOT EXISTS template_modules (
  id CHAR(36) PRIMARY KEY,
  template_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  icon VARCHAR(64) NULL DEFAULT 'Boxes',
  color VARCHAR(32) NULL DEFAULT '#7C3AED',
  description TEXT NULL,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_template_modules_template (template_id),
  CONSTRAINT fk_template_modules_template FOREIGN KEY (template_id) REFERENCES crm_templates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS template_fields (
  id CHAR(36) PRIMARY KEY,
  template_module_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  label VARCHAR(255) NOT NULL,
  type VARCHAR(64) NOT NULL DEFAULT 'text',
  settings_json JSON NULL,
  required TINYINT(1) NOT NULL DEFAULT 0,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_template_fields_module (template_module_id),
  CONSTRAINT fk_template_fields_module FOREIGN KEY (template_module_id) REFERENCES template_modules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS template_pipelines (
  id CHAR(36) PRIMARY KEY,
  template_module_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_template_pipelines_module (template_module_id),
  CONSTRAINT fk_template_pipelines_module FOREIGN KEY (template_module_id) REFERENCES template_modules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS template_pipeline_stages (
  id CHAR(36) PRIMARY KEY,
  pipeline_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(32) NULL DEFAULT '#6B7280',
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_template_stages_pipeline (pipeline_id),
  CONSTRAINT fk_template_stages_pipeline FOREIGN KEY (pipeline_id) REFERENCES template_pipelines(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS template_forms (
  id CHAR(36) PRIMARY KEY,
  template_module_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_template_forms_module (template_module_id),
  CONSTRAINT fk_template_forms_module FOREIGN KEY (template_module_id) REFERENCES template_modules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS template_form_fields (
  id CHAR(36) PRIMARY KEY,
  template_form_id CHAR(36) NOT NULL,
  field_id CHAR(36) NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  required TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_template_form_fields_form (template_form_id),
  CONSTRAINT fk_template_form_fields_form FOREIGN KEY (template_form_id) REFERENCES template_forms(id) ON DELETE CASCADE,
  CONSTRAINT fk_template_form_fields_field FOREIGN KEY (field_id) REFERENCES template_fields(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- WhatsApp (inferred from app types; no CREATE in Supabase migrations)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS whatsapp_accounts (
  id CHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  business_account_id VARCHAR(255) NOT NULL,
  phone_number_id VARCHAR(255) NOT NULL,
  display_phone_number VARCHAR(64) NOT NULL,
  access_token VARCHAR(1024) NOT NULL,
  webhook_verify_token VARCHAR(255) DEFAULT '',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_connected TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_whatsapp_accounts_tenant (tenant_id)
);

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  contact_phone VARCHAR(64) NOT NULL,
  contact_name VARCHAR(255) NULL,
  contact_id CHAR(36) NULL,
  record_id CHAR(36) NULL,
  module_name VARCHAR(255) NULL,
  last_message TEXT NULL,
  last_message_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unread_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_whatsapp_conv_account FOREIGN KEY (account_id) REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_whatsapp_conv_record FOREIGN KEY (record_id) REFERENCES crm_records(id) ON DELETE SET NULL,
  INDEX idx_whatsapp_conv_account (account_id),
  INDEX idx_whatsapp_conv_record (record_id)
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id CHAR(36) PRIMARY KEY,
  conversation_id CHAR(36) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  content TEXT NOT NULL,
  message_type VARCHAR(32) NOT NULL DEFAULT 'text',
  direction VARCHAR(16) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'sent',
  whatsapp_message_id VARCHAR(255) NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP NULL,
  read_at TIMESTAMP NULL,
  media_url VARCHAR(2048) NULL,
  template_name VARCHAR(255) NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_whatsapp_msg_conversation FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  INDEX idx_whatsapp_messages_conversation (conversation_id)
);

SET FOREIGN_KEY_CHECKS = 1;

-- Optional: seed default permissions (module/action pairs)
-- INSERT INTO permissions (id, module_name, action) SELECT UUID(), module, act FROM (
--   SELECT 'leads' AS module, 'view' AS act UNION SELECT 'leads','create' UNION SELECT 'leads','edit' UNION SELECT 'leads','delete' UNION SELECT 'leads','export' UNION SELECT 'leads','import'
--   UNION SELECT 'contacts','view' UNION SELECT 'contacts','create' UNION SELECT 'contacts','edit' UNION SELECT 'contacts','delete' UNION SELECT 'contacts','export' UNION SELECT 'contacts','import'
--   UNION SELECT 'deals','view' UNION SELECT 'deals','create' UNION SELECT 'deals','edit' UNION SELECT 'deals','delete' UNION SELECT 'deals','export' UNION SELECT 'deals','import'
--   UNION SELECT 'tasks','view' UNION SELECT 'tasks','create' UNION SELECT 'tasks','edit' UNION SELECT 'tasks','delete' UNION SELECT 'tasks','export' UNION SELECT 'tasks','import'
--   UNION SELECT 'companies','view' UNION SELECT 'companies','create' UNION SELECT 'companies','edit' UNION SELECT 'companies','delete' UNION SELECT 'companies','export' UNION SELECT 'companies','import'
-- ) t;
