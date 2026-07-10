-- تحديث أسماء الأصناف الظاهرة لتطابق ملف URGEN List Test.xlsx
-- نفّذ في Supabase SQL Editor (خفيف إذا كانت الفحوصات مُدرجة مسبقاً)

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

select slug, title_ar, title_en, sort_order
from public.test_categories
order by sort_order;
