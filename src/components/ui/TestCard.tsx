import { Link } from 'react-router-dom'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import { getLocalizedTestCopy } from '../../i18n/localizedTest'
import { getTestGradientClass } from '../../lib/testGradients'
import { Button } from './Button'
import type { LabTest } from '../../types/labTest'

type TestCardProps = {
  test: LabTest
  categoryLabel?: string
}

export function TestCard({ test, categoryLabel }: TestCardProps) {
  const { locale, messages: m } = useLocaleContext()
  const copy = getLocalizedTestCopy(test, locale, m)
  const gradient = getTestGradientClass(test)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md transition hover:shadow-xl">
      <div
        className={`relative flex min-h-[9.5rem] flex-col justify-end overflow-hidden p-5 sm:min-h-[10.5rem] ${gradient}`}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.22)_0%,transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent"
          aria-hidden
        />
        {categoryLabel && (
          <span className="relative mb-3 w-fit rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white ring-1 ring-white/30 backdrop-blur-sm">
            {categoryLabel}
          </span>
        )}
        <h3 className="relative text-lg font-bold leading-snug text-white drop-shadow-sm">
          {copy.title}
        </h3>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex-1 text-sm leading-relaxed text-slate-600">{copy.description}</p>
        <Link to={`/tests/${test.slug}`} className="mt-4 inline-flex">
          <Button variant="outline" className="w-full">
            {m.testCard.learnMore}
          </Button>
        </Link>
      </div>
    </article>
  )
}
