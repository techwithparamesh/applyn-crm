-- Workspace Organization: permissions (name, description), team_members (user_id, role),
-- invitations (name, team_id), crm_records (owner_user_id, visibility)
-- Run after mysql_schema.sql. Skip ALTERs if column already exists.

-- Permissions: add name and description (optional; keep module_name, action for checks)
ALTER TABLE permissions ADD COLUMN name VARCHAR(255) NULL AFTER action;
ALTER TABLE permissions ADD COLUMN description TEXT NULL AFTER name;
UPDATE permissions SET name = CONCAT(module_name, ':', action) WHERE name IS NULL;

-- Team members: add user_id and role (map profile_id -> user_id via profiles.user_id)
ALTER TABLE team_members ADD COLUMN user_id VARCHAR(255) NULL AFTER team_id;
ALTER TABLE team_members ADD COLUMN role VARCHAR(32) NULL DEFAULT 'member' AFTER profile_id;
UPDATE team_members tm JOIN profiles p ON p.id = tm.profile_id SET tm.user_id = p.user_id WHERE tm.user_id IS NULL AND p.user_id IS NOT NULL;

-- Invitations: add invitee name and optional team
ALTER TABLE invitations ADD COLUMN name VARCHAR(255) NULL AFTER email;
ALTER TABLE invitations ADD COLUMN team_id CHAR(36) NULL AFTER role_id;

-- Users: add status if not present (align with workspace users)
ALTER TABLE users ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'active' AFTER role;

-- CRM records: owner and visibility (Private | Team | Organization)
ALTER TABLE crm_records ADD COLUMN owner_user_id VARCHAR(255) NULL AFTER module_id;
ALTER TABLE crm_records ADD COLUMN visibility VARCHAR(32) NOT NULL DEFAULT 'organization' AFTER owner_user_id;
ALTER TABLE crm_records ADD INDEX idx_crm_records_owner (owner_user_id);
