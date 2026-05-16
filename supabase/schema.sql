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

-- ─── بوابة المختبرات الشريكة (/partner) ───
-- أنشئ مستخدم Auth لكل مختبر من Authentication → Users ثم أضف صفاً هنا:
-- insert into public.partner_lab_users (user_id, lab_display_name, partner_username)
-- values ('<uuid من auth.users>', 'اسم المختبر', 'رمز-المختبر-بدون-مسافات');

create table if not exists public.partner_lab_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  lab_display_name text not null,
  partner_username text,
  created_at timestamptz default now()
);

alter table public.partner_lab_users enable row level security;

-- لا تستخدم DROP لهذه الدالة؛ سياسات RLS تعتمد عليها ولن يُسمح بالحذف (ERROR 2BP01).
create or replace function public.auth_is_partner_lab_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.partner_lab_users pl
    where pl.user_id = auth.uid()
  );
$$;

grant execute on function public.auth_is_partner_lab_user() to authenticated;

drop policy if exists "partner_lab_users_select" on public.partner_lab_users;
create policy "partner_lab_users_select" on public.partner_lab_users
  for select to authenticated
  using (
    user_id = auth.uid()
    or not public.auth_is_partner_lab_user()
  );

drop policy if exists "partner_lab_users_staff_insert" on public.partner_lab_users;
create policy "partner_lab_users_staff_insert" on public.partner_lab_users
  for insert to authenticated
  with check (not public.auth_is_partner_lab_user());

drop policy if exists "partner_lab_users_staff_delete" on public.partner_lab_users;
create policy "partner_lab_users_staff_delete" on public.partner_lab_users
  for delete to authenticated
  using (not public.auth_is_partner_lab_user());

-- لا تستخدم DROP؛ العملاء (RPC) قد يعتمدون على الدالة.
create or replace function public.get_my_partner_lab()
returns table (lab_display_name text)
language sql
stable
security definer
set search_path = public
as $$
  select pl.lab_display_name
  from public.partner_lab_users pl
  where pl.user_id = auth.uid()
  limit 1;
$$;

grant execute on function public.get_my_partner_lab() to authenticated;

alter table public.partner_lab_users add column if not exists partner_username text;

create unique index if not exists partner_lab_users_partner_username_key
  on public.partner_lab_users ((lower(trim(partner_username))))
  where partner_username is not null and length(trim(partner_username)) > 0;

-- تسجيل الدخول بالاسم المستخدم: إرجاع البريد المرتبط بحساب Auth للمختبر (أو المطابقة المباشرة للبريد)
create or replace function public.partner_resolve_login(p_username text)
returns table (email text)
language sql
stable
security definer
set search_path = public
as $$
  select u.email::text
  from auth.users u
  inner join public.partner_lab_users pl on pl.user_id = u.id
  where (
      pl.partner_username is not null
      and lower(trim(pl.partner_username)) = lower(trim(p_username))
    )
    or lower(trim(u.email::text)) = lower(trim(p_username))
  limit 1;
$$;

revoke all on function public.partner_resolve_login(text) from public;
grant execute on function public.partner_resolve_login(text) to anon;
grant execute on function public.partner_resolve_login(text) to authenticated;

comment on function public.partner_resolve_login(text) is
  'قبل signIn: يحوّل partner_username أو البريد إلى البريد المعتمد في Auth لمستخدم مختبر مسجّل في partner_lab_users.';

