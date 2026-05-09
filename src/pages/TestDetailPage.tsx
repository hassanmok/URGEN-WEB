import { Link, useParams } from 'react-router-dom'
import { useTestBySlug } from '../hooks/useTests'
import { useLocaleContext } from '../i18n/useLocaleContext'
import { getLocalizedTestCopy } from '../i18n/localizedTest'
import { Button } from '../components/ui/Button'
import { isFullLabTest, type LabTest } from '../types/labTest'

function detailFields(test: LabTest, locale: 'ar' | 'en') {
  const ar = locale === 'ar'
  return {
    clinical: ar ? test.clinical_use_ar : test.clinical_use_en,
    sample: ar ? test.sample_ar : test.sample_en,
    method: ar ? test.method_ar : test.method_en,
    turnaround: ar ? test.turnaround_ar : test.turnaround_en,
    price: ar ? test.price_display_ar : test.price_display_en,
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
        <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
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
  const img = test.image_url ?? '/placeholder-test.svg'
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

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm">
            <img src={img} alt="" className="aspect-[16/10] w-full object-cover" loading="eager" />
          </div>
          <div>
            {categoryLabel && (
              <p className="text-sm font-semibold uppercase tracking-wide text-urgen-purple">
                {categoryLabel}
              </p>
            )}
            <h1 className="mt-2 text-3xl font-extrabold text-urgen-navy sm:text-4xl">{copy.title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">{copy.description}</p>

            {full ? (
              <dl className="mt-8 space-y-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-6 text-slate-700">
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {m.testDetail.turnaround}
                    </dt>
                    <dd className="mt-1">{d.turnaround}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {m.testDetail.price}
                    </dt>
                    <dd className="mt-1">{d.price}</dd>
                  </div>
                </div>
                <p className="text-xs text-slate-500">{m.testDetail.currencyNote}</p>
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
              <div className="mt-8 rounded-2xl bg-urgen-sky-soft/80 p-6 text-slate-700">
                <h2 className="text-lg font-bold text-urgen-navy">{m.testDetail.deeper}</h2>
                <p className="mt-3 leading-relaxed">{copy.long ?? m.testDetail.longFallback}</p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/book">
                <Button>{m.testDetail.bookThis}</Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline">{m.testDetail.askBefore}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
