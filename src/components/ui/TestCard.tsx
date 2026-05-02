import { Link } from 'react-router-dom'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import { getLocalizedTestCopy } from '../../i18n/localizedTest'
import { Button } from './Button'
import type { TestRow } from '../../types/database'

type TestCardProps = {
  test: TestRow
}

export function TestCard({ test }: TestCardProps) {
  const { locale, messages: m } = useLocaleContext()
  const copy = getLocalizedTestCopy(test, locale, m)
  const img = test.image_url ?? '/placeholder-test.svg'

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md transition hover:shadow-xl">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={img}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-urgen-navy/70 via-transparent to-transparent opacity-90" />
        <h3 className="absolute bottom-3 start-4 end-4 text-lg font-bold text-white drop-shadow">
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
