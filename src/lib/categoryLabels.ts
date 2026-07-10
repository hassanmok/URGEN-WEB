import type { TestCategoryRecord } from '../types/testCategory'
import type { Locale } from '../i18n/messages'

const I18N_FALLBACK_AR: Record<string, string> = {
  immunohistochemistry: 'الكيمياء المناعية النسيجية',
  oncology_somatic: 'الأورام والجسيمي',
  hereditary_cancer: 'السرطان الوراثي',
  reproductive: 'الإنجاب وصحة المرأة/الرجل',
  nipt: 'NIPT — قبل الولادة غير جراحي',
  pediatric_newborn: 'الأطفال وحديثو الولادة',
}

const I18N_FALLBACK_EN: Record<string, string> = {
  immunohistochemistry: 'Immunohistochemistry',
  oncology_somatic: 'Oncology / Somatic',
  hereditary_cancer: 'Hereditary cancer',
  reproductive: 'Reproductive & women/men health',
  nipt: 'NIPT (non-invasive prenatal testing)',
  pediatric_newborn: 'Pediatric & newborn',
}

export function getCategoryLabel(
  slug: string | null | undefined,
  locale: Locale,
  categories: Pick<TestCategoryRecord, 'slug' | 'title_ar' | 'title_en'>[],
): string | undefined {
  if (!slug) return undefined
  const hit = categories.find((c) => c.slug === slug)
  if (hit) {
    return locale === 'ar' ? hit.title_ar : (hit.title_en?.trim() || hit.title_ar)
  }
  const fb = locale === 'ar' ? I18N_FALLBACK_AR[slug] : I18N_FALLBACK_EN[slug]
  return fb ?? slug
}

export function sortCategories<T extends { slug: string; sort_order: number }>(
  categories: T[],
): T[] {
  return [...categories].sort((a, b) => a.sort_order - b.sort_order || a.slug.localeCompare(b.slug))
}
