-- CRM Template Engine & Marketplace
-- template_categories, crm_templates, template_modules, template_fields,
-- template_pipelines, template_pipeline_stages, template_forms, template_form_fields

-- Categories for marketplace
CREATE TABLE IF NOT EXISTS template_categories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(64) NULL DEFAULT 'Boxes',
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_template_categories_order (order_index)
);

-- Installable templates
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

-- Template module definition (maps to modules table on install)
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

-- Template field definition (maps to module_fields on install)
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

-- Template pipeline (per template module)
CREATE TABLE IF NOT EXISTS template_pipelines (
  id CHAR(36) PRIMARY KEY,
  template_module_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_template_pipelines_module (template_module_id),
  CONSTRAINT fk_template_pipelines_module FOREIGN KEY (template_module_id) REFERENCES template_modules(id) ON DELETE CASCADE
);

-- Pipeline stages
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

-- Template form (per module; optional)
CREATE TABLE IF NOT EXISTS template_forms (
  id CHAR(36) PRIMARY KEY,
  template_module_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_template_forms_module (template_module_id),
  CONSTRAINT fk_template_forms_module FOREIGN KEY (template_module_id) REFERENCES template_modules(id) ON DELETE CASCADE
);

-- Form field reference (field_id = template_fields.id)
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

-- Optional: track by template_id in installed_templates (skip if column already exists)
-- ALTER TABLE installed_templates ADD COLUMN template_id CHAR(36) NULL AFTER template_slug;
-- CREATE INDEX idx_installed_templates_template ON installed_templates(template_id);
