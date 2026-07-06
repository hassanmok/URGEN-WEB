-- إشعارات «التقرير جاهز» للمختبرات والأطباء
-- نفّذ في Supabase SQL Editor

create table if not exists public.partner_report_ready_seen (
  partner_user_id uuid not null references auth.users (id) on delete cascade,
  submission_id uuid not null references public.partner_submissions (id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (partner_user_id, submission_id)
);

create index if not exists partner_report_ready_seen_user_idx
  on public.partner_report_ready_seen (partner_user_id, seen_at desc);

alter table public.partner_report_ready_seen enable row level security;

drop policy if exists "partner_report_ready_seen_own" on public.partner_report_ready_seen;
create policy "partner_report_ready_seen_own" on public.partner_report_ready_seen
  for all to authenticated
  using (
    partner_user_id = auth.uid()
    and public.auth_is_partner_lab_user()
  )
  with check (
    partner_user_id = auth.uid()
    and public.auth_is_partner_lab_user()
  );

create table if not exists public.doctor_report_ready_seen (
  doctor_user_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid not null references public.doctor_cases (id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (doctor_user_id, case_id)
);

create index if not exists doctor_report_ready_seen_user_idx
  on public.doctor_report_ready_seen (doctor_user_id, seen_at desc);

alter table public.doctor_report_ready_seen enable row level security;

drop policy if exists "doctor_report_ready_seen_own" on public.doctor_report_ready_seen;
create policy "doctor_report_ready_seen_own" on public.doctor_report_ready_seen
  for all to authenticated
  using (
    doctor_user_id = auth.uid()
    and public.auth_is_doctor_user()
  )
  with check (
    doctor_user_id = auth.uid()
    and public.auth_is_doctor_user()
  );
