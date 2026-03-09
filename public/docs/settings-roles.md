# Settings: Roles

## Overview

Roles define what users can do: which modules they can view or edit, whether they can manage settings, and other permissions. Assign roles to users (or via teams) to enforce access control. Built-in roles (e.g. Admin, Member) can be customized; custom roles can be created for fine-grained control.

## Navigation

**Sidebar → Settings → Roles** tab.

## UI Components

- **Role list** — Name, description, user count.
- **Role editor** — Permissions by area: modules (view/edit/delete), settings, users, etc.
- **Permission toggles** — Checkboxes or switches per permission.
- **Assign to user** — Done from Users tab by selecting a role per user.

## User Actions

- View and edit roles
- Create custom roles
- Set permissions (modules, settings, API, etc.)
- Assign roles to users (from Users tab)

## Step-by-Step Guide

### How to create a custom role

1. Open **Settings → Roles**.
2. Click **New role** (or **Create role**).
3. Enter **Name** and **Description**.
4. Set **Permissions** (e.g. view Leads, edit Contacts, no access to Settings).
5. Save; the role appears in the list. Assign it to users from **Settings → Users**.

### How to assign a role to a user

1. Open **Settings → Users**.
2. Find the user and open **Edit** or the role dropdown.
3. Select the **Role** and save; the user’s access updates immediately.

[Screenshot: Roles and permissions]

## Best Practices

- Use a small set of roles (e.g. Admin, Manager, Member, Read-only) for simplicity.
- Give Admins full access; restrict Settings and User management for others.
- Use custom roles only when you need a distinct permission set.
- Review roles when adding sensitive features (e.g. API, exports).
