-- تقارير PDF لكل تحليل ضمن طلب الطبيب (بدلا_case_tests)
-- نفّذ في Supabase SQL Editor

alter table public.doctor_case_tests
  add column if not exists pdf_storage_path text,
  add column if not exists pdf_expires_at timestamptz,
  add column if not exists result_value text,
  add column if not exists report_first_opened_at timestamptz;

alter table public.doctor_case_tests drop constraint if exists doctor_case_tests_result_value_check;
alter table public.doctor_case_tests
  add constraint doctor_case_tests_result_value_check
  check (result_value is null or result_value in ('positive', 'negative'));

grant select, insert, update, delete on table public.doctor_case_tests to authenticated;

drop policy if exists "doctor_case_tests_staff_update" on public.doctor_case_tests;
create policy "doctor_case_tests_staff_update" on public.doctor_case_tests
  for update to authenticated
  using (
    not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  )
  with check (
    not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  );

-- قراءة Storage: مسار تقرير التحليل يخص الطبيب المالك ولم تنتهِ صلاحيته
drop policy if exists "doctor_case_reports_doctor_read" on storage.objects;
create policy "doctor_case_reports_doctor_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'doctor-case-reports'
    and public.auth_is_doctor_user()
    and (
      exists (
        select 1
        from public.doctor_case_tests t
        join public.doctor_cases dc on dc.id = t.case_id
        where dc.doctor_user_id = auth.uid()
          and t.pdf_storage_path = storage.objects.name
          and t.pdf_expires_at is not null
          and t.pdf_expires_at > now()
      )
      or exists (
        select 1 from public.doctor_cases dc
        where dc.doctor_user_id = auth.uid()
          and dc.pdf_storage_path = storage.objects.name
          and dc.status = 'done'
          and dc.pdf_expires_at is not null
          and dc.pdf_expires_at > now()
      )
    )
  );

-- تنظيف التقارير المنتهية على مستوى التحليل والحالة
create or replace function public.doctor_cleanup_expired_case_pdfs()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from storage.objects o
  where o.bucket_id = 'doctor-case-reports'
    and (
      exists (
        select 1 from public.doctor_case_tests t
        where t.pdf_storage_path = o.name
          and t.pdf_expires_at is not null
          and t.pdf_expires_at <= now()
      )
      or exists (
        select 1 from public.doctor_cases dc
        where dc.pdf_storage_path = o.name
          and dc.pdf_expires_at is not null
          and dc.pdf_expires_at <= now()
      )
    );

  update public.doctor_case_tests
  set pdf_storage_path = null,
      pdf_expires_at = null
  where pdf_expires_at is not null
    and pdf_expires_at <= now();

  update public.doctor_cases
  set pdf_storage_path = null,
      pdf_expires_at = null
  where pdf_expires_at is not null
    and pdf_expires_at <= now();
end;
$$;

create or replace function public.doctor_case_test_mark_report_opened(p_test_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_opened timestamptz;
begin
  if auth.uid() is null or not public.auth_is_doctor_user() then
    raise exception 'forbidden';
  end if;

  update public.doctor_case_tests t
  set report_first_opened_at = now()
  from public.doctor_cases c
  where t.id = p_test_id
    and t.case_id = c.id
    and c.doctor_user_id = auth.uid()
    and t.pdf_storage_path is not null
    and t.report_first_opened_at is null
  returning t.report_first_opened_at into v_opened;

  if v_opened is not null then
    return v_opened;
  end if;

  select t.report_first_opened_at into v_opened
  from public.doctor_case_tests t
  join public.doctor_cases c on c.id = t.case_id
  where t.id = p_test_id
    and c.doctor_user_id = auth.uid();

  return v_opened;
end;
$$;

revoke all on function public.doctor_case_test_mark_report_opened(uuid) from public;
grant execute on function public.doctor_case_test_mark_report_opened(uuid) to authenticated;

-- عند الرفض: امسح تقارير التحاليل أيضاً
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
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;
  if public.auth_is_partner_lab_user() or public.auth_is_doctor_user() then
    raise exception 'forbidden';
  end if;
  if p_status not in ('pending', 'in_progress', 'rejected') then
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
  where id = p_case_id;

  if p_status = 'rejected' then
    update public.doctor_case_tests
    set
      pdf_storage_path = null,
      pdf_expires_at = null,
      result_value = null,
      report_first_opened_at = null
    where case_id = p_case_id;
  end if;
end;
$$;
