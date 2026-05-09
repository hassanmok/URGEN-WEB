import { useMemo, useState, type ReactNode } from 'react'
import { useTests } from '../hooks/useTests'
import { useLocaleContext } from '../i18n/useLocaleContext'
import { SectionHeading } from '../components/ui/SectionHeading'
import { TestCard } from '../components/ui/TestCard'
import type { LabTest, TestCategoryId } from '../types/labTest'

const CATEGORY_ORDER: TestCategoryId[] = [
  'oncology_somatic',
  'hereditary_cancer',
  'reproductive',
  'nipt',
  'pediatric_newborn',
]

type OpenSection = TestCategoryId | 'uncategorized' | null

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className={`h-5 w-5 shrink-0 text-slate-500 transition-transform duration-300 ease-out ${
        open ? 'rotate-180' : ''
      }`}
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function CategoryAccordionRow({
  sectionId,
  title,
  countLabel,
  open,
  onToggle,
  children,
}: {
  sectionId: string
  title: string
  countLabel: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const headerId = `${sectionId}-header`
  const panelId = `${sectionId}-panel`

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        id={headerId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start transition-colors hover:bg-slate-50"
      >
        <span className="min-w-0">
          <span className="block text-lg font-bold text-urgen-navy">{title}</span>
          <span className="mt-0.5 block text-sm text-slate-500">{countLabel}</span>
        </span>
        <ChevronIcon open={open} />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-slate-100 px-5 pb-6 pt-4" inert={!open}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TestsPage() {
  const { tests, loading, error, usingFallback } = useTests()
  const { locale, messages: m } = useLocaleContext()
  const [openSection, setOpenSection] = useState<OpenSection>(null)

  const { grouped, uncategorized } = useMemo(() => {
    const buckets = Object.fromEntries(
      CATEGORY_ORDER.map((c) => [c, [] as LabTest[]]),
    ) as Record<TestCategoryId, LabTest[]>
    const other: LabTest[] = []
    for (const t of tests) {
      const cat = t.category
      if (cat && buckets[cat]) buckets[cat].push(t)
      else other.push(t)
    }
    return { grouped: buckets, uncategorized: other }
  }, [tests])

  const toggleSection = (key: Exclude<OpenSection, null>) => {
    setOpenSection((prev) => (prev === key ? null : key))
  }

  const testsInSectionLine = (n: number) =>
    locale === 'ar' ? `${n} تحليلاً في هذا القسم` : `${n} tests in this section`

  return (
    <div className="bg-white py-14 lg:py-20">
      <div className="container-urgen">
        <SectionHeading
          eyebrow={m.testsPage.eyebrow}
          title={m.testsPage.title}
          subtitle={m.testsPage.subtitle}
        />

        {usingFallback && !loading && (
          <p className="mx-auto mt-6 max-w-3xl rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-950">
            {m.testsPage.fallbackNotice}
          </p>
        )}

        {error && (
          <p className="mx-auto mt-6 max-w-3xl rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-900">
            {error}
          </p>
        )}

        {loading ? (
          <div className="mt-12 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-18 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="mt-14 space-y-4">
            {CATEGORY_ORDER.map((cat) => {
              const list = grouped[cat]
              if (!list.length) return null
              const catLabel =
                m.testsPage.categories[cat as keyof typeof m.testsPage.categories]
              const open = openSection === cat
              return (
                <CategoryAccordionRow
                  key={cat}
                  sectionId={`cat-${cat}`}
                  title={catLabel}
                  countLabel={testsInSectionLine(list.length)}
                  open={open}
                  onToggle={() => toggleSection(cat)}
                >
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((t) => (
                      <TestCard key={t.id} test={t} categoryLabel={catLabel} />
                    ))}
                  </div>
                </CategoryAccordionRow>
              )
            })}

            {uncategorized.length > 0 && (
              <CategoryAccordionRow
                sectionId="cat-uncategorized"
                title={m.testsPage.uncategorized}
                countLabel={testsInSectionLine(uncategorized.length)}
                open={openSection === 'uncategorized'}
                onToggle={() => toggleSection('uncategorized')}
              >
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {uncategorized.map((t) => (
                    <TestCard key={t.id} test={t} />
                  ))}
                </div>
              </CategoryAccordionRow>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
