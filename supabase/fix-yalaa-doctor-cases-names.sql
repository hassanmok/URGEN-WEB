-- Fix patient names for Dr. Yalaa cases already imported with '—' placeholders.
-- Run once in Supabase SQL Editor after the initial seed import.

do $$
declare
  v_doctor_id uuid;
  v_count int;
begin
  select user_id into v_doctor_id
  from public.doctor_users
  where doctor_username = 'Yalaa.Saadi.Raouf'
  limit 1;

  if v_doctor_id is null then
    raise exception 'Doctor not found: doctor_username = Yalaa.Saadi.Raouf';
  end if;

  update public.doctor_cases c
  set
    patient_name2 = case when patient_name2 = '—' then '' else patient_name2 end,
    patient_name3 = case when patient_name3 = '—' then '' else patient_name3 end,
    patient_name4 = case when patient_name4 = '—' then '' else patient_name4 end,
    patient_full_name = trim(
      regexp_replace(
        concat_ws(
          ' ',
          nullif(trim(c.patient_name1), ''),
          nullif(
            case when c.patient_name2 = '—' then '' else trim(c.patient_name2) end,
            ''
          ),
          nullif(
            case when c.patient_name3 = '—' then '' else trim(c.patient_name3) end,
            ''
          ),
          nullif(
            case when c.patient_name4 = '—' then '' else trim(c.patient_name4) end,
            ''
          )
        ),
        '\s+',
        ' ',
        'g'
      )
    )
  where c.doctor_user_id = v_doctor_id
    and (
      c.patient_name2 = '—'
      or c.patient_name3 = '—'
      or c.patient_name4 = '—'
      or c.patient_full_name like '%—%'
    );

  get diagnostics v_count = row_count;
  raise notice 'Updated % doctor_cases name fields for Dr. Yalaa', v_count;
end $$;
