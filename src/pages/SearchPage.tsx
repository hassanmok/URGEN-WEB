import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SectionHeading } from '../components/ui/SectionHeading'
import { SearchBar } from '../components/layout/SearchBar'
import { useLocaleContext } from '../i18n/useLocaleContext'
import { buildSearchDocuments, searchAndRank } from '../lib/searchIndex'

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''
  const { locale, messages: m } = useLocaleContext()

  const docs = useMemo(() => buildSearchDocuments(locale, m), [locale, m])
  const hits = useMemo(() => searchAndRank(docs, query), [docs, query])

  const subtitle = query
    ? m.searchPage.resultsCount.replace('{n}', String(hits.length))
    : m.searchPage.hintNoQuery

  return (
    <div className="bg-white py-14 lg:py-20">
      <div className="container-urgen">
        <SectionHeading
          eyebrow={m.searchPage.eyebrow}
          title={m.searchPage.title}
          subtitle={subtitle}
        />

        <div className="mx-auto mt-10 max-w-2xl">
          <SearchBar className="w-full" autoFocus />
        </div>

        {!query && (
          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-slate-500">
            {m.searchPage.hintEmpty}
          </p>
        )}

        {query && hits.length === 0 && (
          <p className="mx-auto mt-10 max-w-2xl text-center text-slate-600">{m.searchPage.noResults}</p>
        )}

        {query && hits.length > 0 && (
          <ul className="mx-auto mt-10 max-w-3xl space-y-4">
            {hits.map((hit) => (
              <li key={hit.doc.id}>
                <Link
                  to={hit.doc.href}
                  className="block rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-urgen-purple/30 hover:shadow-md"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-urgen-purple">
                    {hit.doc.kind === 'test' ? m.searchPage.kindTest : m.searchPage.kindPage}
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-urgen-navy">{hit.doc.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{hit.snippet}</p>
                  <span className="mt-3 inline-block text-sm font-medium text-urgen-purple">
                    {m.searchPage.goTo}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
