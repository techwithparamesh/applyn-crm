-- Dynamic CRM Module Builder: add field settings_json and form tables
-- Run after mysql_schema.sql (for existing DBs). New installs may already have
-- settings_json in mysql_schema.sql; if so, skip the ALTER below.

-- Add settings_json to module_fields (placeholder, default_value, validation rules)
-- Skip this line if the column already exists (e.g. from a recent mysql_schema.sql)
ALTER TABLE module_fields ADD COLUMN settings_json JSON NULL AFTER options_json;

-- Web forms (for form builder persistence; optional if using in-memory forms)
CREATE TABLE IF NOT EXISTS web_forms (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 't1',
  module_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  public_slug VARCHAR(255) NULL,
  success_message TEXT NULL,
  redirect_url VARCHAR(2048) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  enable_recaptcha TINYINT(1) NOT NULL DEFAULT 0,
  webhook_url VARCHAR(2048) NULL,
  fields_json JSON NOT NULL,
  sections_json JSON NULL,
  layout_order JSON NULL,
  submission_behavior_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_web_forms_tenant (tenant_id),
  INDEX idx_web_forms_module (module_id)
);

-- Form sections (optional; can also use sections_json in web_forms)
CREATE TABLE IF NOT EXISTS form_sections (
  id CHAR(36) PRIMARY KEY,
  form_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  layout VARCHAR(32) NOT NULL DEFAULT 'single',
  order_index INT NOT NULL DEFAULT 0,
  collapsible TINYINT(1) DEFAULT 0,
  border TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_form_sections_form (form_id)
);

-- Form fields (optional; can also use fields_json in web_forms)
CREATE TABLE IF NOT EXISTS form_fields (
  id CHAR(36) PRIMARY KEY,
  form_id VARCHAR(64) NOT NULL,
  field_id CHAR(36) NULL,
  section_id CHAR(36) NULL,
  order_index INT NOT NULL DEFAULT 0,
  config_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_form_fields_form (form_id),
  INDEX idx_form_fields_section (section_id)
);
