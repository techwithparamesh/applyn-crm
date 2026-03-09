import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Role, RolePermission, UserRole, PermissionAction, RoleWithPermissions } from '@/lib/rbac-types';

export function useRBAC() {
  const { profile } = useAuth();
  const currentTenantId = profile?.tenant_id || 't1';
  const currentUserId = profile?.user_id || profile?.id || '';

  const [roles, setRoles] = useState<Role[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, rpRes, urRes] = await Promise.all([
        api.get('/api/roles'),
        api.get('/api/role_permissions'),
        api.get('/api/user_roles'),
      ]);
      if (rolesRes.data) setRoles(rolesRes.data as unknown as Role[]);
      if (rpRes.data) setRolePermissions(rpRes.data as unknown as RolePermission[]);
      if (urRes.data) setUserRoles(urRes.data as unknown as UserRole[]);
    } catch (err) {
      console.error('Failed to fetch RBAC data:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const rolesWithDetails: RoleWithPermissions[] = useMemo(() => {
    return roles.map((role) => ({
      ...role,
      permissions: rolePermissions.filter((rp) => rp.role_id === role.id),
      userCount: userRoles.filter((ur) => ur.role_id === role.id).length,
    }));
  }, [roles, rolePermissions, userRoles]);

  const createRole = useCallback(
    async (name: string, description: string) => {
      const { data, error } = await api.post('/api/roles', { name, description });
      if (error) throw error;
      await fetchAll();
      return data;
    },
    [fetchAll]
  );

  const updateRole = useCallback(
    async (id: string, name: string, description: string) => {
      const { error } = await api.patch(`/api/roles/${id}`, { name, description });
      if (error) throw error;
      await fetchAll();
    },
    [fetchAll]
  );

  const deleteRole = useCallback(
    async (id: string) => {
      const { error } = await api.delete(`/api/roles/${id}`);
      if (error) throw error;
      await fetchAll();
    },
    [fetchAll]
  );

  const setRolePermissionsBatch = useCallback(
    async (roleId: string, permissions: { module_name: string; action: PermissionAction }[]) => {
      await api.delete('/api/role_permissions', { role_id: roleId });
      if (permissions.length > 0) {
        const rows = permissions.map((p) => ({ role_id: roleId, module_name: p.module_name, action: p.action }));
        await api.post('/api/role_permissions', rows);
      }
      await fetchAll();
    },
    [fetchAll]
  );

  const assignRole = useCallback(
    async (userId: string, roleId: string) => {
      await api.delete('/api/user_roles', { user_id: userId, tenant_id: currentTenantId });
      const { error } = await api.post('/api/user_roles', { user_id: userId, role_id: roleId });
      if (error) throw error;
      await fetchAll();
    },
    [fetchAll, currentTenantId]
  );

  const removeUserRole = useCallback(
    async (userId: string) => {
      await api.delete('/api/user_roles', { user_id: userId, tenant_id: currentTenantId });
      await fetchAll();
    },
    [fetchAll, currentTenantId]
  );

  const hasPermission = useCallback(
    (moduleName: string, action: PermissionAction): boolean => {
      const userRoleIds = userRoles.filter((ur) => ur.user_id === currentUserId).map((ur) => ur.role_id);
      return rolePermissions.some(
        (rp) => userRoleIds.includes(rp.role_id) && rp.module_name === moduleName && rp.action === action
      );
    },
    [userRoles, rolePermissions, currentUserId]
  );

  return {
    roles,
    rolePermissions,
    userRoles,
    rolesWithDetails,
    loading,
    fetchAll,
    createRole,
    updateRole,
    deleteRole,
    setRolePermissionsBatch,
    assignRole,
    removeUserRole,
    hasPermission,
  };
}
