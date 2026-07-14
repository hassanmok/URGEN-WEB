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

-- إزالة أعمدة التحضير والملاحظات إن وُجدت (لم تعد مستخدمة)
alter table public.tests drop column if exists preparation_ar;
alter table public.tests drop column if exists preparation_en;
alter table public.tests drop column if exists limitation_note_ar;
alter table public.tests drop column if exists limitation_note_en;

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

-- تصنيفات الفحوصات (قابلة للإدارة من لوحة الإدارة)
create table if not exists public.test_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_ar text not null,
  title_en text,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

alter table public.test_categories enable row level security;

drop policy if exists "test_categories_select_public" on public.test_categories;
create policy "test_categories_select_public" on public.test_categories
  for select using (true);

drop policy if exists "test_categories_admin_insert" on public.test_categories;
create policy "test_categories_admin_insert" on public.test_categories
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "test_categories_admin_update" on public.test_categories;
create policy "test_categories_admin_update" on public.test_categories
  for update using (auth.role() = 'authenticated');

drop policy if exists "test_categories_admin_delete" on public.test_categories;
create policy "test_categories_admin_delete" on public.test_categories
  for delete using (auth.role() = 'authenticated');

insert into public.test_categories (slug, title_ar, title_en, sort_order)
values
  ('immunohistochemistry', 'Immunohistochemistry', 'Immunohistochemistry', 1),
  ('oncology_somatic', 'Oncology', 'Oncology', 2),
  ('hereditary_cancer', 'Hereditary Cancer Genetics', 'Hereditary Cancer Genetics', 3),
  ('reproductive', 'Reproductive Health', 'Reproductive Health', 4),
  ('nipt', 'Non-Invasive Prenatal Testing (NIPT)', 'Non-Invasive Prenatal Testing (NIPT)', 5),
  ('pediatric_newborn', 'Pediatric', 'Pediatric', 6)
on conflict (slug) do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  sort_order = excluded.sort_order;

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
  body_ar text not null default '',
  body_en text not null default '',
  event_date date not null,
  location_ar text,
  location_en text,
  image_url text,
  published boolean default true,
  created_at timestamptz default now()
);

alter table public.events add column if not exists body_ar text not null default '';
alter table public.events add column if not exists body_en text not null default '';

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

