import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { api, isUsingMySQL } from '@/lib/api';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: { id: string; tenant_id: string; name: string; email: string; avatar_url: string | null; status: string; phone: string; timezone: string } | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

const PUBLIC_ROUTES = ['/login', '/signup', '/form'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch profile for the current user, create one if missing
  const fetchProfile = async (userId: string) => {
    if (isUsingMySQL()) {
      const { data } = await api.get('/api/profiles', { user_id: userId });
      const prof = data as AuthContextType['profile'] | null;
      if (prof) {
        setProfile(prof);
        return;
      }
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email || '';
      const userName = userData?.user?.user_metadata?.name || userEmail.split('@')[0];
      const { data: tenant } = await api.post('/api/tenants', { name: `${userName}'s Workspace`, owner_id: userId });
      if (tenant?.id) {
        const { data: newProfile } = await api.post('/api/profiles', { user_id: userId, tenant_id: tenant.id, name: userName, email: userEmail, status: 'online' });
        if (newProfile) setProfile(newProfile as AuthContextType['profile']);
      }
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, tenant_id, name, email, avatar_url, status, phone, timezone')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) {
      setProfile(data as AuthContextType['profile']);
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email || '';
      const userName = userData?.user?.user_metadata?.name || userEmail.split('@')[0];
      const { data: tenant } = await supabase
        .from('tenants')
        .insert({ name: `${userName}'s Workspace`, owner_id: userId })
        .select('id')
        .single();
      if (tenant) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({ user_id: userId, tenant_id: tenant.id, name: userName, email: userEmail, status: 'online' })
          .select('id, tenant_id, name, email, avatar_url, status, phone, timezone')
          .single();
        setProfile(newProfile as AuthContextType['profile']);
      }
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          // Use setTimeout to avoid Supabase client deadlock
          setTimeout(() => fetchProfile(newSession.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      if (existing?.user) {
        fetchProfile(existing.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Route guard
  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_ROUTES.some(r => location.pathname.startsWith(r));
    if (!session && !isPublic) {
      navigate('/login', { replace: true });
    }
    if (session && (location.pathname === '/login' || location.pathname === '/signup')) {
      navigate('/', { replace: true });
    }
  }, [session, loading, location.pathname, navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
