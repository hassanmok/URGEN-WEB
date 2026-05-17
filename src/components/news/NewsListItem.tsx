import { Link } from 'react-router-dom'
import { formatNewsDateShort, getNewsListThumbUrl, pickNewsLocalized } from '../../lib/newsFormat'
import type { NewsRecord } from '../../types/news'
import type { Locale } from '../../i18n/messages'

type Props = {
  item: NewsRecord
  locale: Locale
  readMore: string
}

export function NewsListItem({ item, locale, readMore }: Props) {
  const { title, summary } = pickNewsLocalized(item, locale)
  const date = formatNewsDateShort(item.created_at, locale)
  const cover = getNewsListThumbUrl(item)

  return (
    <article className="border-b border-slate-200 py-10 first:pt-0 last:border-b-0">
      <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
        {cover && (
          <Link
            to={`/news/${item.id}`}
            className="block shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 shadow-sm sm:w-52 md:w-60 lg:w-72"
          >
            <img
              src={cover}
              alt=""
              className="aspect-[16/10] h-full w-full object-contain transition duration-300 hover:scale-[1.02]"
              loading="lazy"
            />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-snug text-urgen-navy sm:text-[1.65rem]">
            <Link to={`/news/${item.id}`} className="hover:text-urgen-purple">
              {title}
            </Link>
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">{summary}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <time dateTime={item.created_at} className="text-slate-500">
              {date}
            </time>
            <Link
              to={`/news/${item.id}`}
              className="font-semibold text-urgen-purple hover:underline"
            >
              {readMore}
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