-- أخبار المختبر (صفحة News + لوحة الإدارة)
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  summary_ar text not null,
  summary_en text not null,
  body_ar text not null,
  body_en text not null,
  cover_image_url text,
  published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.news_images (
  id uuid primary key default gen_random_uuid(),
  news_id uuid not null references public.news (id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0,
  caption_ar text,
  caption_en text,
  created_at timestamptz default now()
);

create index if not exists news_images_news_idx on public.news_images (news_id, sort_order);

alter table public.news enable row level security;
alter table public.news_images enable row level security;

drop policy if exists "news_select_public" on public.news;
create policy "news_select_public" on public.news
  for select using (published = true);

drop policy if exists "news_select_admin" on public.news;
create policy "news_select_admin" on public.news
  for select using (auth.role() = 'authenticated');

drop policy if exists "news_insert_admin" on public.news;
create policy "news_insert_admin" on public.news
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "news_update_admin" on public.news;
create policy "news_update_admin" on public.news
  for update using (auth.role() = 'authenticated');

drop policy if exists "news_delete_admin" on public.news;
create policy "news_delete_admin" on public.news
  for delete using (auth.role() = 'authenticated');

drop policy if exists "news_images_select_public" on public.news_images;
create policy "news_images_select_public" on public.news_images
  for select using (
    exists (select 1 from public.news n where n.id = news_id and n.published = true)
  );

drop policy if exists "news_images_select_admin" on public.news_images;
create policy "news_images_select_admin" on public.news_images
  for select using (auth.role() = 'authenticated');

drop policy if exists "news_images_insert_admin" on public.news_images;
create policy "news_images_insert_admin" on public.news_images
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "news_images_update_admin" on public.news_images;
create policy "news_images_update_admin" on public.news_images
  for update using (auth.role() = 'authenticated');

drop policy if exists "news_images_delete_admin" on public.news_images;
create policy "news_images_delete_admin" on public.news_images
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

-- Storage: صور الأخبار
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'news-images',
  'news-images',
  true,
  524288,
  array['image/webp', 'image/jpeg', 'image/jpg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "news_images_public_read" on storage.objects;
create policy "news_images_public_read" on storage.objects
  for select using (bucket_id = 'news-images');

drop policy if exists "news_images_admin_insert" on storage.objects;
create policy "news_images_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'news-images');

drop policy if exists "news_images_admin_update" on storage.objects;
create policy "news_images_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'news-images');

drop policy if exists "news_images_admin_delete" on storage.objects;
create policy "news_images_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'news-images');

-- ─── بوابة المختبرات الشريكة (/partner) ───
-- أنشئ مستخدم Auth لكل مختبر من Authentication → Users ثم أضف صفاً هنا:
-- insert into public.partner_lab_users (user_id, lab_display_name, partner_username)
-- values ('<uuid من auth.users>', 'اسم المختبر', 'رمز-المختبر-بدون-مسافات');

create table if not exists public.partner_lab_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  lab_display_name text not null,
  partner_username text,
  country_code text,
  governorate_id text,
  region_id text,
  is_locked boolean not null default false,
  created_at timestamptz default now()
);

alter table public.partner_lab_users add column if not exists country_code text;
alter table public.partner_lab_users add column if not exists governorate_id text;
alter table public.partner_lab_users add column if not exists region_id text;
alter table public.partner_lab_users add column if not exists is_locked boolean not null default false;

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
  where pl.is_locked is not true
    and (
      (
        pl.partner_username is not null
        and lower(trim(pl.partner_username)) = lower(trim(p_username))
      )
      or lower(trim(u.email::text)) = lower(trim(p_username))
    )
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
  country_code text,
  governorate_id text,
  region_id text,
  is_locked boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pl.user_id,
    u.email::text,
    pl.lab_display_name,
    pl.partner_username,
    pl.country_code,
    pl.governorate_id,
    pl.region_id,
    pl.is_locked,
    pl.created_at
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
  batch_id uuid,
  patient_full_name text not null,
  age_value int not null check (age_value > 0 and age_value < 100000),
  age_unit text not null check (age_unit in ('days', 'months', 'years')),
  test_slug text not null,
  test_title_override text,
  status text not null default 'sent'
    check (status in ('sent', 'pending', 'in_progress', 'rejected', 'done')),
  pdf_storage_path text,
  pdf_expires_at timestamptz,
  report_first_opened_at timestamptz,
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.partner_submissions add column if not exists batch_id uuid;
alter table public.partner_submissions add column if not exists test_title_override text;
alter table public.partner_submissions add column if not exists report_first_opened_at timestamptz;

create index if not exists partner_submissions_partner_idx
  on public.partner_submissions (partner_user_id, created_at desc);

create index if not exists partner_submissions_batch_idx
  on public.partner_submissions (batch_id)
  where batch_id is not null;

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

drop policy if exists "partner_submissions_partner_delete" on public.partner_submissions;
create policy "partner_submissions_partner_delete" on public.partner_submissions
  for delete to authenticated
  using (
    partner_user_id = auth.uid()
    and public.auth_is_partner_lab_user()
    and status = 'sent'
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

-- قائمة طلبات المختبرات لموظفي الإدارة (ليس للشركاء) — يتجاوز RLS عند الحاجة
create or replace function public.partner_submissions_admin_list()
returns setof public.partner_submissions
language sql
stable
security definer
set search_path = public
as $$
  select ps.*
  from public.partner_submissions ps
  where auth.uid() is not null
    and not exists (
      select 1 from public.partner_lab_users pl where pl.user_id = auth.uid()
    )
  order by ps.created_at desc nulls last;
$$;

revoke all on function public.partner_submissions_admin_list() from public;
grant execute on function public.partner_submissions_admin_list() to authenticated;

comment on function public.partner_submissions_admin_list() is
  'لوحة الإدارة: جميع طلبات المختبرات. مرفوض للمستخدمين المسجّلين كشركاء.';

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

-- تتبع طلبات المختبرات التي شاهدها موظف الإدارة (مزامنة بين الأجهزة)
create table if not exists public.partner_submission_admin_seen (
  staff_user_id uuid not null references auth.users (id) on delete cascade,
  group_key text not null,
  seen_at timestamptz not null default now(),
  primary key (staff_user_id, group_key)
);

create index if not exists partner_submission_admin_seen_staff_idx
  on public.partner_submission_admin_seen (staff_user_id, seen_at desc);

alter table public.partner_submission_admin_seen enable row level security;

drop policy if exists "partner_submission_admin_seen_staff" on public.partner_submission_admin_seen;
create policy "partner_submission_admin_seen_staff" on public.partner_submission_admin_seen
  for all to authenticated
  using (
    staff_user_id = auth.uid()
    and not public.auth_is_partner_lab_user()
  )
  with check (
    staff_user_id = auth.uid()
    and not public.auth_is_partner_lab_user()
  );

create or replace function public.partner_submission_mark_group_seen(p_group_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.auth_is_partner_lab_user() then
    raise exception 'forbidden';
  end if;
  if length(trim(coalesce(p_group_key, ''))) = 0 then
    return;
  end if;
  insert into public.partner_submission_admin_seen (staff_user_id, group_key, seen_at)
  values (auth.uid(), trim(p_group_key), now())
  on conflict (staff_user_id, group_key) do update set seen_at = excluded.seen_at;
end;
$$;

revoke all on function public.partner_submission_mark_group_seen(text) from public;
grant execute on function public.partner_submission_mark_group_seen(text) to authenticated;

comment on function public.partner_submission_mark_group_seen(text) is
  'لوحة الإدارة: تسجيل أن موظف الإدارة شاهد مجموعة طلب (batch أو طلب منفرد).';

create or replace function public.partner_submission_seen_group_keys()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select s.group_key
  from public.partner_submission_admin_seen s
  where s.staff_user_id = auth.uid()
    and not public.auth_is_partner_lab_user();
$$;

revoke all on function public.partner_submission_seen_group_keys() from public;
grant execute on function public.partner_submission_seen_group_keys() to authenticated;

comment on function public.partner_submission_seen_group_keys() is
  'لوحة الإدارة: مفاتيح مجموعات الطلبات التي شاهدها المستخدم الحالي.';

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

-- ─── بوابة الأطباء (/doctor) ───

create table if not exists public.doctor_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  doctor_username text,
  is_locked boolean not null default false,
  created_at timestamptz default now()
);

alter table public.doctor_users add column if not exists doctor_username text;
alter table public.doctor_users add column if not exists is_locked boolean not null default false;

alter table public.doctor_users enable row level security;

create or replace function public.auth_is_doctor_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.doctor_users d
    where d.user_id = auth.uid()
  );
$$;

grant execute on function public.auth_is_doctor_user() to authenticated;

drop policy if exists "doctor_users_select" on public.doctor_users;
create policy "doctor_users_select" on public.doctor_users
  for select to authenticated
  using (
    user_id = auth.uid()
    or (
      not public.auth_is_partner_lab_user()
      and not public.auth_is_doctor_user()
    )
  );

drop policy if exists "doctor_users_staff_insert" on public.doctor_users;
create policy "doctor_users_staff_insert" on public.doctor_users
  for insert to authenticated
  with check (
    not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  );

drop policy if exists "doctor_users_staff_delete" on public.doctor_users;
create policy "doctor_users_staff_delete" on public.doctor_users
  for delete to authenticated
  using (
    not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  );

create unique index if not exists doctor_users_doctor_username_key
  on public.doctor_users ((lower(trim(doctor_username))))
  where doctor_username is not null and length(trim(doctor_username)) > 0;

create or replace function public.get_my_doctor_profile()
returns table (display_name text)
language sql
stable
security definer
set search_path = public
as $$
  select d.display_name
  from public.doctor_users d
  where d.user_id = auth.uid()
    and d.is_locked is not true
  limit 1;
$$;

grant execute on function public.get_my_doctor_profile() to authenticated;

create or replace function public.doctor_resolve_login(p_username text)
returns table (email text)
language sql
stable
security definer
set search_path = public
as $$
  select u.email::text
  from auth.users u
  inner join public.doctor_users d on d.user_id = u.id
  where d.is_locked is not true
    and (
      (
        d.doctor_username is not null
        and lower(trim(d.doctor_username)) = lower(trim(p_username))
      )
      or lower(trim(u.email::text)) = lower(trim(p_username))
    )
  limit 1;
$$;

revoke all on function public.doctor_resolve_login(text) from public;
grant execute on function public.doctor_resolve_login(text) to anon;
grant execute on function public.doctor_resolve_login(text) to authenticated;

create or replace function public.doctor_users_admin_list()
returns table (
  user_id uuid,
  email text,
  display_name text,
  doctor_username text,
  is_locked boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.user_id,
    u.email::text,
    d.display_name,
    d.doctor_username,
    d.is_locked,
    d.created_at
  from public.doctor_users d
  inner join auth.users u on u.id = d.user_id
  where not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  order by d.created_at desc nulls last;
$$;

revoke all on function public.doctor_users_admin_list() from public;
grant execute on function public.doctor_users_admin_list() to authenticated;

create table if not exists public.doctor_cases (
  id uuid primary key default gen_random_uuid(),
  doctor_user_id uuid not null references auth.users (id) on delete cascade,
  patient_name1 text not null,
  patient_name2 text not null,
  patient_name3 text not null,
  patient_name4 text not null,
  patient_full_name text not null,
  age_value int not null check (age_value > 0 and age_value < 100000),
  age_unit text not null check (age_unit in ('days', 'months', 'years')),
  gender text not null check (gender in ('male', 'female', 'other')),
  diagnosis text not null,
  disease_type text not null check (disease_type in ('oncology', 'reproductive', 'pediatric', 'other')),
  disease_type_other text,
  oncology_tumor_type text,
  oncology_stage text,
  oncology_treatment text,
  status text not null default 'sent'
    check (status in ('sent', 'pending', 'in_progress', 'rejected', 'done')),
  pdf_storage_path text,
  pdf_expires_at timestamptz,
  report_first_opened_at timestamptz,
  result_value text check (result_value is null or result_value in ('positive', 'negative')),
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint doctor_cases_oncology_fields check (
    disease_type <> 'oncology'
    or (
      oncology_tumor_type is not null
      and length(trim(oncology_tumor_type)) > 0
      and oncology_stage is not null
      and length(trim(oncology_stage)) > 0
      and oncology_treatment is not null
      and length(trim(oncology_treatment)) > 0
    )
  )
);

alter table public.doctor_cases add column if not exists status text;
alter table public.doctor_cases add column if not exists rejection_reason text;
alter table public.doctor_cases add column if not exists pdf_storage_path text;
alter table public.doctor_cases add column if not exists pdf_expires_at timestamptz;
alter table public.doctor_cases add column if not exists report_first_opened_at timestamptz;
alter table public.doctor_cases add column if not exists result_value text;
alter table public.doctor_cases alter column status set default 'sent';
update public.doctor_cases set status = 'sent' where status is null;
alter table public.doctor_cases alter column status set not null;

alter table public.doctor_cases drop constraint if exists doctor_cases_status_check;
update public.doctor_cases set status = 'pending' where status = 'accepted';
alter table public.doctor_cases add constraint doctor_cases_status_check
  check (status in ('sent', 'pending', 'in_progress', 'rejected', 'done'));

alter table public.doctor_cases drop constraint if exists doctor_cases_result_value_check;
alter table public.doctor_cases add constraint doctor_cases_result_value_check
  check (result_value is null or result_value in ('positive', 'negative'));

create index if not exists doctor_cases_doctor_idx
  on public.doctor_cases (doctor_user_id, created_at desc);

alter table public.doctor_cases enable row level security;

drop policy if exists "doctor_cases_doctor_select" on public.doctor_cases;
create policy "doctor_cases_doctor_select" on public.doctor_cases
  for select to authenticated
  using (
    doctor_user_id = auth.uid()
    and public.auth_is_doctor_user()
  );

drop policy if exists "doctor_cases_doctor_insert" on public.doctor_cases;
create policy "doctor_cases_doctor_insert" on public.doctor_cases
  for insert to authenticated
  with check (
    doctor_user_id = auth.uid()
    and public.auth_is_doctor_user()
    and status = 'sent'
  );

drop policy if exists "doctor_cases_doctor_update" on public.doctor_cases;
create policy "doctor_cases_doctor_update" on public.doctor_cases
  for update to authenticated
  using (
    doctor_user_id = auth.uid()
    and public.auth_is_doctor_user()
    and status = 'sent'
  )
  with check (
    doctor_user_id = auth.uid()
    and public.auth_is_doctor_user()
    and status = 'sent'
  );

drop policy if exists "doctor_cases_staff_select" on public.doctor_cases;
create policy "doctor_cases_staff_select" on public.doctor_cases
  for select to authenticated
  using (
    not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  );

drop policy if exists "doctor_cases_staff_update" on public.doctor_cases;
create policy "doctor_cases_staff_update" on public.doctor_cases
  for update to authenticated
  using (
    not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  )
  with check (
    not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  );

-- قبول/رفض حالة الطبيب من الإدارة (يتجاوز فشل RLS الصامت على update)
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

revoke all on function public.doctor_case_admin_set_status(uuid, text, text) from public;
grant execute on function public.doctor_case_admin_set_status(uuid, text, text) to authenticated;

comment on function public.doctor_case_admin_set_status(uuid, text, text) is
  'لوحة الإدارة: تحديث حالة طلب الطبيب (sent / pending / in_progress / rejected / done).';

grant select, update on table public.doctor_cases to authenticated;

-- تحاليل مرتبطة بطلب الطبيب (اختيار متعدد من جدول tests)
alter table public.doctor_cases add column if not exists disease_type_other text;

alter table public.doctor_cases drop constraint if exists doctor_cases_disease_type_check;
alter table public.doctor_cases add constraint doctor_cases_disease_type_check
  check (disease_type in ('oncology', 'reproductive', 'pediatric', 'other'));

alter table public.doctor_case_tests add column if not exists test_title_override text;
alter table public.doctor_case_tests add column if not exists pdf_storage_path text;
alter table public.doctor_case_tests add column if not exists pdf_expires_at timestamptz;
alter table public.doctor_case_tests add column if not exists result_value text;
alter table public.doctor_case_tests add column if not exists report_first_opened_at timestamptz;

create table if not exists public.doctor_case_tests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.doctor_cases (id) on delete cascade,
  test_slug text not null,
  test_title_override text,
  pdf_storage_path text,
  pdf_expires_at timestamptz,
  result_value text,
  report_first_opened_at timestamptz,
  created_at timestamptz default now(),
  unique (case_id, test_slug)
);

create index if not exists doctor_case_tests_case_idx
  on public.doctor_case_tests (case_id);

alter table public.doctor_case_tests enable row level security;

drop policy if exists "doctor_case_tests_doctor_select" on public.doctor_case_tests;
create policy "doctor_case_tests_doctor_select" on public.doctor_case_tests
  for select to authenticated
  using (
    exists (
      select 1 from public.doctor_cases c
      where c.id = case_id
        and c.doctor_user_id = auth.uid()
        and public.auth_is_doctor_user()
    )
  );

drop policy if exists "doctor_case_tests_doctor_insert" on public.doctor_case_tests;
create policy "doctor_case_tests_doctor_insert" on public.doctor_case_tests
  for insert to authenticated
  with check (
    exists (
      select 1 from public.doctor_cases c
      where c.id = case_id
        and c.doctor_user_id = auth.uid()
        and public.auth_is_doctor_user()
        and c.status = 'sent'
    )
  );

drop policy if exists "doctor_case_tests_doctor_delete" on public.doctor_case_tests;
create policy "doctor_case_tests_doctor_delete" on public.doctor_case_tests
  for delete to authenticated
  using (
    exists (
      select 1 from public.doctor_cases c
      where c.id = case_id
        and c.doctor_user_id = auth.uid()
        and public.auth_is_doctor_user()
        and c.status = 'sent'
    )
  );

drop policy if exists "doctor_case_tests_staff_select" on public.doctor_case_tests;
create policy "doctor_case_tests_staff_select" on public.doctor_case_tests
  for select to authenticated
  using (
    not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  );

drop policy if exists "doctor_case_tests_staff_update" on public.doctor_case_tests;
create policy "doctor_case_tests_staff_update" on public.doctor_case_tests
  for update to authenticated
  using (
    not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  )
  with check (
    not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  );

grant select, insert, update, delete on table public.doctor_case_tests to authenticated;

grant select, delete on table public.doctor_case_files to authenticated;

create table if not exists public.doctor_case_files (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.doctor_cases (id) on delete cascade,
  doctor_user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  byte_size bigint,
  created_at timestamptz default now()
);

create index if not exists doctor_case_files_case_idx
  on public.doctor_case_files (case_id);

alter table public.doctor_case_files enable row level security;

drop policy if exists "doctor_case_files_doctor_select" on public.doctor_case_files;
create policy "doctor_case_files_doctor_select" on public.doctor_case_files
  for select to authenticated
  using (
    doctor_user_id = auth.uid()
    and public.auth_is_doctor_user()
  );

drop policy if exists "doctor_case_files_doctor_insert" on public.doctor_case_files;
create policy "doctor_case_files_doctor_insert" on public.doctor_case_files
  for insert to authenticated
  with check (
    doctor_user_id = auth.uid()
    and public.auth_is_doctor_user()
    and exists (
      select 1 from public.doctor_cases c
      where c.id = case_id
        and c.doctor_user_id = auth.uid()
        and c.status = 'sent'
    )
  );

drop policy if exists "doctor_case_files_doctor_delete" on public.doctor_case_files;
create policy "doctor_case_files_doctor_delete" on public.doctor_case_files
  for delete to authenticated
  using (
    doctor_user_id = auth.uid()
    and public.auth_is_doctor_user()
    and exists (
      select 1 from public.doctor_cases c
      where c.id = case_id
        and c.doctor_user_id = auth.uid()
        and c.status = 'sent'
    )
  );

drop policy if exists "doctor_case_files_staff_select" on public.doctor_case_files;
create policy "doctor_case_files_staff_select" on public.doctor_case_files
  for select to authenticated
  using (
    not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  );

create or replace function public.doctor_cases_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists doctor_cases_updated_at on public.doctor_cases;
create trigger doctor_cases_updated_at
  before update on public.doctor_cases
  for each row execute function public.doctor_cases_set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'doctor-case-files',
  'doctor-case-files',
  false,
  20971520,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "doctor_case_files_storage_doctor" on storage.objects;
create policy "doctor_case_files_storage_doctor" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'doctor-case-files'
    and public.auth_is_doctor_user()
  )
  with check (
    bucket_id = 'doctor-case-files'
    and public.auth_is_doctor_user()
  );

