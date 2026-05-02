import { Link, useParams } from 'react-router-dom'
import { useTestBySlug } from '../hooks/useTests'
import { useLocaleContext } from '../i18n/useLocaleContext'
import { getLocalizedTestCopy } from '../i18n/localizedTest'
import { Button } from '../components/ui/Button'

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
  const longText = copy.long ?? m.testDetail.longFallback

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
            <h1 className="text-3xl font-extrabold text-urgen-navy sm:text-4xl">{copy.title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">{copy.description}</p>
            <div className="mt-8 rounded-2xl bg-urgen-sky-soft/80 p-6 text-slate-700">
              <h2 className="text-lg font-bold text-urgen-navy">{m.testDetail.deeper}</h2>
              <p className="mt-3 leading-relaxed">{longText}</p>
            </div>
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
