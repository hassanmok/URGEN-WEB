import type { TestCategoryRecord } from '../types/testCategory'
import type { Locale } from '../i18n/messages'

/** أسماء الأصناف كما في عمود Category بملف URGEN List Test.xlsx */
const EXCEL_CATEGORY_TITLES: Record<string, string> = {
  immunohistochemistry: 'Immunohistochemistry',
  oncology_somatic: 'Oncology',
  hereditary_cancer: 'Hereditary Cancer Genetics',
  reproductive: 'Reproductive Health',
  nipt: 'Non-Invasive Prenatal Testing (NIPT)',
  pediatric_newborn: 'Pediatric',
}

export function getCategoryLabel(
  slug: string | null | undefined,
  locale: Locale,
  categories: Pick<TestCategoryRecord, 'slug' | 'title_ar' | 'title_en'>[],
): string | undefined {
  if (!slug) return undefined
  const hit = categories.find((c) => c.slug === slug)
  if (hit) {
    const fromDb = locale === 'ar' ? hit.title_ar : (hit.title_en?.trim() || hit.title_ar)
    if (fromDb?.trim()) return fromDb.trim()
  }
  return EXCEL_CATEGORY_TITLES[slug] ?? slug
}

export function sortCategories<T extends { slug: string; sort_order: number }>(
  categories: T[],
): T[] {
  return [...categories].sort((a, b) => a.sort_order - b.sort_order || a.slug.localeCompare(b.slug))
}
