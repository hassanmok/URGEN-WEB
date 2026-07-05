-- تدفق طلبات الأطباء مثل المختبرات: sent → pending → in_progress → done (+ رفع تقرير PDF)
-- نفّذ في Supabase SQL Editor بعد schema.sql

alter table public.doctor_cases add column if not exists pdf_storage_path text;
alter table public.doctor_cases add column if not exists pdf_expires_at timestamptz;
alter table public.doctor_cases add column if not exists result_value text;

alter table public.doctor_cases drop constraint if exists doctor_cases_result_value_check;
alter table public.doctor_cases add constraint doctor_cases_result_value_check
  check (result_value is null or result_value in ('positive', 'negative'));

alter table public.doctor_cases drop constraint if exists doctor_cases_status_check;
update public.doctor_cases set status = 'pending' where status = 'accepted';
alter table public.doctor_cases add constraint doctor_cases_status_check
  check (status in ('sent', 'pending', 'in_progress', 'rejected', 'done'));

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
  if p_status not in ('sent', 'pending', 'in_progress', 'rejected', 'done') then
    raise exception 'invalid_status';
  end if;

  update public.doctor_cases
  set
    status = p_status,
    rejection_reason = case
      when p_status = 'rejected' then coalesce(nullif(trim(p_rejection_reason), ''), 'Rejected')
      else null
    end,
    pdf_storage_path = case when p_status = 'rejected' then null else pdf_storage_path end,
    pdf_expires_at = case when p_status = 'rejected' then null else pdf_expires_at end,
    result_value = case when p_status = 'rejected' then null else result_value end,
    updated_at = now()
  where id = p_case_id
  returning id into v_id;

  if v_id is null then
    raise exception 'not_found';
  end if;
end;
$$;

comment on function public.doctor_case_admin_set_status(uuid, text, text) is
  'لوحة الإدارة: تحديث حالة طلب الطبيب (sent / pending / in_progress / rejected / done).';

-- Storage: تقارير PDF النتائج للأطباء
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'doctor-case-reports',
  'doctor-case-reports',
  false,
  15728640,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "doctor_case_reports_staff_all" on storage.objects;
create policy "doctor_case_reports_staff_all" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'doctor-case-reports'
    and not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  )
  with check (
    bucket_id = 'doctor-case-reports'
    and not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  );

drop policy if exists "doctor_case_reports_doctor_read" on storage.objects;
create policy "doctor_case_reports_doctor_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'doctor-case-reports'
    and public.auth_is_doctor_user()
    and exists (
      select 1 from public.doctor_cases dc
      where dc.doctor_user_id = auth.uid()
        and dc.pdf_storage_path = storage.objects.name
        and dc.status = 'done'
        and dc.pdf_expires_at is not null
        and dc.pdf_expires_at > now()
    )
  );

create or replace function public.doctor_cleanup_expired_case_pdfs()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from storage.objects o
  where o.bucket_id = 'doctor-case-reports'
    and exists (
      select 1
      from public.doctor_cases dc
      where dc.pdf_storage_path = o.name
        and dc.pdf_expires_at is not null
        and dc.pdf_expires_at <= now()
    );

  update public.doctor_cases
  set pdf_storage_path = null,
      pdf_expires_at = null
  where pdf_expires_at is not null
    and pdf_expires_at <= now();
end;
$$;

revoke all on function public.doctor_cleanup_expired_case_pdfs() from public;
comment on function public.doctor_cleanup_expired_case_pdfs() is
  'تشغيل دوري: حذف تقارير الأطباء منتهية الصلاحية من التخزين.';
