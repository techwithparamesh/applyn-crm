-- Multi-tenant SaaS: tenants (subdomain, plan), users (tenant_id, role), dashboard_widgets layout
-- Run after mysql_schema.sql. For existing DBs only.

-- Tenants: add subdomain, plan, updated_at
ALTER TABLE tenants ADD COLUMN subdomain VARCHAR(64) NULL AFTER name;
ALTER TABLE tenants ADD COLUMN plan VARCHAR(32) NOT NULL DEFAULT 'free' AFTER subdomain;
ALTER TABLE tenants ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;
CREATE UNIQUE INDEX uk_tenants_subdomain ON tenants(subdomain);

-- Users: add tenant_id and role (admin, manager, user)
ALTER TABLE users ADD COLUMN tenant_id VARCHAR(64) NULL AFTER id;
ALTER TABLE users ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'user' AFTER password_hash;
ALTER TABLE users ADD INDEX idx_users_tenant (tenant_id);
-- Backfill: set tenant_id from first profile for existing users
UPDATE users u SET u.tenant_id = (SELECT tenant_id FROM profiles p WHERE p.user_id = u.id LIMIT 1) WHERE u.tenant_id IS NULL;
-- Optional: set default for any remaining
UPDATE users SET tenant_id = 't1' WHERE tenant_id IS NULL;

-- Dashboard widgets: add position and size (optional; can stay in config_json)
ALTER TABLE dashboard_widgets ADD COLUMN position_x INT NOT NULL DEFAULT 0 AFTER config_json;
ALTER TABLE dashboard_widgets ADD COLUMN position_y INT NOT NULL DEFAULT 0 AFTER position_x;
ALTER TABLE dashboard_widgets ADD COLUMN width INT NOT NULL DEFAULT 4 AFTER position_y;
ALTER TABLE dashboard_widgets ADD COLUMN height INT NOT NULL DEFAULT 1 AFTER width;
