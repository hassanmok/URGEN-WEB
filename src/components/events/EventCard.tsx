import { createElement } from 'react'
import type { EventRecord } from '../../types/event'
import type { Locale } from '../../i18n/messages'

type EventCardProps = {
  event: EventRecord
  locale: Locale
  dateLabel: string
}

function pickLocalized(event: EventRecord, locale: Locale) {
  const isAr = locale === 'ar'
  return {
    title: isAr ? event.title_ar : event.title_en,
    description: isAr ? event.description_ar : event.description_en,
    location: isAr ? event.location_ar : event.location_en,
  }
}

function formatEventDate(isoDate: string, locale: Locale) {
  const d = new Date(isoDate + 'T12:00:00')
  return d.toLocaleDateString(locale === 'ar' ? 'ar-IQ' : 'en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function EventCard({ event, locale, dateLabel }: EventCardProps) {
  const { title, description, location } = pickLocalized(event, locale)

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md">
      {event.image_url ? (
        <img
          src={event.image_url}
          alt=""
          className="h-48 w-full object-cover"
          loading="lazy"
        />
      ) : (
        createElement('div', {
          className:
            'h-48 w-full bg-gradient-to-br from-urgen-purple/15 via-urgen-sky-soft to-white',
          'aria-hidden': true,
        })
      )}
      {createElement(
        'div',
        { className: 'p-6' },
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-urgen-purple">
            {dateLabel}: {formatEventDate(event.event_date, locale)}
          </p>
          <h3 className="mt-2 text-xl font-bold text-urgen-navy">{title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
          {location &&
            createElement(
              'p',
              { className: 'mt-4 flex items-start gap-2 text-sm text-slate-500' },
              <>
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-urgen-purple"
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
              </>,
            )}
        </>,
      )}
    </article>
  )
}
