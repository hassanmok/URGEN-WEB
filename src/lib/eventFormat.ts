import type { Locale } from '../i18n/messages'
import type { EventRecord } from '../types/event'

export function pickEventLocalized(event: EventRecord, locale: Locale) {
  const isAr = locale === 'ar'
  return {
    title: isAr ? event.title_ar : event.title_en,
    description: isAr ? event.description_ar : event.description_en,
    body: isAr ? event.body_ar : event.body_en,
    location: isAr ? event.location_ar : event.location_en,
  }
}

export function formatEventDateLong(isoDate: string, locale: Locale) {
  const d = new Date(isoDate + 'T12:00:00')
  return d.toLocaleDateString(locale === 'ar' ? 'ar-IQ' : 'en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
