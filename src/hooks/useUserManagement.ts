import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

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

function mapProfile(row: any): Profile {
  return {
    id: row.id ?? row.profile_id,
    tenant_id: row.tenant_id ?? '',
    user_id: row.user_id ?? null,
    email: row.email ?? row.profile_email ?? '',
    name: row.name ?? row.profile_name ?? '',
    avatar_url: row.avatar_url ?? null,
    status: row.status ?? 'active',
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  };
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get('/api/profiles');
    setProfiles((data as any[] || []).map(mapProfile));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const updateProfile = useCallback(async (id: string, updates: Partial<Pick<Profile, 'name' | 'avatar_url' | 'status'>>) => {
    await api.patch(`/api/profiles/${id}`, updates);
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const deleteProfile = useCallback(async (id: string) => {
    await api.delete(`/api/profiles/${id}`);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { profiles, loading, fetchProfiles, updateProfile, deleteProfile };
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    const { data: teamRows } = await api.get('/api/teams');
    const list = (teamRows || []) as any[];
    if (!list.length) {
      setTeams([]);
      setLoading(false);
      return;
    }
    const mapped: Team[] = [];
    for (const t of list) {
      const { data: memberRows } = await api.get('/api/team_members', { team_id: t.id });
      const members = ((memberRows || []) as any[]).map((m) => mapProfile({ profile_id: m.profile_id, profile_name: m.profile_name, profile_email: m.profile_email, ...m }));
      mapped.push({
        id: t.id,
        tenant_id: t.tenant_id,
        name: t.name,
        description: t.description || '',
        created_at: t.created_at,
        members,
      });
    }
    setTeams(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const createTeam = useCallback(async (name: string, description?: string) => {
    const { data, error } = await api.post('/api/teams', { name, description: description || '' });
    if (data) {
      const team: Team = {
        id: (data as any).id,
        tenant_id: (data as any).tenant_id,
        name: (data as any).name,
        description: (data as any).description || '',
        created_at: (data as any).created_at,
        members: [],
      };
      setTeams((prev) => [...prev, team]);
      return team;
    }
    return null;
  }, []);

  const deleteTeam = useCallback(async (id: string) => {
    await api.delete(`/api/teams/${id}`);
    setTeams((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addMember = useCallback(
    async (teamId: string, profileId: string) => {
      await api.post('/api/team_members', { team_id: teamId, profile_id: profileId });
      await fetchTeams();
    },
    [fetchTeams]
  );

  const removeMember = useCallback(async (teamId: string, profileId: string) => {
    await api.delete('/api/team_members', { team_id: teamId, profile_id: profileId });
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId ? { ...t, members: (t.members || []).filter((m) => m.id !== profileId) } : t
      )
    );
  }, []);

  return { teams, loading, fetchTeams, createTeam, deleteTeam, addMember, removeMember };
}

export function useInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get('/api/invitations');
    setInvitations(
      (data as any[] || []).map((row: any) => ({
        id: row.id,
        tenant_id: row.tenant_id,
        email: row.email,
        role_id: row.role_id,
        token: row.token,
        expires_at: row.expires_at,
        accepted: row.accepted,
        invited_by: row.invited_by,
        created_at: row.created_at,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const createInvitation = useCallback(async (email: string, roleId?: string) => {
    const { data, error } = await api.post('/api/invitations', { email, role_id: roleId || null });
    if (data) {
      const d = data as any;
      setInvitations((prev) => [
        {
          id: d.id,
          tenant_id: d.tenant_id,
          email: d.email,
          role_id: d.role_id,
          token: d.token,
          expires_at: d.expires_at,
          accepted: d.accepted,
          invited_by: d.invited_by,
          created_at: d.created_at,
        },
        ...prev,
      ]);
      return data;
    }
    return null;
  }, []);

  const deleteInvitation = useCallback(async (id: string) => {
    await api.delete(`/api/invitations/${id}`);
    setInvitations((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { invitations, loading, fetchInvitations, createInvitation, deleteInvitation };
}
