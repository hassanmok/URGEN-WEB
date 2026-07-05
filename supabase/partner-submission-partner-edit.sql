-- يسمح للمختبر الشريك بتعديل الطلب (حذف صفوف «مرسل» فقط) قبل قبول الإدارة
-- نفّذ في Supabase SQL Editor

drop policy if exists "partner_submissions_partner_delete" on public.partner_submissions;
create policy "partner_submissions_partner_delete" on public.partner_submissions
  for delete to authenticated
  using (
    partner_user_id = auth.uid()
    and public.auth_is_partner_lab_user()
    and status = 'sent'
  );