-- قائمة حسابات المختبرات (بريد + اسم + يوزر) لموظفي الإدارة فقط — ليس للشركاء
create or replace function public.partner_lab_users_admin_list()
returns table (
  user_id uuid,
  email text,
  lab_display_name text,
  partner_username text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select pl.user_id, u.email::text, pl.lab_display_name, pl.partner_username, pl.created_at
  from public.partner_lab_users pl
  inner join auth.users u on u.id = pl.user_id
  where not exists (
    select 1 from public.partner_lab_users pl2 where pl2.user_id = auth.uid()
  )
  order by pl.created_at desc nulls last;
$$;

revoke all on function public.partner_lab_users_admin_list() from public;
grant execute on function public.partner_lab_users_admin_list() to authenticated;

comment on function public.partner_lab_users_admin_list() is
  'لوحة الإدارة: يعرض المختبرات المسجّلة مع البريد. يُرفض ضمنياً للمستخدمين المسجّلين كشركاء (لا صفوف).';

create table if not exists public.partner_submissions (
  id uuid primary key default gen_random_uuid(),
  partner_user_id uuid not null references auth.users (id) on delete cascade,
  patient_full_name text not null,
  age_value int not null check (age_value > 0 and age_value < 100000),
  age_unit text not null check (age_unit in ('days', 'months', 'years')),
  test_slug text not null,
  status text not null default 'sent'
    check (status in ('sent', 'pending', 'in_progress', 'rejected', 'done')),
  pdf_storage_path text,
  pdf_expires_at timestamptz,
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists partner_submissions_partner_idx
  on public.partner_submissions (partner_user_id, created_at desc);

alter table public.partner_submissions enable row level security;

drop policy if exists "partner_submissions_partner_insert" on public.partner_submissions;
create policy "partner_submissions_partner_insert" on public.partner_submissions
  for insert to authenticated
  with check (
    partner_user_id = auth.uid()
    and public.auth_is_partner_lab_user()
    and status = 'sent'
  );

drop policy if exists "partner_submissions_partner_select" on public.partner_submissions;
create policy "partner_submissions_partner_select" on public.partner_submissions
  for select to authenticated
  using (
    partner_user_id = auth.uid()
    and public.auth_is_partner_lab_user()
  );

drop policy if exists "partner_submissions_staff_select" on public.partner_submissions;
create policy "partner_submissions_staff_select" on public.partner_submissions
  for select to authenticated
  using (not public.auth_is_partner_lab_user());

drop policy if exists "partner_submissions_staff_update" on public.partner_submissions;
create policy "partner_submissions_staff_update" on public.partner_submissions
  for update to authenticated
  using (not public.auth_is_partner_lab_user())
  with check (not public.auth_is_partner_lab_user());

create or replace function public.partner_submissions_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists partner_submissions_updated_at on public.partner_submissions;
create trigger partner_submissions_updated_at
  before update on public.partner_submissions
  for each row execute function public.partner_submissions_set_updated_at();

-- قواعد بيانات موجودة مسبقاً: وسّع check لتسمح بـ sent وحدّث الافتراضي (مرّة واحدة في SQL Editor)
alter table public.partner_submissions drop constraint if exists partner_submissions_status_check;
alter table public.partner_submissions add constraint partner_submissions_status_check
  check (status in ('sent', 'pending', 'in_progress', 'rejected', 'done'));
alter table public.partner_submissions alter column status set default 'sent';

-- Storage: تقارير PDF للمختبرات (خاص، صلاحيات أدناه)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'partner-reports',
  'partner-reports',
  false,
  15728640,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "partner_reports_staff_all" on storage.objects;
create policy "partner_reports_staff_all" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'partner-reports'
    and not public.auth_is_partner_lab_user()
  )
  with check (
    bucket_id = 'partner-reports'
    and not public.auth_is_partner_lab_user()
  );

drop policy if exists "partner_reports_partner_read" on storage.objects;
create policy "partner_reports_partner_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'partner-reports'
    and public.auth_is_partner_lab_user()
    and exists (
      select 1 from public.partner_submissions ps
      where ps.partner_user_id = auth.uid()
        and ps.pdf_storage_path = storage.objects.name
        and ps.status = 'done'
        and ps.pdf_expires_at is not null
        and ps.pdf_expires_at > now()
    )
  );

-- بعد انتهاء صلاحية التحميل: حذف الملف من Storage وتفريغ الحقلين في الجدول (جدول pg_cron أو تشغيل يدوي)
create or replace function public.partner_cleanup_expired_partner_pdfs()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from storage.objects o
  where o.bucket_id = 'partner-reports'
    and exists (
      select 1
      from public.partner_submissions ps
      where ps.pdf_storage_path = o.name
        and ps.pdf_expires_at is not null
        and ps.pdf_expires_at <= now()
    );

  update public.partner_submissions
  set pdf_storage_path = null,
      pdf_expires_at = null
  where pdf_expires_at is not null
    and pdf_expires_at <= now();
end;
$$;

revoke all on function public.partner_cleanup_expired_partner_pdfs() from public;
comment on function public.partner_cleanup_expired_partner_pdfs() is
  'تشغيل دوري (مثلاً يومياً عبر pg_cron): حذف PDF منتهية الصلاحية من التخزين ومسح المرجع من partner_submissions.';