drop policy if exists "doctor_case_files_storage_staff" on storage.objects;
create policy "doctor_case_files_storage_staff" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'doctor-case-files'
    and not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  )
  with check (
    bucket_id = 'doctor-case-files'
    and not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  );

-- Storage: تقارير PDF النتائج للأطباء (يرفعها الإدارة)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'doctor-case-reports',
  'doctor-case-reports',
  false,
  15728640,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "doctor_case_reports_staff_all" on storage.objects;
create policy "doctor_case_reports_staff_all" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'doctor-case-reports'
    and not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  )
  with check (
    bucket_id = 'doctor-case-reports'
    and not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  );

drop policy if exists "doctor_case_reports_doctor_read" on storage.objects;
create policy "doctor_case_reports_doctor_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'doctor-case-reports'
    and public.auth_is_doctor_user()
    and exists (
      select 1 from public.doctor_cases dc
      where dc.doctor_user_id = auth.uid()
        and dc.pdf_storage_path = storage.objects.name
        and dc.status = 'done'
        and dc.pdf_expires_at is not null
        and dc.pdf_expires_at > now()
    )
  );

create or replace function public.doctor_cleanup_expired_case_pdfs()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from storage.objects o
  where o.bucket_id = 'doctor-case-reports'
    and exists (
      select 1
      from public.doctor_cases dc
      where dc.pdf_storage_path = o.name
        and dc.pdf_expires_at is not null
        and dc.pdf_expires_at <= now()
    );

  update public.doctor_cases
  set pdf_storage_path = null,
      pdf_expires_at = null
  where pdf_expires_at is not null
    and pdf_expires_at <= now();
