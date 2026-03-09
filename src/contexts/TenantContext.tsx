import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/components/AuthProvider';
import type { AuthProfile, TenantInfo } from '@/components/AuthProvider';

export interface TenantContextValue {
  tenant: TenantInfo | null;
  user: AuthProfile | null;
}

const TenantContext = createContext<TenantContextValue>({ tenant: null, user: null });

export function TenantProvider({ children }: { children: ReactNode }) {
  const { profile, tenant } = useAuth();
  return (
    <TenantContext.Provider value={{ tenant, user: profile }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  return useContext(TenantContext);
}
