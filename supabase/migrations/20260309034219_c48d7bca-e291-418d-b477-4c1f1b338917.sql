
-- Tasks table
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 't1',
  record_id uuid REFERENCES public.crm_records(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'todo',
  priority text NOT NULL DEFAULT 'medium',
  due_date date,
  assigned_to text,
  created_by text NOT NULL DEFAULT 'User',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on tasks" ON public.tasks
  FOR ALL USING (tenant_id = public.get_user_tenant_id(auth.uid()::text) OR tenant_id = 't1')
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()::text) OR tenant_id = 't1');

CREATE INDEX idx_tasks_tenant ON public.tasks(tenant_id);
CREATE INDEX idx_tasks_record ON public.tasks(record_id);

-- Notes table
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 't1',
  record_id uuid NOT NULL REFERENCES public.crm_records(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by text NOT NULL DEFAULT 'User',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on notes" ON public.notes
  FOR ALL USING (tenant_id = public.get_user_tenant_id(auth.uid()::text) OR tenant_id = 't1')
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()::text) OR tenant_id = 't1');

CREATE INDEX idx_notes_record ON public.notes(record_id);

-- Files table
CREATE TABLE public.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 't1',
  record_id uuid NOT NULL REFERENCES public.crm_records(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  uploaded_by text NOT NULL DEFAULT 'User',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on files" ON public.files
  FOR ALL USING (tenant_id = public.get_user_tenant_id(auth.uid()::text) OR tenant_id = 't1')
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()::text) OR tenant_id = 't1');

CREATE INDEX idx_files_record ON public.files(record_id);

-- Storage bucket for CRM files
INSERT INTO storage.buckets (id, name, public) VALUES ('crm-files', 'crm-files', true);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'crm-files');

CREATE POLICY "Anyone can read crm-files" ON storage.objects
  FOR SELECT USING (bucket_id = 'crm-files');

CREATE POLICY "Authenticated users can delete own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'crm-files');
