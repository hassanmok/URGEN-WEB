import { Link } from 'react-router-dom'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import type { CategoryCard as CategoryCardData } from '../../data/testCategoryCards'

export function CategoryCard({ card }: { card: CategoryCardData }) {
  const { locale, messages: m } = useLocaleContext()

  return (
    <Link
      to={`/tests#cat-${card.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white text-center shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-urgen-purple/40 focus-visible:ring-offset-2"
    >
      {/* الصورة */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={card.image}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* المحتوى */}
      <div className="flex flex-1 flex-col px-6 pb-6 pt-6">
        <h3 className="text-lg font-bold leading-snug text-urgen-navy">
          {card.title[locale]}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
          {card.description[locale]}
        </p>
        <span className="mx-auto mt-5 inline-flex items-center justify-center rounded-full border-2 border-urgen-purple/40 bg-white px-6 py-2 text-sm font-semibold text-urgen-navy transition group-hover:border-urgen-purple group-hover:bg-urgen-purple group-hover:text-white">
          {m.testCard.learnMore}
        </span>
      </div>
    </Link>
  )
}
