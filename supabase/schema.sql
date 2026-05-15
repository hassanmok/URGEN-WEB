-- URGEN Laboratory — تشغيل هذا الملف في SQL Editor في لوحة Supabase
-- Public read للفحوصات، وإدراج مواعيد للزوار (مع تحسين السياسات حسب احتياجكم لاحقاً)

create extension if not exists "pgcrypto";

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text,
  title_ar text not null,
  title_en text,
  description_ar text not null,
  description_en text,
  long_description_ar text,
  long_description_en text,
  clinical_use_ar text,
  clinical_use_en text,
  sample_ar text,
  sample_en text,
  method_ar text,
  method_en text,
  turnaround_ar text,
  turnaround_en text,
  price_display_ar text,
  price_display_en text,
  preparation_ar text,
  preparation_en text,
  limitation_note_ar text,
  limitation_note_en text,
  image_url text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ترقية جدول قديم إن وُجد بدون الأعمدة الإضافية
alter table public.tests add column if not exists category text;
alter table public.tests add column if not exists title_en text;
alter table public.tests add column if not exists description_en text;
alter table public.tests add column if not exists long_description_en text;
alter table public.tests add column if not exists clinical_use_ar text;
alter table public.tests add column if not exists clinical_use_en text;
alter table public.tests add column if not exists sample_ar text;
alter table public.tests add column if not exists sample_en text;
alter table public.tests add column if not exists method_ar text;
alter table public.tests add column if not exists method_en text;
alter table public.tests add column if not exists turnaround_ar text;
alter table public.tests add column if not exists turnaround_en text;
alter table public.tests add column if not exists price_display_ar text;
alter table public.tests add column if not exists price_display_en text;
alter table public.tests add column if not exists preparation_ar text;
alter table public.tests add column if not exists preparation_en text;
alter table public.tests add column if not exists limitation_note_ar text;
alter table public.tests add column if not exists limitation_note_en text;

-- محتوى الموقع القابل للتعديل (نصوص الصفحات الرئيسية وغيرها)
create table if not exists public.site_content (
  key text primary key,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

alter table public.site_content enable row level security;

drop policy if exists "site_content_select_public" on public.site_content;
create policy "site_content_select_public" on public.site_content
  for select using (true);

drop policy if exists "site_content_admin_all" on public.site_content;
create policy "site_content_admin_all" on public.site_content
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- رسائل نموذج التواصل
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  message text not null,
  created_at timestamptz default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists "contact_messages_insert_anon" on public.contact_messages;
create policy "contact_messages_insert_anon" on public.contact_messages
  for insert with check (true);

drop policy if exists "contact_messages_admin_select" on public.contact_messages;
create policy "contact_messages_admin_select" on public.contact_messages
  for select using (auth.role() = 'authenticated');

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

drop policy if exists "tests_admin_insert" on public.tests;
create policy "tests_admin_insert" on public.tests
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "tests_admin_update" on public.tests;
create policy "tests_admin_update" on public.tests
  for update using (auth.role() = 'authenticated');

drop policy if exists "tests_admin_delete" on public.tests;
create policy "tests_admin_delete" on public.tests
  for delete using (auth.role() = 'authenticated');

drop policy if exists "appointments_admin_select" on public.appointments;
create policy "appointments_admin_select" on public.appointments
  for select using (auth.role() = 'authenticated');

drop policy if exists "appointments_insert_anon" on public.appointments;
create policy "appointments_insert_anon" on public.appointments
  for insert with check (true);

-- أمثلة إدراج (اختياري)
insert into public.tests (slug, title_ar, description_ar, long_description_ar, image_url, sort_order)
values
  ('prenatal', 'التحليل الجيني قبل الولادة', 'فحص شامل للحمل.', 'تفاصيل إضافية للفحص.', null, 1),
  ('genetic-disease', 'تحليل الأمراض الوراثية', 'استكشاف الطفرات المرتبطة بالأمراض.', null, null, 2)
on conflict (slug) do nothing;

-- فعاليات المختبر (صفحة Events + لوحة الإدارة)
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  description_ar text not null,
  description_en text not null,
  event_date date not null,
  location_ar text,
  location_en text,
  image_url text,
  published boolean default true,
  created_at timestamptz default now()
);

alter table public.events enable row level security;

drop policy if exists "events_select_public" on public.events;
create policy "events_select_public" on public.events
  for select using (published = true);

drop policy if exists "events_select_admin" on public.events;
create policy "events_select_admin" on public.events
  for select using (auth.role() = 'authenticated');

drop policy if exists "events_insert_admin" on public.events;
create policy "events_insert_admin" on public.events
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "events_update_admin" on public.events;
create policy "events_update_admin" on public.events
  for update using (auth.role() = 'authenticated');

drop policy if exists "events_delete_admin" on public.events;
create policy "events_delete_admin" on public.events
  for delete using (auth.role() = 'authenticated');

-- أنشئ مستخدم إدارة من Supabase → Authentication → Users ثم سجّل الدخول من /admin

-- ─── Storage: صور الفعاليات (مضغوطة من لوحة /admin) ───
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-images',
  'event-images',
  true,
  524288,
  array['image/webp', 'image/jpeg', 'image/jpg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "event_images_public_read" on storage.objects;
create policy "event_images_public_read" on storage.objects
  for select using (bucket_id = 'event-images');

drop policy if exists "event_images_admin_insert" on storage.objects;
create policy "event_images_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-images');

drop policy if exists "event_images_admin_update" on storage.objects;
create policy "event_images_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'event-images');

drop policy if exists "event_images_admin_delete" on storage.objects;
create policy "event_images_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'event-images');
