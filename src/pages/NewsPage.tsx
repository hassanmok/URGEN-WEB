import { useMemo, useState } from 'react'
import { NewsListItem } from '../components/news/NewsListItem'
import { NewsPagination } from '../components/news/NewsPagination'
import { useNews } from '../hooks/useNews'
import { useLocaleContext } from '../i18n/useLocaleContext'

const PAGE_SIZE = 8

export function NewsPage() {
  const { locale, messages: m } = useLocaleContext()
  const { news, loading } = useNews()
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(news.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return news.slice(start, start + PAGE_SIZE)
  }, [news, safePage])

  return (
    <div className="bg-white py-12 lg:py-16">
      <div className="container-urgen max-w-4xl">
        <h1 className="text-4xl font-bold tracking-tight text-urgen-navy lg:text-5xl">
          {m.newsPage.listTitle}
        </h1>

        {loading ? (
          <p className="mt-12 text-slate-500">{m.newsPage.loading}</p>
        ) : news.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center text-slate-600">
            {m.newsPage.empty}
          </p>
        ) : (
          <>
            <div className="mt-10">
              {pageItems.map((item) => (
                <NewsListItem
                  key={item.id}
                  item={item}
                  locale={locale}
                  readMore={m.newsPage.readMore}
                />
              ))}
            </div>
            <NewsPagination
              page={safePage}
              totalPages={totalPages}
              onPage={setPage}
              labels={m.newsPage}
            />
          </>
        )}
      </div>
    </div>
  )
}
