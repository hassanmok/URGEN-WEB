-- تسجيل أول مرة يفتح فيها الطبيب/المختبر تقرير PDF النتيجة
-- نفّذ في Supabase SQL Editor

alter table public.partner_submissions add column if not exists report_first_opened_at timestamptz;
alter table public.doctor_cases add column if not exists report_first_opened_at timestamptz;

create or replace function public.partner_submission_mark_report_opened(p_submission_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_opened timestamptz;
begin
  if auth.uid() is null or not public.auth_is_partner_lab_user() then
    raise exception 'forbidden';
  end if;

  update public.partner_submissions
  set report_first_opened_at = now()
  where id = p_submission_id
    and partner_user_id = auth.uid()
    and status = 'done'
    and pdf_storage_path is not null
    and report_first_opened_at is null
  returning report_first_opened_at into v_opened;

  if v_opened is not null then
    return v_opened;
  end if;

  select report_first_opened_at into v_opened
  from public.partner_submissions
  where id = p_submission_id
    and partner_user_id = auth.uid();

  return v_opened;
end;
$$;

create or replace function public.doctor_case_mark_report_opened(p_case_id uuid)
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

  update public.doctor_cases
  set report_first_opened_at = now()
  where id = p_case_id
    and doctor_user_id = auth.uid()
    and status = 'done'
    and pdf_storage_path is not null
    and report_first_opened_at is null
  returning report_first_opened_at into v_opened;

  if v_opened is not null then
    return v_opened;
  end if;

  select report_first_opened_at into v_opened
  from public.doctor_cases
  where id = p_case_id
    and doctor_user_id = auth.uid();

  return v_opened;
end;
$$;

revoke all on function public.partner_submission_mark_report_opened(uuid) from public;
grant execute on function public.partner_submission_mark_report_opened(uuid) to authenticated;

revoke all on function public.doctor_case_mark_report_opened(uuid) from public;
grant execute on function public.doctor_case_mark_report_opened(uuid) to authenticated;
