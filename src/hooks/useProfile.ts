import { useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { api, getApiBase, getAssetUrl } from '@/lib/api';

export interface ProfileData {
  id: string;
  user_id: string | null;
  tenant_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  phone: string;
  timezone: string;
  notifications_enabled: boolean;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export function useProfile() {
  const { profile, loading, setProfile } = useAuth();
  const profileData = profile as ProfileData | null;

  const updateProfile = useCallback(
    async (updates: Partial<Pick<ProfileData, 'name' | 'phone' | 'timezone' | 'notifications_enabled' | 'avatar_url'>>) => {
      if (!profile) return false;
      const { data, error } = await api.patch('/api/profiles/me', updates);
      if (error || !data) return false;
      setProfile(data as ProfileData);
      return true;
    },
    [profile, setProfile]
  );

  const uploadAvatar = useCallback(
    async (file: File): Promise<string | null> => {
      if (!profile) return null;
      const form = new FormData();
      form.append('file', file);
      const token = (await import('@/lib/api')).getToken();
      const res = await fetch(`${getApiBase()}/api/upload/avatar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data?.url) return null;
      const fullUrl = getAssetUrl(data.url) || data.url;
      await updateProfile({ avatar_url: data.url });
      return fullUrl;
    },
    [profile, updateProfile]
  );

  const updateStatus = useCallback(
    async (status: 'online' | 'offline') => {
      if (!profile) return;
      await api.patch('/api/profiles/me', { status });
      setProfile(profile ? { ...profile, status } : null);
    },
    [profile, setProfile]
  );

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const { error } = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return !error;
  }, []);

  return {
    profile: profileData,
    loading,
    saving: false,
    fetchProfile: () => {},
    updateProfile,
    uploadAvatar,
    updateStatus,
    changePassword,
  };
}

export { getAssetUrl };
