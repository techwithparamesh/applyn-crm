-- Form sections and section_id on form fields (run after main schema if you persist forms in DB)
-- Optional: use when storing web_forms and web_form_fields in database.

-- Form sections: groups of fields within a form
CREATE TABLE IF NOT EXISTS form_sections (
  id CHAR(36) PRIMARY KEY,
  form_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  layout VARCHAR(32) NOT NULL DEFAULT 'single' COMMENT 'single | two',
  order_index INT NOT NULL DEFAULT 0,
  collapsible TINYINT(1) DEFAULT 0,
  border TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_form_sections_form (form_id),
  INDEX idx_form_sections_order (form_id, order_index)
);

-- If you have a web_form_fields table, add:
-- ALTER TABLE web_form_fields ADD COLUMN section_id CHAR(36) NULL AFTER order_index;
-- ALTER TABLE web_form_fields ADD INDEX idx_web_form_fields_section (section_id);
