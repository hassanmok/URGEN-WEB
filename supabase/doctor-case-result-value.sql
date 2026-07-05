-- نتيجة التحليل (موجب / سالب) — يحددها الإدارة عند رفع التقرير
-- نفّذ في Supabase SQL Editor

alter table public.doctor_cases add column if not exists result_value text;

alter table public.doctor_cases drop constraint if exists doctor_cases_result_value_check;
alter table public.doctor_cases add constraint doctor_cases_result_value_check
  check (result_value is null or result_value in ('positive', 'negative'));

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
