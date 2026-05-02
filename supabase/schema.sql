-- URGEN Laboratory — تشغيل هذا الملف في SQL Editor في لوحة Supabase
-- Public read للفحوصات، وإدراج مواعيد للزوار (مع تحسين السياسات حسب احتياجكم لاحقاً)

create extension if not exists "pgcrypto";

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_ar text not null,
  description_ar text not null,
  long_description_ar text,
  image_url text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  preferred_date date,
  test_slug text,
  notes text,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table public.tests enable row level security;
alter table public.appointments enable row level security;

drop policy if exists "tests_select_public" on public.tests;
create policy "tests_select_public" on public.tests for select using (true);

drop policy if exists "appointments_insert_anon" on public.appointments;
create policy "appointments_insert_anon" on public.appointments
  for insert with check (true);

-- أمثلة إدراج (اختياري)
insert into public.tests (slug, title_ar, description_ar, long_description_ar, image_url, sort_order)
values
  ('prenatal', 'التحليل الجيني قبل الولادة', 'فحص شامل للحمل.', 'تفاصيل إضافية للفحص.', null, 1),
  ('genetic-disease', 'تحليل الأمراض الوراثية', 'استكشاف الطفرات المرتبطة بالأمراض.', null, null, 2)
on conflict (slug) do nothing;
