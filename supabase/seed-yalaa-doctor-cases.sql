-- =============================================================================
-- URGEN – Import Dr. Yalaa Saadi Raouf patient cases from Excel
-- Run once in Supabase SQL Editor.
--
-- Doctor portal account (already created):
--   display_name: Yalaa Saadi Raouf
--   doctor_username: Yalaa.Saadi.Raouf
--
-- Rows imported: 177
--   age_unit: years
--   status: sent (awaiting review — editable by doctor before accept)
--   Tests: NOT imported — add later via doctor portal while status = sent
-- =============================================================================

do $$
declare
  v_doctor_id uuid;
  v_count int;
begin
  select user_id into v_doctor_id
  from public.doctor_users
  where doctor_username = 'Yalaa.Saadi.Raouf'
  limit 1;

  if v_doctor_id is null then
    raise exception 'Doctor not found: doctor_username = Yalaa.Saadi.Raouf';
  end if;

  insert into public.doctor_cases (
    doctor_user_id,
    patient_name1, patient_name2, patient_name3, patient_name4,
    patient_full_name,
    age_value, age_unit, gender,
    diagnosis, disease_type,
    oncology_tumor_type, oncology_stage, oncology_treatment,
    status
  ) values
  (
    v_doctor_id,
    'رفعت', 'محمد', 'دخيل', '',
    'رفعت محمد دخيل',
    70, 'years', 'male',
    'Pancretic Cancer', 'oncology',
    'Pancretic Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'ناثره', 'محمد', 'على', '',
    'ناثره محمد على',
    61, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'حسن', 'رشيد', 'جاسم', '',
    'حسن رشيد جاسم',
    40, 'years', 'male',
    'Colon Cncer', 'oncology',
    'Colon Cncer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'اسن', 'قصى', 'ناجى', '',
    'اسن قصى ناجى',
    40, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'هبه', 'فرحان', 'حماد', '',
    'هبه فرحان حماد',
    31, 'years', 'female',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'اسراء', 'جاسم', 'محمد', 'صالح',
    'اسراء جاسم محمد صالح',
    41, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'شيماء', 'موفق', 'عبد', 'الرزاق',
    'شيماء موفق عبد الرزاق',
    32, 'years', 'female',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'وداد', 'طالب', 'شحاده', '',
    'وداد طالب شحاده',
    70, 'years', 'female',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'انسام', 'يوسف', 'عبدالله', '',
    'انسام يوسف عبدالله',
    48, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'نوال', 'جابر', 'محمد', 'على',
    'نوال جابر محمد على',
    72, 'years', 'female',
    'Colon Cncer', 'oncology',
    'Colon Cncer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'زهره', 'رحيم', 'ابراهيم', '',
    'زهره رحيم ابراهيم',
    58, 'years', 'female',
    'Ovarian Cancer', 'oncology',
    'Ovarian Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'حمزه', 'محمد', 'حسن', '',
    'حمزه محمد حسن',
    72, 'years', 'male',
    'Colon Cncer', 'oncology',
    'Colon Cncer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'سعدون', 'بدن', 'صلال', '',
    'سعدون بدن صلال',
    69, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'على', 'ناصر', 'عبدالحسين', '',
    'على ناصر عبدالحسين',
    67, 'years', 'female',
    'Colon Cncer', 'oncology',
    'Colon Cncer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'سناء', 'عبد', 'الرزاق', 'حمد',
    'سناء عبد الرزاق حمد',
    58, 'years', 'female',
    'Ovarian Cancer', 'oncology',
    'Ovarian Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'بلسم', 'عثمان', 'ابراهيم', '',
    'بلسم عثمان ابراهيم',
    52, 'years', 'male',
    'Ovarian Cancer', 'oncology',
    'Ovarian Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'قيس', 'على', 'محمود', '',
    'قيس على محمود',
    73, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'هبه', 'عبد', 'الجبار', 'سامى',
    'هبه عبد الجبار سامى',
    42, 'years', 'female',
    'Colon Cncer', 'oncology',
    'Colon Cncer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'ايوب', 'هادى', 'نجم', '',
    'ايوب هادى نجم',
    64, 'years', 'male',
    'Gastric Cancer', 'oncology',
    'Gastric Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'انتظار', 'حسين', 'تمن', '',
    'انتظار حسين تمن',
    48, 'years', 'male',
    'Rectal Cancer', 'oncology',
    'Rectal Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'بتول', 'حسين', 'عبدالرحمن', '',
    'بتول حسين عبدالرحمن',
    71, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'امل', 'غازى', 'حمد', '',
    'امل غازى حمد',
    53, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'فاضل', 'عبدالعزيز', 'حسن', '',
    'فاضل عبدالعزيز حسن',
    64, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'رابعه', 'زيدان', 'حبيب', '',
    'رابعه زيدان حبيب',
    72, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'هويه', 'عبيد', 'عباس', '',
    'هويه عبيد عباس',
    68, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'فاضل', 'حبيب', 'جبار', '',
    'فاضل حبيب جبار',
    69, 'years', 'male',
    'Not specified', 'oncology',
    'Not specified', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'فاطمه', 'حسين', 'على', 'مهدى',
    'فاطمه حسين على مهدى',
    51, 'years', 'female',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'على', 'راضى', 'كنبار', '',
    'على راضى كنبار',
    62, 'years', 'female',
    'Pancretic Cancer', 'oncology',
    'Pancretic Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'ابتسام', 'حسن', 'حمود', '',
    'ابتسام حسن حمود',
    43, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'فخريه', 'سعدون', 'حسن', '',
    'فخريه سعدون حسن',
    70, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'عائده', 'عزالدين', 'محمد', '',
    'عائده عزالدين محمد',
    78, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'طه', 'محمد', 'داوود', '',
    'طه محمد داوود',
    65, 'years', 'male',
    'Colon Cncer', 'oncology',
    'Colon Cncer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'هاجر', 'جاسم', 'محمد', 'على',
    'هاجر جاسم محمد على',
    66, 'years', 'male',
    'Not specified', 'oncology',
    'Not specified', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'لبنى', 'عبدالحميد', 'حكمت', '',
    'لبنى عبدالحميد حكمت',
    39, 'years', 'female',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'امل', 'محمد', 'حسين', '',
    'امل محمد حسين',
    74, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'زهره', 'محمود', 'نصرالله', '',
    'زهره محمود نصرالله',
    72, 'years', 'female',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'نور', 'امجد', 'محمود', '',
    'نور امجد محمود',
    32, 'years', 'female',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'حيدر', 'رشيد', 'كاظم', '',
    'حيدر رشيد كاظم',
    44, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'حليوه', 'جرى', 'مهدى', '',
    'حليوه جرى مهدى',
    70, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'استراليا', 'رسن', 'سالم', '',
    'استراليا رسن سالم',
    48, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'كريمه', 'نعمه', 'فرج', '',
    'كريمه نعمه فرج',
    65, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'هاديه', 'رضا', 'مهدى', '',
    'هاديه رضا مهدى',
    59, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'اسامه', 'داوود', 'عبدالرزاق', '',
    'اسامه داوود عبدالرزاق',
    66, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'جواد', 'كاظم', 'صادق', '',
    'جواد كاظم صادق',
    65, 'years', 'male',
    'Colon Cncer', 'oncology',
    'Colon Cncer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'سندس', 'جاسم', 'كاظم', '',
    'سندس جاسم كاظم',
    58, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'كوثر', 'عبد', 'جاسم', '',
    'كوثر عبد جاسم',
    43, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'نوال', 'سليمان', 'سعيد', '',
    'نوال سليمان سعيد',
    85, 'years', 'female',
    'Colon Cncer', 'oncology',
    'Colon Cncer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'محمد', 'رزاق', 'محمد', '',
    'محمد رزاق محمد',
    36, 'years', 'male',
    'Colon Cncer', 'oncology',
    'Colon Cncer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'اوراس', 'زكى', 'سعدون', '',
    'اوراس زكى سعدون',
    47, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'رسميه', 'على', 'حسين', '',
    'رسميه على حسين',
    78, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'رباب', 'عبدالمجيد', 'محراث', '',
    'رباب عبدالمجيد محراث',
    57, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'سرور', 'خضر', 'سلمان', '',
    'سرور خضر سلمان',
    74, 'years', 'male',
    'Colon Cncer', 'oncology',
    'Colon Cncer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'اوس', 'على', 'غالب', 'عبدالرحمن',
    'اوس على غالب عبدالرحمن',
    75, 'years', 'male',
    'Colon Cncer', 'oncology',
    'Colon Cncer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'عدى', 'محمد', 'عبدالرضا', '',
    'عدى محمد عبدالرضا',
    73, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'قاسم', 'محمد', 'عمر', '',
    'قاسم محمد عمر',
    56, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'مهديه', 'خضير', 'ياس', '',
    'مهديه خضير ياس',
    43, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'يوسف', 'صالح', 'على', '',
    'يوسف صالح على',
    64, 'years', 'male',
    'Colon Cncer', 'oncology',
    'Colon Cncer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'احمد', 'عباس', 'ابراهيم', '',
    'احمد عباس ابراهيم',
    75, 'years', 'male',
    'Colon Cncer', 'oncology',
    'Colon Cncer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'فارس', 'حسين', 'عبدالوهاب', '',
    'فارس حسين عبدالوهاب',
    75, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'سميه', 'محمود', 'عبدالجبار', '',
    'سميه محمود عبدالجبار',
    47, 'years', 'female',
    'Colon Cncer', 'oncology',
    'Colon Cncer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'حيدر', 'محمد', 'زكى', '',
    'حيدر محمد زكى',
    53, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'ماجده', 'حميد', 'حسين', '',
    'ماجده حميد حسين',
    85, 'years', 'female',
    'Ovarian Cancer', 'oncology',
    'Ovarian Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'فوزيه', 'عبدالمجيد', 'عباس', '',
    'فوزيه عبدالمجيد عباس',
    68, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'رياض', 'رؤوف', 'حفضى', '',
    'رياض رؤوف حفضى',
    76, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'احسان', 'جودت', 'حسن', '',
    'احسان جودت حسن',
    67, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'كريمه', 'محمد', 'عبد', '',
    'كريمه محمد عبد',
    66, 'years', 'female',
    'Pancretic Cancer', 'oncology',
    'Pancretic Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'حسين', 'فاضل', 'عبد', '',
    'حسين فاضل عبد',
    73, 'years', 'male',
    'Gastric Cancer', 'oncology',
    'Gastric Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'فردوس', 'سلمان', 'حسين', '',
    'فردوس سلمان حسين',
    73, 'years', 'male',
    'Pancretic Cancer', 'oncology',
    'Pancretic Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'ايمان', 'طالب', 'محمد', '',
    'ايمان طالب محمد',
    50, 'years', 'female',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'جاسم', 'كريم', 'عياده', '',
    'جاسم كريم عياده',
    64, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'سميه', 'عثمان', 'ابراهيم', '',
    'سميه عثمان ابراهيم',
    61, 'years', 'female',
    'Colon Cncer', 'oncology',
    'Colon Cncer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'شاكر', 'احمد', 'محمد', '',
    'شاكر احمد محمد',
    75, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'اسماء', 'عبدالجبار', 'عبدالسلام', '',
    'اسماء عبدالجبار عبدالسلام',
    36, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'بتول', 'علوان', 'سنيد', '',
    'بتول علوان سنيد',
    47, 'years', 'female',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'سهى', 'عبدالوهاب', 'محمد', '',
    'سهى عبدالوهاب محمد',
    70, 'years', 'female',
    'Endometrial Carcinoma', 'oncology',
    'Endometrial Carcinoma', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'خوله', 'حسين', 'احمد', '',
    'خوله حسين احمد',
    71, 'years', 'male',
    'Vulvar cancer.', 'oncology',
    'Vulvar cancer.', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'قيس', 'على', 'محمود', '',
    'قيس على محمود',
    74, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'فخريه', 'محمد', 'سلمان', '',
    'فخريه محمد سلمان',
    82, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'عدنان', 'مجيد', 'عبدالحسين', '',
    'عدنان مجيد عبدالحسين',
    76, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'سهى', 'حامد', 'احمد', 'على',
    'سهى حامد احمد على',
    48, 'years', 'female',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'رحاب', 'فاضل', 'شلال', '',
    'رحاب فاضل شلال',
    27, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'غنى', 'طعمه', 'عيدان', '',
    'غنى طعمه عيدان',
    66, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'هبه', 'يوسف', 'مثكال', '',
    'هبه يوسف مثكال',
    68, 'years', 'female',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'زكيه', 'اسماعيل', 'عبدالرحمن', '',
    'زكيه اسماعيل عبدالرحمن',
    80, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'نضال', 'عبيد', 'شاطى', '',
    'نضال عبيد شاطى',
    65, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'حنان', 'عبدالحميد', 'عبد', 'على',
    'حنان عبدالحميد عبد على',
    53, 'years', 'female',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'جميله', 'لمام', 'عبد', '',
    'جميله لمام عبد',
    67, 'years', 'female',
    'Colorectal Cancer', 'oncology',
    'Colorectal Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'جاسميه', 'عباس', 'ملاجى', '',
    'جاسميه عباس ملاجى',
    77, 'years', 'male',
    'Sarcoma', 'oncology',
    'Sarcoma', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'لينا', 'عدنان', 'نعيم', '',
    'لينا عدنان نعيم',
    40, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'حسن', 'جبار', 'محيسن', 'صبر',
    'حسن جبار محيسن صبر',
    60, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'زينب', 'حيدر', 'ديكان', '',
    'زينب حيدر ديكان',
    24, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'فاخر', 'ناجى', 'شحود', '',
    'فاخر ناجى شحود',
    71, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'طليعه', 'عباس', 'عذافه', '',
    'طليعه عباس عذافه',
    72, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'مهند', 'عبدالرحمن', 'محمد', '',
    'مهند عبدالرحمن محمد',
    75, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'شيماء', 'عبد', 'الواحد', 'غضبان',
    'شيماء عبد الواحد غضبان',
    47, 'years', 'female',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'ناصر', 'صكبان', 'غازى', '',
    'ناصر صكبان غازى',
    59, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'رافع', 'محمود', 'سعيد', '',
    'رافع محمود سعيد',
    50, 'years', 'male',
    'Not specified', 'oncology',
    'Not specified', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'اسراء', 'حامد', 'عبدالله', '',
    'اسراء حامد عبدالله',
    40, 'years', 'female',
    'Gastric Cancer', 'oncology',
    'Gastric Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'هديل', 'محمد', 'صالح', '',
    'هديل محمد صالح',
    43, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'فاطمه', 'سامى', 'كاظم', '',
    'فاطمه سامى كاظم',
    41, 'years', 'female',
    'Not specified', 'oncology',
    'Not specified', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'ضياء', 'كريم', 'فرج', '',
    'ضياء كريم فرج',
    63, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'مفيد', 'عبدالله', 'حسن', '',
    'مفيد عبدالله حسن',
    57, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'لباب', 'صلاح', 'هادى', '',
    'لباب صلاح هادى',
    33, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'سمر', 'سمير', 'سلمان', '',
    'سمر سمير سلمان',
    46, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'عماد', 'مهدى', 'نجم', '',
    'عماد مهدى نجم',
    70, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'سلامه', 'شاكر', 'عبدالرزاق', '',
    'سلامه شاكر عبدالرزاق',
    68, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'قصى', 'فيصل', 'غضبان', '',
    'قصى فيصل غضبان',
    43, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'محمد', 'جاسم', 'محمد', '',
    'محمد جاسم محمد',
    50, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'ابتهال', 'محمد', 'مهدى', '',
    'ابتهال محمد مهدى',
    59, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'موفق', 'مهدى', 'حسين', '',
    'موفق مهدى حسين',
    70, 'years', 'male',
    'Not specified', 'oncology',
    'Not specified', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'عبدالحسن', 'كاظم', 'حسين', '',
    'عبدالحسن كاظم حسين',
    74, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'مياده', 'جواد', 'كاظم', '',
    'مياده جواد كاظم',
    58, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'على', 'احمد', 'رشيد', '',
    'على احمد رشيد',
    97, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'كوثر', 'عيسى', 'موسى', '',
    'كوثر عيسى موسى',
    66, 'years', 'female',
    'Endometrial carcinoma', 'oncology',
    'Endometrial carcinoma', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'عبدالسلام', 'حمزه', 'ناصر', '',
    'عبدالسلام حمزه ناصر',
    67, 'years', 'male',
    'Colon Cncer', 'oncology',
    'Colon Cncer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'عروبه', 'ثامر', 'حسن', '',
    'عروبه ثامر حسن',
    55, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'محمد', 'احمد', 'جاسم', '',
    'محمد احمد جاسم',
    33, 'years', 'male',
    'Rectal Cancer', 'oncology',
    'Rectal Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'ليث', 'صالح', 'احمد', '',
    'ليث صالح احمد',
    48, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'سعاد', 'زيدان', 'خاف', '',
    'سعاد زيدان خاف',
    52, 'years', 'female',
    'Colon Cncer', 'oncology',
    'Colon Cncer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'صلاح', 'محمود', 'علوان', 'حسين',
    'صلاح محمود علوان حسين',
    58, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'امل', 'حسن', 'سلمان', '',
    'امل حسن سلمان',
    80, 'years', 'female',
    'Pancretic Cancer', 'oncology',
    'Pancretic Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'مها', 'غالى', 'زياره', '',
    'مها غالى زياره',
    35, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'ثابت', 'حسون', 'عبدالله', '',
    'ثابت حسون عبدالله',
    70, 'years', 'male',
    'Colorectal  Cancer', 'oncology',
    'Colorectal  Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'وليد', 'اسماعيل', 'خليل', '',
    'وليد اسماعيل خليل',
    76, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'سوسن', 'ناقد', 'زين', 'العابدين',
    'سوسن ناقد زين العابدين',
    54, 'years', 'female',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'يسرى', 'محمود', 'سامى', '',
    'يسرى محمود سامى',
    56, 'years', 'female',
    'Colon Cncer', 'oncology',
    'Colon Cncer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'سعد', 'جليل', 'خليل', '',
    'سعد جليل خليل',
    65, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'نجلاء', 'نجم', 'عبود', '',
    'نجلاء نجم عبود',
    49, 'years', 'female',
    'Endometrial carcinoma', 'oncology',
    'Endometrial carcinoma', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'سعد', 'جليل', 'خليل', '',
    'سعد جليل خليل',
    65, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'نبا', 'احسان', 'جواد', '',
    'نبا احسان جواد',
    39, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'فاديه', 'كاظم', 'اسماعيل', '',
    'فاديه كاظم اسماعيل',
    37, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'حارث', 'احمد', 'مرشد', '',
    'حارث احمد مرشد',
    32, 'years', 'male',
    'Colon Cncer', 'oncology',
    'Colon Cncer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'حسن', 'عنيد', 'عذيب', '',
    'حسن عنيد عذيب',
    50, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'هاشميه', 'محمد', 'خليل', '',
    'هاشميه محمد خليل',
    67, 'years', 'male',
    'Endometrial carcinoma', 'oncology',
    'Endometrial carcinoma', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'عبد', 'الرسول', 'حواس', 'زياد',
    'عبد الرسول حواس زياد',
    70, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'محمد', 'رياض', 'عبد', 'الجليل',
    'محمد رياض عبد الجليل',
    36, 'years', 'male',
    'Colon Cncer', 'oncology',
    'Colon Cncer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'مجيد', 'محمود', 'احمد', '',
    'مجيد محمود احمد',
    76, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'احلام', 'عليوى', 'مراد', '',
    'احلام عليوى مراد',
    59, 'years', 'male',
    'Pancretic Cancer', 'oncology',
    'Pancretic Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'ماجده', 'حميد', 'حسين', '',
    'ماجده حميد حسين',
    83, 'years', 'female',
    'Ovarian Cancer', 'oncology',
    'Ovarian Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'مجيد', 'محمود', 'احمد', '',
    'مجيد محمود احمد',
    76, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'نازك', 'طلال', 'جعفر', '',
    'نازك طلال جعفر',
    47, 'years', 'male',
    'Endometrial carcinoma', 'oncology',
    'Endometrial carcinoma', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'انتصار', 'عطيه', 'هذال', '',
    'انتصار عطيه هذال',
    58, 'years', 'female',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'ماجد', 'عبدالحميد', 'عبدالرزاق', '',
    'ماجد عبدالحميد عبدالرزاق',
    60, 'years', 'male',
    'Colon Cncer', 'oncology',
    'Colon Cncer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'بشير', 'حسن', 'عبدالله', '',
    'بشير حسن عبدالله',
    73, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'سميره', 'وهيب', 'حمد', '',
    'سميره وهيب حمد',
    60, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'حنان', 'كاظم', 'حماده', '',
    'حنان كاظم حماده',
    72, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'عيسى', 'حميد', 'ابراهيم', '',
    'عيسى حميد ابراهيم',
    59, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'ساره', 'ابراهيم', 'حردان', '',
    'ساره ابراهيم حردان',
    46, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'سميره', 'محسن', 'حسين', '',
    'سميره محسن حسين',
    70, 'years', 'female',
    'Endometrial carcinoma', 'oncology',
    'Endometrial carcinoma', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'نوال', 'جابر', 'محمد', 'على',
    'نوال جابر محمد على',
    70, 'years', 'female',
    'Colon Cancer', 'oncology',
    'Colon Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'ناديه', 'جمال', 'بطرس', '',
    'ناديه جمال بطرس',
    58, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'زمن', 'يعقوب', 'علاوى', '',
    'زمن يعقوب علاوى',
    43, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'رعد', 'طالب', 'سعيد', '',
    'رعد طالب سعيد',
    73, 'years', 'male',
    'Not specified', 'oncology',
    'Not specified', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'على', 'ابراهيم', 'حميد', '',
    'على ابراهيم حميد',
    60, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'نور', 'وليد', 'خالد', '',
    'نور وليد خالد',
    31, 'years', 'female',
    'Bone Cancer', 'oncology',
    'Bone Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'كريمه', 'نعمه', 'فرج', '',
    'كريمه نعمه فرج',
    65, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'رنا', 'خالد', 'محمد', '',
    'رنا خالد محمد',
    42, 'years', 'female',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'حمدان', 'رضا', 'حسن', '',
    'حمدان رضا حسن',
    70, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'امل', 'كاظم', 'عياس', '',
    'امل كاظم عياس',
    70, 'years', 'female',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'محمد', 'احمد', 'محمود', '',
    'محمد احمد محمود',
    69, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'صفيه', 'راشد', 'محمد', '',
    'صفيه راشد محمد',
    70, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'عاليه', 'عباس', 'عبدالله', '',
    'عاليه عباس عبدالله',
    69, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'محمد', 'احمد', 'محمود', '',
    'محمد احمد محمود',
    69, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'نصيف', 'جاسم', 'محمد', '',
    'نصيف جاسم محمد',
    72, 'years', 'male',
    'Colon Cancer', 'oncology',
    'Colon Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'محمد', 'احمد', 'محمود', '',
    'محمد احمد محمود',
    69, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'شيماء', 'صبرى', 'محمد', 'على',
    'شيماء صبرى محمد على',
    47, 'years', 'female',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'عادل', 'عبود', 'جاسم', '',
    'عادل عبود جاسم',
    77, 'years', 'male',
    'Pancretic Cancer', 'oncology',
    'Pancretic Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'داليا', 'ذنون', 'موفق', '',
    'داليا ذنون موفق',
    35, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'احمد', 'صبحى', 'شهاب', 'احمد',
    'احمد صبحى شهاب احمد',
    69, 'years', 'male',
    'Rectal Cancer', 'oncology',
    'Rectal Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'حمده', 'حسين', 'عليوى', 'شريمط',
    'حمده حسين عليوى شريمط',
    78, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'جميله', 'لطيف', 'خضير', 'مهدى',
    'جميله لطيف خضير مهدى',
    68, 'years', 'female',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'افتخار', 'اسماعيل', 'صالح', 'على',
    'افتخار اسماعيل صالح على',
    58, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'ميسون', 'عبدالعزيز', 'عزت', '',
    'ميسون عبدالعزيز عزت',
    50, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'براء', 'على', 'كاظم', 'حسن',
    'براء على كاظم حسن',
    55, 'years', 'female',
    'Colon Cancer', 'oncology',
    'Colon Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'اخلاص', 'خزعل', 'عبد', 'على',
    'اخلاص خزعل عبد على',
    59, 'years', 'male',
    'Breast Cancer', 'oncology',
    'Breast Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'امونه', 'اسود', 'فاضل', 'طحيم',
    'امونه اسود فاضل طحيم',
    67, 'years', 'male',
    'Lung Cancer', 'oncology',
    'Lung Cancer', 'Not specified', 'Not specified',
    'sent'
  ),
  (
    v_doctor_id,
    'عليه', 'حسن', 'حمادى', '',
    'عليه حسن حمادى',
    60, 'years', 'male',
    'Colon Cancer', 'oncology',
    'Colon Cancer', 'Not specified', 'Not specified',
    'sent'
  );

  get diagnostics v_count = row_count;
  raise notice 'Imported % doctor_cases for Dr. Yalaa (user_id=%)', v_count, v_doctor_id;
end $$;
