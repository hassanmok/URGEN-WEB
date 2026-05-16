import { Link, useParams } from 'react-router-dom'
import { useTestBySlug } from '../hooks/useTests'
import { useLocaleContext } from '../i18n/useLocaleContext'
import { getLocalizedTestCopy } from '../i18n/localizedTest'
import { getTestGradientClass } from '../lib/testGradients'
import { Button } from '../components/ui/Button'
import { isFullLabTest, type LabTest } from '../types/labTest'

function detailFields(test: LabTest, locale: 'ar' | 'en') {
  const ar = locale === 'ar'
  return {
    clinical: ar ? test.clinical_use_ar : test.clinical_use_en,
    sample: ar ? test.sample_ar : test.sample_en,
    method: ar ? test.method_ar : test.method_en,
    turnaround: ar ? test.turnaround_ar : test.turnaround_en,
    preparation: ar ? test.preparation_ar : test.preparation_en,
    limitation: ar ? test.limitation_note_ar : test.limitation_note_en,
  }
}

export function TestDetailPage() {
  const { slug } = useParams()
  const { test, loading } = useTestBySlug(slug)
  const { locale, messages: m } = useLocaleContext()

  if (loading) {
    return (
      <div className="container-urgen py-20">
        <div className="h-48 animate-pulse rounded-2xl bg-slate-100 sm:h-56" />
        <div className="mt-8 h-64 animate-pulse rounded-2xl bg-slate-50" />
      </div>
    )
  }

  if (!test) {
    return (
      <div className="container-urgen py-20 text-center">
        <h1 className="text-2xl font-bold text-urgen-navy">{m.testDetail.notFound}</h1>
        <Link to="/tests" className="mt-6 inline-block">
          <Button variant="outline">{m.testDetail.backToTests}</Button>
        </Link>
      </div>
    )
  }

  const copy = getLocalizedTestCopy(test, locale, m)
  const gradient = getTestGradientClass(test)
  const full = isFullLabTest(test)
  const d = detailFields(test, locale)

  const categoryLabel =
    test.category &&
    m.testsPage.categories[test.category as keyof typeof m.testsPage.categories]

  return (
    <article className="bg-white pb-16 pt-10 lg:pb-24 lg:pt-14">
      <div className="container-urgen">
        <nav className="text-sm text-slate-500" aria-label={m.testDetail.breadcrumb}>
          <Link to="/" className="hover:text-urgen-purple">
            {m.nav.home}
          </Link>
          <span className="mx-2">/</span>
          <Link to="/tests" className="hover:text-urgen-purple">
            {m.nav.tests}
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-urgen-navy">{copy.title}</span>
        </nav>

        <header
          className={`relative mt-8 overflow-hidden rounded-2xl px-6 py-10 shadow-lg sm:px-8 sm:py-12 lg:px-10 lg:py-14 ${gradient}`}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(255,255,255,0.2)_0%,transparent_50%)]"
            aria-hidden
          />
          <div className="relative max-w-3xl">
            {categoryLabel && (
              <p className="mb-3 w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white ring-1 ring-white/30 backdrop-blur-sm">
                {categoryLabel}
              </p>
            )}
            <h1 className="text-3xl font-extrabold leading-tight text-white drop-shadow-sm sm:text-4xl lg:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/95 sm:text-lg">{copy.description}</p>
          </div>
        </header>

        <div className="mt-10 max-w-4xl">
          {full ? (
            <dl className="space-y-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-6 text-slate-700 sm:p-8">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {m.testDetail.clinicalUse}
                </dt>
                <dd className="mt-1 leading-relaxed">{d.clinical}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {m.testDetail.sample}
                </dt>
                <dd className="mt-1 leading-relaxed">{d.sample}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {m.testDetail.method}
                </dt>
                <dd className="mt-1 leading-relaxed">{d.method}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {m.testDetail.turnaround}
                </dt>
                <dd className="mt-1">{d.turnaround}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {m.testDetail.preparation}
                </dt>
                <dd className="mt-1 leading-relaxed">{d.preparation}</dd>
              </div>
              {d.limitation && (
                <div className="rounded-xl border border-amber-100 bg-amber-50/90 p-4">
                  <dt className="text-xs font-bold uppercase tracking-wide text-amber-900">
                    {m.testDetail.limitations}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-amber-950">{d.limitation}</dd>
                </div>
              )}
            </dl>
          ) : (
            <div className="rounded-2xl bg-urgen-sky-soft/80 p-6 text-slate-700 sm:p-8">
              <h2 className="text-lg font-bold text-urgen-navy">{m.testDetail.deeper}</h2>
              <p className="mt-3 leading-relaxed">{copy.long ?? m.testDetail.longFallback}</p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/contact">
              <Button>{m.testDetail.askBefore}</Button>
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
