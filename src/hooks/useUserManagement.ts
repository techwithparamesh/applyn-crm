import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  tenant_id: string;
  user_id: string | null;
  email: string;
  name: string;
  avatar_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  created_at: string;
  members?: Profile[];
}

export interface Invitation {
  id: string;
  tenant_id: string;
  email: string;
  role_id: string | null;
  token: string;
  expires_at: string;
  accepted: boolean;
  invited_by: string;
  created_at: string;
}

// ─── Profiles ───

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('name');
    setProfiles((data as any[] || []).map(mapProfile));
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const updateProfile = useCallback(async (id: string, updates: Partial<Pick<Profile, 'name' | 'avatar_url' | 'status'>>) => {
    await supabase.from('profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deleteProfile = useCallback(async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id);
    setProfiles(prev => prev.filter(p => p.id !== id));
  }, []);

  return { profiles, loading, fetchProfiles, updateProfile, deleteProfile };
}

function mapProfile(row: any): Profile {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    user_id: row.user_id,
    email: row.email,
    name: row.name,
    avatar_url: row.avatar_url,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ─── Teams ───

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    const { data: teamRows } = await supabase.from('teams').select('*').order('name');
    if (!teamRows) { setLoading(false); return; }

    const teamIds = teamRows.map((t: any) => t.id);
    const { data: memberRows } = await supabase
      .from('team_members')
      .select('*, profiles(*)')
      .in('team_id', teamIds.length ? teamIds : ['__none__']);

    const mapped: Team[] = teamRows.map((t: any) => ({
      id: t.id,
      tenant_id: t.tenant_id,
      name: t.name,
      description: t.description || '',
      created_at: t.created_at,
      members: (memberRows || [])
        .filter((m: any) => m.team_id === t.id && m.profiles)
        .map((m: any) => mapProfile(m.profiles)),
    }));

    setTeams(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const createTeam = useCallback(async (name: string, description?: string) => {
    const { data, error } = await supabase
      .from('teams')
      .insert({ name, description: description || '' })
      .select()
      .single();
    if (data) {
      const team: Team = { id: data.id, tenant_id: data.tenant_id, name: data.name, description: data.description || '', created_at: data.created_at, members: [] };
      setTeams(prev => [...prev, team]);
      return team;
    }
    return null;
  }, []);

  const deleteTeam = useCallback(async (id: string) => {
    await supabase.from('teams').delete().eq('id', id);
    setTeams(prev => prev.filter(t => t.id !== id));
  }, []);

  const addMember = useCallback(async (teamId: string, profileId: string) => {
    const { error } = await supabase.from('team_members').insert({ team_id: teamId, profile_id: profileId });
    if (!error) await fetchTeams();
  }, [fetchTeams]);

  const removeMember = useCallback(async (teamId: string, profileId: string) => {
    await supabase.from('team_members').delete().eq('team_id', teamId).eq('profile_id', profileId);
    setTeams(prev => prev.map(t =>
      t.id === teamId ? { ...t, members: (t.members || []).filter(m => m.id !== profileId) } : t
    ));
  }, []);

  return { teams, loading, fetchTeams, createTeam, deleteTeam, addMember, removeMember };
}

// ─── Invitations ───

export function useInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('invitations').select('*').order('created_at', { ascending: false });
    setInvitations((data as any[] || []).map((row: any) => ({
      id: row.id,
      tenant_id: row.tenant_id,
      email: row.email,
      role_id: row.role_id,
      token: row.token,
      expires_at: row.expires_at,
      accepted: row.accepted,
      invited_by: row.invited_by,
      created_at: row.created_at,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchInvitations(); }, [fetchInvitations]);

  const createInvitation = useCallback(async (email: string, roleId?: string) => {
    const { data, error } = await supabase
      .from('invitations')
      .insert({ email, role_id: roleId || null })
      .select()
      .single();
    if (data) {
      setInvitations(prev => [{
        id: data.id, tenant_id: data.tenant_id, email: data.email,
        role_id: data.role_id, token: data.token, expires_at: data.expires_at,
        accepted: data.accepted, invited_by: data.invited_by, created_at: data.created_at,
      }, ...prev]);
      return data;
    }
    return null;
  }, []);

  const deleteInvitation = useCallback(async (id: string) => {
    await supabase.from('invitations').delete().eq('id', id);
    setInvitations(prev => prev.filter(i => i.id !== id));
  }, []);

  return { invitations, loading, fetchInvitations, createInvitation, deleteInvitation };
}
