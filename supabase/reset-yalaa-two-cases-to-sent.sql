-- =============================================================================
-- حذف بيانات التقرير وإرجاع حالتين لد. يلاّع إلى status = sent
-- المرضى فقط:
--   1) عليه حسن حمادى
--   2) ابتسام حسن حمود
-- نفّذ في Supabase SQL Editor
-- =============================================================================

do $$
declare
  v_doctor_id uuid;
  v_count int := 0;
begin
  select user_id into v_doctor_id
  from public.doctor_users
  where doctor_username = 'Yalaa.Saadi.Raouf'
  limit 1;

  if v_doctor_id is null then
    raise exception 'Doctor not found: Yalaa.Saadi.Raouf';
  end if;

  delete from public.doctor_report_ready_seen
  where case_id in (
    select id
    from public.doctor_cases
    where doctor_user_id = v_doctor_id
      and patient_full_name in ('عليه حسن حمادى', 'ابتسام حسن حمود')
  );

  update public.doctor_cases
  set
    status = 'sent',
    pdf_storage_path = null,
    pdf_expires_at = null,
    report_first_opened_at = null,
    result_value = null,
    rejection_reason = null,
    updated_at = now()
  where doctor_user_id = v_doctor_id
    and patient_full_name in ('عليه حسن حمادى', 'ابتسام حسن حمود');

  get diagnostics v_count = row_count;
  raise notice 'Updated % doctor_cases → status=sent, report cleared', v_count;

  if v_count = 0 then
    raise warning 'No matching cases found.';
  end if;
end;
$$;

-- تحقق
select
  dc.id,
  dc.patient_full_name,
  dc.status,
  dc.pdf_storage_path,
  dc.result_value
from public.doctor_cases dc
join public.doctor_users du on du.user_id = dc.doctor_user_id
where du.doctor_username = 'Yalaa.Saadi.Raouf'
  and dc.patient_full_name in ('عليه حسن حمادى', 'ابتسام حسن حمود');
