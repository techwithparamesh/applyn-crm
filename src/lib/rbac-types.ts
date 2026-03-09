export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'import';

export interface Role {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Permission {
  id: string;
  module_name: string;
  action: PermissionAction;
}

export interface RolePermission {
  id: string;
  role_id: string;
  module_name: string;
  action: PermissionAction;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  tenant_id: string;
  created_at: string;
}

export interface RoleWithPermissions extends Role {
  permissions: RolePermission[];
  userCount: number;
}

export interface UserWithRole {
  userId: string;
  userName: string;
  email: string;
  role: Role | null;
}

export const ALL_MODULES = ['leads', 'contacts', 'deals', 'tasks', 'companies'] as const;
export const ALL_ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'export', 'import'];

export const MODULE_LABELS: Record<string, string> = {
  leads: 'Leads',
  contacts: 'Contacts',
  deals: 'Deals',
  tasks: 'Tasks',
  companies: 'Companies',
};
