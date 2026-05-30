-- Core table for document metadata
create table if not exists public.documents (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  date text,
  tags text[] default '{}',
  notes text,
  file_path text not null,
  file_type text,
  file_name text,
  file_size bigint,
  created_at timestamptz default now()
);

alter table public.documents enable row level security;

create policy "Users can view own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can insert own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update own documents"
  on public.documents for update
  using (auth.uid() = user_id);

create policy "Users can delete own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

-- Storage policies for bucket: vault-files
create policy "Users can access own files"
  on storage.objects for all
  using (
    bucket_id = 'vault-files'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'vault-files'
    and split_part(name, '/', 1) = auth.uid()::text
  );
