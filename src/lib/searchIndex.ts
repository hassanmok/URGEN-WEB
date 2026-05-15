import type { Locale } from '../i18n/messages'
import type { Messages } from '../i18n/messages'
import type { LabTest } from '../types/labTest'

export type SearchDocKind = 'page' | 'test'

export type SearchDoc = {
  id: string
  href: string
  title: string
  haystack: string
  kind: SearchDocKind
}

/** تقسيم استعلام البحث إلى رموز (بدون حساسية لحالة الأحرف اللاتينية) */
export function tokenize(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
}

function matchesAllTokens(haystack: string, tokens: string[]): boolean {
  const h = haystack.toLowerCase()
  return tokens.every((t) => h.includes(t))
}

function scoreDoc(doc: SearchDoc, tokens: string[]): number {
  const title = doc.title.toLowerCase()
  const h = doc.haystack.toLowerCase()
  let s = 0
  for (const t of tokens) {
    if (title.includes(t)) s += 8
    let i = 0
    while (i < h.length) {
      const j = h.indexOf(t, i)
      if (j === -1) break
      s += 2
      i = j + t.length
    }
  }
  if (doc.kind === 'test') s += 0.5
  return s
}

/** مقتطف نصي حول أول تطابق */
export function makeSnippet(haystack: string, query: string, maxLen = 180): string {
  const tokens = tokenize(query)
  if (!tokens.length) return haystack.slice(0, maxLen) + (haystack.length > maxLen ? '…' : '')
  const lower = haystack.toLowerCase()
  let bestIdx = -1
  for (const t of tokens) {
    const idx = lower.indexOf(t)
    if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) bestIdx = idx
  }
  if (bestIdx === -1) {
    const s = haystack.slice(0, maxLen)
    return s + (haystack.length > maxLen ? '…' : '')
  }
  const start = Math.max(0, bestIdx - Math.floor(maxLen / 4))
  const slice = haystack.slice(start, start + maxLen).trim()
  return (start > 0 ? '…' : '') + slice + (start + maxLen < haystack.length ? '…' : '')
}

export type RankedSearchHit = {
  doc: SearchDoc
  score: number
  snippet: string
}

export function searchAndRank(docs: SearchDoc[], query: string): RankedSearchHit[] {
  const tokens = tokenize(query)
  if (!tokens.length) return []

  const hits: RankedSearchHit[] = []
  for (const doc of docs) {
    if (!matchesAllTokens(doc.haystack, tokens)) continue
    hits.push({
      doc,
      score: scoreDoc(doc, tokens),
      snippet: makeSnippet(doc.haystack, query),
    })
  }
  hits.sort((a, b) => b.score - a.score)
  return hits
}

/** بناء جميع الوثائق القابلة للبحث للغة الحالية (الفحوصات من Supabase عند التوفّر) */
export function buildSearchDocuments(locale: Locale, m: Messages, tests: LabTest[]): SearchDoc[] {
  const docs: SearchDoc[] = []

  const join = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(' \n ')

  const homeHaystack = join(
    m.meta.description,
    m.meta.title,
    m.hero.title,
    m.hero.subtitle,
    ...m.featureBar.map((x) => `${x.title} ${x.description}`),
    m.whyUrgen.title,
    m.whyUrgen.subtitle,
    ...m.whyUrgen.items.map((x) => `${x.title} ${x.description}`),
    m.testsPreview.title,
    m.testsPreview.subtitle,
    m.cta.title,
    m.cta.subtitle,
  )

  docs.push({
    id: 'page-home',
    href: '/',
    title: locale === 'ar' ? 'الرئيسية' : 'Home',
    haystack: homeHaystack,
    kind: 'page',
  })

  const aboutHaystack = join(
    m.about.title,
    m.about.subtitle,
    m.about.p1,
    m.about.p2,
    ...m.about.values.map((v) => `${v.title} ${v.description}`),
  )

  docs.push({
    id: 'page-about',
    href: '/about',
    title: locale === 'ar' ? 'من نحن' : 'About us',
    haystack: aboutHaystack,
    kind: 'page',
  })

  const techHaystack = join(
    m.technologyPage.title,
    m.technologyPage.subtitle,
    m.technologyPage.intro,
    ...m.technologyPage.items.map((i) => `${i.title} ${i.description}`),
  )

  docs.push({
    id: 'page-technology',
    href: '/technology',
    title: locale === 'ar' ? 'التقنيات' : 'Technology',
    haystack: techHaystack,
    kind: 'page',
  })

  docs.push({
    id: 'page-tests',
    href: '/tests',
    title: locale === 'ar' ? 'الفحوصات' : 'Tests',
    haystack: join(m.testsPage.title, m.testsPage.subtitle, ...Object.values(m.testsPage.categories)),
    kind: 'page',
  })

  docs.push({
    id: 'page-events',
    href: '/events',
    title: locale === 'ar' ? 'الفعاليات' : 'Events',
    haystack: join(m.eventsPage.title, m.eventsPage.subtitle),
    kind: 'page',
  })

  docs.push({
    id: 'page-contact',
    href: '/contact',
    title: locale === 'ar' ? 'اتصل بنا' : 'Contact',
    haystack: join(m.contact.title, m.contact.subtitle, m.contact.address),
    kind: 'page',
  })

  docs.push({
    id: 'page-book',
    href: '/book',
    title: locale === 'ar' ? 'حجز موعد' : 'Book an appointment',
    haystack: join(m.bookPage.title, m.bookPage.subtitle),
    kind: 'page',
  })

  for (const t of tests) {
    const title = locale === 'ar' ? t.title_ar : (t.title_en ?? t.title_ar)
    const categoryLabel =
      t.category && m.testsPage.categories[t.category as keyof typeof m.testsPage.categories]
        ? m.testsPage.categories[t.category as keyof typeof m.testsPage.categories]
        : ''

    const haystack = join(
      t.slug,
      t.title_ar,
      t.title_en ?? '',
      t.description_ar,
      t.description_en ?? '',
      t.long_description_ar ?? '',
      t.long_description_en ?? '',
      t.clinical_use_ar ?? '',
      t.clinical_use_en ?? '',
      t.sample_ar ?? '',
      t.sample_en ?? '',
      t.method_ar ?? '',
      t.method_en ?? '',
      t.turnaround_ar ?? '',
      t.turnaround_en ?? '',
      t.price_display_ar ?? '',
      t.price_display_en ?? '',
      t.preparation_ar ?? '',
      t.preparation_en ?? '',
      t.limitation_note_ar ?? '',
      t.limitation_note_en ?? '',
      categoryLabel,
    )

    docs.push({
      id: `test-${t.slug}`,
      href: `/tests/${t.slug}`,
      title,
      haystack,
      kind: 'test',
    })
  }

  return docs
}
