import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

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
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) { setProfile(null); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) setProfile(data as unknown as ProfileData);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<Pick<ProfileData, 'name' | 'phone' | 'timezone' | 'notifications_enabled' | 'avatar_url'>>) => {
    if (!profile) return false;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', profile.id);
    setSaving(false);
    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : prev);
      return true;
    }
    return false;
  }, [profile]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!user) return null;
    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadErr) return null;

    const { data: urlData } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(filePath);

    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await updateProfile({ avatar_url: publicUrl });
    return publicUrl;
  }, [user, updateProfile]);

  const updateStatus = useCallback(async (status: 'online' | 'offline') => {
    if (!profile) return;
    await supabase
      .from('profiles')
      .update({ status })
      .eq('id', profile.id);
    setProfile(prev => prev ? { ...prev, status } : prev);
  }, [profile]);

  const changePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return !error;
  }, []);

  return { profile, loading, saving, fetchProfile, updateProfile, uploadAvatar, updateStatus, changePassword };
}