end;
$$;

revoke all on function public.doctor_cleanup_expired_case_pdfs() from public;
comment on function public.doctor_cleanup_expired_case_pdfs() is
  'تشغيل دوري: حذف تقارير الأطباء منتهية الصلاحية من التخزين.';

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


-- =============================================================================
-- Partner submission attachments (multi-file per request batch)
-- =============================================================================

-- مرفقات طلبات المختبرات الشريكة (ملفات متعددة لكل طلب / batch)
-- نفّذ في Supabase SQL Editor

create table if not exists public.partner_submission_files (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null,
  partner_user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  byte_size bigint,
  created_at timestamptz default now()
);

create index if not exists partner_submission_files_batch_idx
  on public.partner_submission_files (batch_id);

create index if not exists partner_submission_files_partner_idx
  on public.partner_submission_files (partner_user_id, created_at desc);

alter table public.partner_submission_files enable row level security;

grant select, insert, delete on table public.partner_submission_files to authenticated;

drop policy if exists "partner_submission_files_partner_select" on public.partner_submission_files;
create policy "partner_submission_files_partner_select" on public.partner_submission_files
  for select to authenticated
  using (
    partner_user_id = auth.uid()
    and public.auth_is_partner_lab_user()
  );

drop policy if exists "partner_submission_files_partner_insert" on public.partner_submission_files;
create policy "partner_submission_files_partner_insert" on public.partner_submission_files
  for insert to authenticated
  with check (
    partner_user_id = auth.uid()
    and public.auth_is_partner_lab_user()
    and exists (
      select 1 from public.partner_submissions s
      where s.batch_id = partner_submission_files.batch_id
        and s.partner_user_id = auth.uid()
        and s.status = 'sent'
    )
  );

