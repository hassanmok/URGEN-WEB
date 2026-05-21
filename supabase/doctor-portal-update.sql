-- =============================================================================
-- URGEN – Doctor portal update (Supabase SQL Editor)
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS
-- Run this entire script once. Requires doctor_users + doctor_cases to exist
-- (or run the full doctor section from schema.sql first).
-- =============================================================================

-- Helper: is current user a doctor?
create or replace function public.auth_is_doctor_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.doctor_users d where d.user_id = auth.uid()
  );
$$;

grant execute on function public.auth_is_doctor_user() to authenticated;

-- ─── doctor_cases: status columns (if missing) ───
alter table public.doctor_cases add column if not exists status text;
alter table public.doctor_cases add column if not exists rejection_reason text;
alter table public.doctor_cases alter column status set default 'sent';
update public.doctor_cases set status = 'sent' where status is null;
alter table public.doctor_cases alter column status set not null;

alter table public.doctor_cases drop constraint if exists doctor_cases_status_check;
update public.doctor_cases set status = 'accepted' where status = 'pending';
alter table public.doctor_cases add constraint doctor_cases_status_check
  check (status in ('sent', 'accepted', 'rejected'));

alter table public.doctor_cases enable row level security;

drop policy if exists "doctor_cases_doctor_select" on public.doctor_cases;
create policy "doctor_cases_doctor_select" on public.doctor_cases
  for select to authenticated
  using (
    doctor_user_id = auth.uid()
    and public.auth_is_doctor_user()
  );

drop policy if exists "doctor_cases_doctor_insert" on public.doctor_cases;
create policy "doctor_cases_doctor_insert" on public.doctor_cases
  for insert to authenticated
  with check (
    doctor_user_id = auth.uid()
    and public.auth_is_doctor_user()
    and status = 'sent'
  );

-- Doctor can edit own case only while status = sent (before admin accept)
drop policy if exists "doctor_cases_doctor_update" on public.doctor_cases;
create policy "doctor_cases_doctor_update" on public.doctor_cases
  for update to authenticated
  using (
    doctor_user_id = auth.uid()
    and public.auth_is_doctor_user()
    and status = 'sent'
  )
  with check (
    doctor_user_id = auth.uid()
    and public.auth_is_doctor_user()
    and status = 'sent'
  );

drop policy if exists "doctor_cases_staff_select" on public.doctor_cases;
create policy "doctor_cases_staff_select" on public.doctor_cases
  for select to authenticated
  using (
    not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  );

drop policy if exists "doctor_cases_staff_update" on public.doctor_cases;
create policy "doctor_cases_staff_update" on public.doctor_cases
  for update to authenticated
  using (
    not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  )
  with check (
    not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  );

grant select, update on table public.doctor_cases to authenticated;

-- Admin accept/reject (RPC)
create or replace function public.doctor_case_admin_set_status(
  p_case_id uuid,
  p_status text,
  p_rejection_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if public.auth_is_partner_lab_user() or public.auth_is_doctor_user() then
    raise exception 'forbidden';
  end if;
  if p_status not in ('sent', 'accepted', 'rejected') then
    raise exception 'invalid_status';
  end if;

  update public.doctor_cases
  set
    status = p_status,
    rejection_reason = case
      when p_status = 'rejected' then coalesce(nullif(trim(p_rejection_reason), ''), 'Rejected')
      else null
    end,
    updated_at = now()
  where id = p_case_id
  returning id into v_id;

  if v_id is null then
    raise exception 'not_found';
  end if;
end;
$$;

revoke all on function public.doctor_case_admin_set_status(uuid, text, text) from public;
grant execute on function public.doctor_case_admin_set_status(uuid, text, text) to authenticated;

-- ─── Multiple tests per doctor case ───
create table if not exists public.doctor_case_tests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.doctor_cases (id) on delete cascade,
  test_slug text not null,
  created_at timestamptz default now(),
  unique (case_id, test_slug)
);

create index if not exists doctor_case_tests_case_idx
  on public.doctor_case_tests (case_id);

alter table public.doctor_case_tests enable row level security;

