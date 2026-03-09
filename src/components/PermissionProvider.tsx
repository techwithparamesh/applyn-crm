import { createContext, useContext, ReactNode } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import { PermissionAction } from '@/lib/rbac-types';

interface PermissionContextType {
  hasPermission: (moduleName: string, action: PermissionAction) => boolean;
  loading: boolean;
}

const PermissionContext = createContext<PermissionContextType>({
  hasPermission: () => true,
  loading: false,
});

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { hasPermission, loading } = useRBAC();
  return (
    <PermissionContext.Provider value={{ hasPermission, loading }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  return useContext(PermissionContext);
}

/** Gate component — renders children only if user has the required permission */
export function PermissionGate({
  module,
  action,
  children,
  fallback = null,
}: {
  module: string;
  action: PermissionAction;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasPermission, loading } = usePermission();
  if (loading) return null;
  if (!hasPermission(module, action)) return <>{fallback}</>;
  return <>{children}</>;
}