drop policy if exists "partner_submission_files_partner_delete" on public.partner_submission_files;
create policy "partner_submission_files_partner_delete" on public.partner_submission_files
  for delete to authenticated
  using (
    partner_user_id = auth.uid()
    and public.auth_is_partner_lab_user()
    and exists (
      select 1 from public.partner_submissions s
      where s.batch_id = partner_submission_files.batch_id
        and s.partner_user_id = auth.uid()
        and s.status = 'sent'
    )
    and not exists (
      select 1 from public.partner_submissions s
      where s.batch_id = partner_submission_files.batch_id
        and s.partner_user_id = auth.uid()
        and s.status <> 'sent'
    )
  );

drop policy if exists "partner_submission_files_staff_select" on public.partner_submission_files;
create policy "partner_submission_files_staff_select" on public.partner_submission_files
  for select to authenticated
  using (
    not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'partner-submission-files',
  'partner-submission-files',
  false,
  20971520,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "partner_submission_files_storage_partner" on storage.objects;
create policy "partner_submission_files_storage_partner" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'partner-submission-files'
    and public.auth_is_partner_lab_user()
  )
  with check (
    bucket_id = 'partner-submission-files'
    and public.auth_is_partner_lab_user()
  );

drop policy if exists "partner_submission_files_storage_staff" on storage.objects;
create policy "partner_submission_files_storage_staff" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'partner-submission-files'
    and not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  )
  with check (
    bucket_id = 'partner-submission-files'
    and not public.auth_is_partner_lab_user()
    and not public.auth_is_doctor_user()
  );
