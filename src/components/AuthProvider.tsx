import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, getToken, setToken } from '@/lib/api';

export interface AuthProfile {
  id: string;
  user_id?: string;
  tenant_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  status: string;
  phone?: string;
  timezone?: string;
}

interface AuthContextType {
  profile: AuthProfile | null;
  loading: boolean;
  signIn: (token: string, user: AuthProfile) => void;
  signOut: () => void;
  setProfile: (p: AuthProfile | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  profile: null,
  loading: true,
  signIn: () => {},
  signOut: () => {},
  setProfile: () => {},
});

const PUBLIC_ROUTES = ['/login', '/signup', '/form'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me').then(({ data, error }) => {
      if (error || !data) {
        setToken(null);
        setProfileState(null);
      } else {
        setProfileState(data as AuthProfile);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_ROUTES.some((r) => location.pathname.startsWith(r));
    if (!profile && !isPublic) {
      navigate('/login', { replace: true });
    }
    if (profile && (location.pathname === '/login' || location.pathname === '/signup')) {
      navigate('/', { replace: true });
    }
  }, [profile, loading, location.pathname, navigate]);

  const signIn = (token: string, user: AuthProfile) => {
    setToken(token);
    setProfileState(user);
  };

  const signOut = () => {
    setToken(null);
    setProfileState(null);
    navigate('/login', { replace: true });
  };

  const setProfile = (p: AuthProfile | null) => {
    setProfileState(p);
  };

  return (
    <AuthContext.Provider value={{ profile, loading, signIn, signOut, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
