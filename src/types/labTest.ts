import type { TestRow } from './database'

/** يطابق أقسام قائمة الموقع في دليل المحتوى */
export type TestCategoryId =
  | 'oncology_somatic'
  | 'hereditary_cancer'
  | 'reproductive'
  | 'nipt'
  | 'pediatric_newborn'

export type LabTestMeta = {
  category: TestCategoryId
  title_en: string
  description_en: string
  clinical_use_ar: string
  clinical_use_en: string
  sample_ar: string
  sample_en: string
  method_ar: string
  method_en: string
  turnaround_ar: string
  turnaround_en: string
  price_display_ar: string
  price_display_en: string
  preparation_ar: string
  preparation_en: string
  limitation_note_ar?: string
  limitation_note_en?: string
}

/** سجل فحص كامل للواجهة (الاحتياطي المحلي أو دمج أعمدة اختيارية لاحقاً) */
export type LabTest = TestRow & Partial<LabTestMeta>

/** عنصر كامل في القائمة المحلية قبل إضافة id من الخادم */
export type LabTestCatalogEntry = Omit<
  TestRow,
  'id' | 'created_at' | 'long_description_en' | 'category'
> &
  LabTestMeta

export function isFullLabTest(t: LabTest): t is TestRow & LabTestMeta {
  return Boolean(
    t.category &&
    t.title_en &&
    t.description_en &&
    t.clinical_use_ar &&
    t.clinical_use_en &&
    t.sample_ar &&
    t.sample_en &&
    t.method_ar &&
    t.method_en &&
    t.turnaround_ar &&
    t.turnaround_en &&
    t.price_display_ar &&
    t.price_display_en &&
    t.preparation_ar &&
    t.preparation_en,
  )
}
