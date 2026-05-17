import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ImageCarousel } from '../components/news/ImageCarousel'
import { Button } from '../components/ui/Button'
import { fetchNewsById } from '../lib/newsStore'
import {
  formatNewsDateLong,
  newsAllSlides,
  pickNewsLocalized,
} from '../lib/newsFormat'
import { useLocaleContext } from '../i18n/useLocaleContext'
import type { NewsRecord } from '../types/news'

export function NewsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { locale, messages: m } = useLocaleContext()
  const [item, setItem] = useState<NewsRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    let cancelled = false
    void (async () => {
      setLoading(true)
      const data = await fetchNewsById(id)
      if (!cancelled) {
        setItem(data)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="bg-white py-20">
        <p className="container-urgen text-center text-slate-500">{m.newsPage.loading}</p>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="container-urgen py-20 text-center">
        <p className="text-slate-600">{m.newsPage.notFound}</p>
        <Link to="/news" className="mt-6 inline-block">
          <Button variant="outline">{m.newsPage.backToNews}</Button>
        </Link>
      </div>
    )
  }

  const { title, summary, body } = pickNewsLocalized(item, locale)
  const paragraphs = body.split(/\n\n+/).filter(Boolean)
  const slides = newsAllSlides(item, locale)

  return (
    <article className="bg-white">
      <ImageCarousel
        slides={slides}
        prevLabel={m.newsPage.carouselPrev}
        nextLabel={m.newsPage.carouselNext}
        className="w-full"
      />

      <div className="container-urgen max-w-3xl py-10 lg:py-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-urgen-purple">
          <Link to="/news" className="hover:underline">
            {m.newsPage.breadcrumb}
          </Link>
        </p>

        <h1 className="mt-4 text-3xl font-bold leading-tight text-urgen-navy lg:text-4xl">{title}</h1>

        <time dateTime={item.created_at} className="mt-4 block text-base text-slate-500">
          {formatNewsDateLong(item.created_at, locale)}
        </time>

        {summary.trim() && (
          <p className="mt-6 text-lg leading-relaxed text-slate-600">{summary}</p>
        )}

        <div className="mt-8 space-y-5 text-base leading-relaxed text-slate-700">
          {paragraphs.map((p) => (
            <p key={p.slice(0, 32)}>{p}</p>
          ))}
        </div>
      </div>
    </article>
  )
}

