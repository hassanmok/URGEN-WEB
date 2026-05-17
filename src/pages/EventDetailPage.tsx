import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { fetchEventById } from '../lib/eventsStore'
import { formatEventDateLong, pickEventLocalized } from '../lib/eventFormat'
import { useLocaleContext } from '../i18n/useLocaleContext'
import type { EventRecord } from '../types/event'

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { locale, messages: m } = useLocaleContext()
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    let cancelled = false
    void (async () => {
      setLoading(true)
      const data = await fetchEventById(id)
      if (!cancelled) {
        setEvent(data)
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
        <p className="container-urgen text-center text-slate-500">{m.eventsPage.loading}</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container-urgen py-20 text-center">
        <p className="text-slate-600">{m.eventsPage.notFound}</p>
        <Link to="/events" className="mt-6 inline-block">
          <Button variant="outline">{m.eventsPage.backToEvents}</Button>
        </Link>
      </div>
    )
  }

  const { title, description, body, location } = pickEventLocalized(event, locale)
  const bodyParagraphs = body.split(/\n\n+/).filter(Boolean)

  return (
    <article className="bg-white">
      {event.image_url ? (
        <div className="flex w-full items-center justify-center bg-slate-100">
          <img
            src={event.image_url}
            alt={title}
            className="max-h-[min(70vh,520px)] w-full max-w-5xl object-contain p-4"
          />
        </div>
      ) : (
        <div
          className="h-48 w-full bg-gradient-to-br from-urgen-purple/15 via-urgen-sky-soft to-white"
          aria-hidden
        />
      )}

      <div className="container-urgen max-w-3xl py-10 lg:py-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-urgen-purple">
          <Link to="/events" className="hover:underline">
            {m.eventsPage.breadcrumb}
          </Link>
        </p>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-urgen-purple">
          {m.eventsPage.dateLabel}: {formatEventDateLong(event.event_date, locale)}
        </p>

        <h1 className="mt-2 text-3xl font-bold leading-tight text-urgen-navy lg:text-4xl">{title}</h1>

        {location && (
          <p className="mt-4 flex items-start gap-2 text-base text-slate-600">
            <svg
              className="mt-1 h-5 w-5 shrink-0 text-urgen-purple"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{location}</span>
          </p>
        )}

        <p className="mt-6 text-lg leading-relaxed text-slate-600">{description}</p>

        {bodyParagraphs.length > 0 && (
          <div className="mt-8 space-y-5 text-base leading-relaxed text-slate-700">
            {bodyParagraphs.map((p) => (
              <p key={p.slice(0, 32)}>{p}</p>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
