-- إزالة حقول التحضير والملاحظات من جدول الفحوصات
-- نفّذ في Supabase SQL Editor

alter table public.tests drop column if exists preparation_ar;
alter table public.tests drop column if exists preparation_en;
alter table public.tests drop column if exists limitation_note_ar;
alter table public.tests drop column if exists limitation_note_en;
