-- Allow admin staff to replace generated request form images (PNG) on doctor cases.
-- Run once in Supabase SQL Editor after doctor-portal-update.sql

drop policy if exists "doctor_case_files_staff_insert_form" on public.doctor_case_files;
create policy "doctor_case_files_staff_insert_form" on public.doctor_case_files
  for insert to authenticated
  with check (
    not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
    and position('/__request_form__/' in storage_path) > 0
    and exists (
      select 1 from public.doctor_cases c where c.id = case_id
    )
  );

drop policy if exists "doctor_case_files_staff_delete_form" on public.doctor_case_files;
create policy "doctor_case_files_staff_delete_form" on public.doctor_case_files
  for delete to authenticated
  using (
    not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
    and position('/__request_form__/' in storage_path) > 0
  );
