-- خيار "أخرى" لنوع المرض والفحوصات المخصصة
-- نفّذ في Supabase SQL Editor

alter table public.doctor_cases add column if not exists disease_type_other text;

alter table public.doctor_cases drop constraint if exists doctor_cases_disease_type_check;
alter table public.doctor_cases add constraint doctor_cases_disease_type_check
  check (disease_type in ('oncology', 'reproductive', 'pediatric', 'other'));

alter table public.doctor_cases drop constraint if exists doctor_cases_oncology_fields;
alter table public.doctor_cases add constraint doctor_cases_oncology_fields check (
  disease_type <> 'oncology'
  or (
    oncology_tumor_type is not null
    and length(trim(oncology_tumor_type)) > 0
    and oncology_stage is not null
    and length(trim(oncology_stage)) > 0
    and oncology_treatment is not null
    and length(trim(oncology_treatment)) > 0
  )
);

alter table public.doctor_case_tests add column if not exists test_title_override text;
