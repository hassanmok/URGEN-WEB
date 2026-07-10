-- مرفقات طلبات المختبرات الشريكة (ملفات متعددة لكل طلب / batch)
-- نفّذ في Supabase SQL Editor

create table if not exists public.partner_submission_files (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null,
  partner_user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  byte_size bigint,
  created_at timestamptz default now()
);

create index if not exists partner_submission_files_batch_idx
  on public.partner_submission_files (batch_id);

create index if not exists partner_submission_files_partner_idx
  on public.partner_submission_files (partner_user_id, created_at desc);

alter table public.partner_submission_files enable row level security;

grant select, insert, delete on table public.partner_submission_files to authenticated;

drop policy if exists "partner_submission_files_partner_select" on public.partner_submission_files;
create policy "partner_submission_files_partner_select" on public.partner_submission_files
  for select to authenticated
  using (
    partner_user_id = auth.uid()
    and public.auth_is_partner_lab_user()
  );

drop policy if exists "partner_submission_files_partner_insert" on public.partner_submission_files;
create policy "partner_submission_files_partner_insert" on public.partner_submission_files
  for insert to authenticated
  with check (
    partner_user_id = auth.uid()
    and public.auth_is_partner_lab_user()
    and exists (
      select 1 from public.partner_submissions s
      where s.batch_id = partner_submission_files.batch_id
        and s.partner_user_id = auth.uid()
        and s.status = 'sent'
    )
  );

drop policy if exists "partner_submission_files_partner_delete" on public.partner_submission_files;
create policy "partner_submission_files_partner_delete" on public.partner_submission_files
  for delete to authenticated
  using (
    partner_user_id = auth.uid()
    and public.auth_is_partner_lab_user()
    and exists (
      select 1 from public.partner_submissions s
      where s.batch_id = partner_submission_files.batch_id
        and s.partner_user_id = auth.uid()
        and s.status = 'sent'
    )
    and not exists (
      select 1 from public.partner_submissions s
      where s.batch_id = partner_submission_files.batch_id
        and s.partner_user_id = auth.uid()
        and s.status <> 'sent'
    )
  );

drop policy if exists "partner_submission_files_staff_select" on public.partner_submission_files;
create policy "partner_submission_files_staff_select" on public.partner_submission_files
  for select to authenticated
  using (
    not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'partner-submission-files',
  'partner-submission-files',
  false,
  20971520,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "partner_submission_files_storage_partner" on storage.objects;
create policy "partner_submission_files_storage_partner" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'partner-submission-files'
    and public.auth_is_partner_lab_user()
  )
  with check (
    bucket_id = 'partner-submission-files'
    and public.auth_is_partner_lab_user()
  );

drop policy if exists "partner_submission_files_storage_staff" on storage.objects;
create policy "partner_submission_files_storage_staff" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'partner-submission-files'
    and not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  )
  with check (
    bucket_id = 'partner-submission-files'
    and not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  );