drop policy if exists "doctor_case_tests_doctor_select" on public.doctor_case_tests;
create policy "doctor_case_tests_doctor_select" on public.doctor_case_tests
  for select to authenticated
  using (
    exists (
      select 1 from public.doctor_cases c
      where c.id = case_id
        and c.doctor_user_id = auth.uid()
        and public.auth_is_doctor_user()
    )
  );

drop policy if exists "doctor_case_tests_doctor_insert" on public.doctor_case_tests;
create policy "doctor_case_tests_doctor_insert" on public.doctor_case_tests
  for insert to authenticated
  with check (
    exists (
      select 1 from public.doctor_cases c
      where c.id = case_id
        and c.doctor_user_id = auth.uid()
        and public.auth_is_doctor_user()
        and c.status = 'sent'
    )
  );

drop policy if exists "doctor_case_tests_doctor_delete" on public.doctor_case_tests;
create policy "doctor_case_tests_doctor_delete" on public.doctor_case_tests
  for delete to authenticated
  using (
    exists (
      select 1 from public.doctor_cases c
      where c.id = case_id
        and c.doctor_user_id = auth.uid()
        and public.auth_is_doctor_user()
        and c.status = 'sent'
    )
  );

drop policy if exists "doctor_case_tests_staff_select" on public.doctor_case_tests;
create policy "doctor_case_tests_staff_select" on public.doctor_case_tests
  for select to authenticated
  using (
    not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  );

grant select, insert, delete on table public.doctor_case_tests to authenticated;

-- ─── Case files ───
create table if not exists public.doctor_case_files (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.doctor_cases (id) on delete cascade,
  doctor_user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  byte_size bigint,
  created_at timestamptz default now()
);

create index if not exists doctor_case_files_case_idx
  on public.doctor_case_files (case_id);

alter table public.doctor_case_files enable row level security;

drop policy if exists "doctor_case_files_doctor_select" on public.doctor_case_files;
create policy "doctor_case_files_doctor_select" on public.doctor_case_files
  for select to authenticated
  using (
    doctor_user_id = auth.uid()
    and public.auth_is_doctor_user()
  );

drop policy if exists "doctor_case_files_doctor_insert" on public.doctor_case_files;
create policy "doctor_case_files_doctor_insert" on public.doctor_case_files
  for insert to authenticated
  with check (
    doctor_user_id = auth.uid()
    and public.auth_is_doctor_user()
    and exists (
      select 1 from public.doctor_cases c
      where c.id = case_id
        and c.doctor_user_id = auth.uid()
        and c.status = 'sent'
    )
  );

drop policy if exists "doctor_case_files_doctor_delete" on public.doctor_case_files;
create policy "doctor_case_files_doctor_delete" on public.doctor_case_files
  for delete to authenticated
  using (
    doctor_user_id = auth.uid()
    and public.auth_is_doctor_user()
    and exists (
      select 1 from public.doctor_cases c
      where c.id = case_id
        and c.doctor_user_id = auth.uid()
        and c.status = 'sent'
    )
  );

drop policy if exists "doctor_case_files_staff_select" on public.doctor_case_files;
create policy "doctor_case_files_staff_select" on public.doctor_case_files
  for select to authenticated
  using (
    not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  );

grant select, delete on table public.doctor_case_files to authenticated;

-- updated_at trigger
create or replace function public.doctor_cases_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists doctor_cases_updated_at on public.doctor_cases;
create trigger doctor_cases_updated_at
  before update on public.doctor_cases
  for each row execute function public.doctor_cases_set_updated_at();

-- Storage bucket for doctor uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'doctor-case-files',
  'doctor-case-files',
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

drop policy if exists "doctor_case_files_storage_doctor" on storage.objects;
create policy "doctor_case_files_storage_doctor" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'doctor-case-files'
    and public.auth_is_doctor_user()
  )
  with check (
    bucket_id = 'doctor-case-files'
    and public.auth_is_doctor_user()
  );

drop policy if exists "doctor_case_files_storage_staff" on storage.objects;
create policy "doctor_case_files_storage_staff" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'doctor-case-files'
    and not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  )
  with check (
    bucket_id = 'doctor-case-files'
    and not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  );

-- Optional: doctors no longer read all partner submissions (analytics uses own cases)
drop policy if exists "partner_submissions_doctor_select" on public.partner_submissions;
