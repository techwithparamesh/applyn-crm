
-- Profiles table (public user data)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 't1',
  user_id text,
  email text NOT NULL,
  name text NOT NULL DEFAULT '',
  avatar_url text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Teams
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 't1',
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Team members
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, profile_id)
);

-- Invitations
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 't1',
  email text NOT NULL,
  role_id uuid REFERENCES public.roles(id) ON DELETE SET NULL,
  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted boolean NOT NULL DEFAULT false,
  invited_by text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on profiles" ON public.profiles FOR ALL
  USING (tenant_id = 't1') WITH CHECK (tenant_id = 't1');

CREATE POLICY "Tenant isolation on teams" ON public.teams FOR ALL
  USING (tenant_id = 't1') WITH CHECK (tenant_id = 't1');

CREATE POLICY "Tenant isolation on team_members" ON public.team_members FOR ALL
  USING (EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_members.team_id AND t.tenant_id = 't1'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_members.team_id AND t.tenant_id = 't1'));

CREATE POLICY "Tenant isolation on invitations" ON public.invitations FOR ALL
  USING (tenant_id = 't1') WITH CHECK (tenant_id = 't1');

-- Indexes
CREATE INDEX idx_profiles_tenant ON public.profiles(tenant_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_teams_tenant ON public.teams(tenant_id);
CREATE INDEX idx_team_members_team ON public.team_members(team_id);
CREATE INDEX idx_team_members_profile ON public.team_members(profile_id);
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);

-- Seed initial users
INSERT INTO public.profiles (email, name, status) VALUES
  ('john@company.com', 'John Doe', 'active'),
  ('jane@company.com', 'Jane Smith', 'active'),
  ('alex@company.com', 'Alex Turner', 'active');
