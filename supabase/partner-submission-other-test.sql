-- خيار "أخرى" للفحوصات المخصصة في طلبات المختبرات الشريكة
-- نفّذ في Supabase SQL Editor

alter table public.partner_submissions add column if not exists test_title_override text;
