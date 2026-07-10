-- إشعارات طلبات الأطباء في لوحة الإدارة (مزامنة بين الأجهزة)
-- نفّذ في Supabase SQL Editor

create table if not exists public.doctor_case_admin_seen (
  staff_user_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid not null references public.doctor_cases (id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (staff_user_id, case_id)
);

create index if not exists doctor_case_admin_seen_staff_idx
  on public.doctor_case_admin_seen (staff_user_id, seen_at desc);

alter table public.doctor_case_admin_seen enable row level security;

drop policy if exists "doctor_case_admin_seen_staff" on public.doctor_case_admin_seen;
create policy "doctor_case_admin_seen_staff" on public.doctor_case_admin_seen
  for all to authenticated
  using (
    staff_user_id = auth.uid()
    and not public.auth_is_partner_lab_user()
  )
  with check (
    staff_user_id = auth.uid()
    and not public.auth_is_partner_lab_user()
  );

create or replace function public.doctor_case_mark_seen(p_case_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.auth_is_partner_lab_user() then
    raise exception 'forbidden';
  end if;
  if p_case_id is null then
    return;
  end if;
  insert into public.doctor_case_admin_seen (staff_user_id, case_id, seen_at)
  values (auth.uid(), p_case_id, now())
  on conflict (staff_user_id, case_id) do update set seen_at = excluded.seen_at;
end;
$$;

revoke all on function public.doctor_case_mark_seen(uuid) from public;
grant execute on function public.doctor_case_mark_seen(uuid) to authenticated;

create or replace function public.doctor_case_seen_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select s.case_id
  from public.doctor_case_admin_seen s
  where s.staff_user_id = auth.uid()
    and not public.auth_is_partner_lab_user();
$$;

revoke all on function public.doctor_case_seen_ids() from public;
grant execute on function public.doctor_case_seen_ids() to authenticated;
