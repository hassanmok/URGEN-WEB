import type { TestRow } from '../types/database'

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  immunohistochemistry: { ar: 'Immunohistochemistry', en: 'Immunohistochemistry' },
  oncology_somatic: { ar: 'Oncology', en: 'Oncology' },
  hereditary_cancer: { ar: 'Hereditary Cancer Genetics', en: 'Hereditary Cancer Genetics' },
  reproductive: { ar: 'Reproductive Health', en: 'Reproductive Health' },
  nipt: {
    ar: 'Non-Invasive Prenatal Testing (NIPT)',
    en: 'Non-Invasive Prenatal Testing (NIPT)',
  },
  pediatric_newborn: { ar: 'Pediatric', en: 'Pediatric' },
}

function categoryLabel(category: string | null | undefined, locale: string): string | null {
  if (!category) return null
  const row = CATEGORY_LABELS[category]
  if (!row) return null
  return locale === 'ar' ? row.ar : row.en
}

/** عنوان الفحص في القوائم العامة */
export function testDisplayTitle(test: TestRow, locale: string): string {
  return locale === 'ar' ? test.title_ar : (test.title_en ?? test.title_ar)
}

/**
 * عنوان أوضح عند اختيار الفحوصات: إذا تكرر نفس الاسم لفحصين مختلفين
 * (مثل Karyotyping للأطفال والإنجاب) نضيف اسم التصنيف.
 */
export function testPickerDisplayTitle(
  test: TestRow,
  locale: string,
  allTests: TestRow[],
): string {
  const base = testDisplayTitle(test, locale)
  const hasDuplicateName = allTests.some(
    (other) => other.slug !== test.slug && testDisplayTitle(other, locale) === base,
  )
  if (!hasDuplicateName) return base

  const cat = categoryLabel(test.category, locale)
  if (cat) return `${base} — ${cat}`

  return `${base} (${test.slug})`
}

/** إزالة صفوف مكررة بنفس slug (إن وُجدت في Supabase) */
export function dedupeTestsBySlug<T extends { slug: string; sort_order?: number | null }>(
  tests: T[],
): T[] {
  const bySlug = new Map<string, T>()
  for (const t of tests) {
    if (!bySlug.has(t.slug)) bySlug.set(t.slug, t)
  }
  return [...bySlug.values()].sort(
    (a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999),
  )
}

export function sortTestsByLocale(tests: TestRow[], locale: string): TestRow[] {
  return [...tests].sort((a, b) =>
    locale === 'ar'
      ? a.title_ar.localeCompare(b.title_ar, 'ar')
      : (a.title_en ?? a.title_ar).localeCompare(b.title_en ?? b.title_ar, 'en'),
  )
}

export function filterTestsBySearch(tests: TestRow[], query: string, locale: string): TestRow[] {
  const q = query.trim().toLowerCase()
  if (!q) return tests

  const tokens = q.split(/\s+/).filter(Boolean)

  return tests.filter((t) => {
    const hay = [t.slug, t.title_ar, t.title_en ?? '', testDisplayTitle(t, locale)]
      .join(' ')
      .toLowerCase()
    return tokens.every((token) => hay.includes(token))
  })
}
