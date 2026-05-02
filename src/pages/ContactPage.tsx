import { useState, type FormEvent } from 'react'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Button } from '../components/ui/Button'
import { useLocaleContext } from '../i18n/useLocaleContext'

const LAB_LOCATION = {
  lat: 33.312282541093865,
  lng: 44.366563979826594,
} as const

export function ContactPage() {
  const [sent, setSent] = useState(false)
  const { locale, messages: m } = useLocaleContext()

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  const mapHl = locale === 'ar' ? 'ar' : 'en'

  return (
    <div className="bg-gradient-to-b from-urgen-sky-soft/40 to-white py-14 lg:py-20">
      <div className="container-urgen">
        <SectionHeading
          eyebrow={m.contact.eyebrow}
          title={m.contact.title}
          subtitle={m.contact.subtitle}
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-urgen-navy">{m.contact.detailsTitle}</h2>
            <ul className="space-y-4 text-slate-700">
              <li className="flex gap-3">
                <span className="mt-1 text-urgen-purple" aria-hidden>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-urgen-navy">{m.contact.phone}</p>
                  <a href="tel:+9647818220220" className="hover:text-urgen-navy" dir="ltr">
                    +9647818220220
                  </a>
                  <br />
                  <a href="tel:+9647718220220" className="hover:text-urgen-navy" dir="ltr">
                    +9647718220220
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 text-urgen-purple" aria-hidden>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-urgen-navy">{m.contact.email}</p>
                  <a
                    className="text-sm hover:text-urgen-purple"
                    href="mailto:info@urgen.lab"
                    dir="ltr"
                  >
                    info@urgen.lab
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 text-urgen-purple" aria-hidden>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-urgen-navy">{m.contact.location}</p>
                  <p className="text-sm text-slate-600">{m.contact.address}</p>
                </div>
              </li>
            </ul>

            <div className="relative mt-6 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
              <div className="relative aspect-video w-full min-h-[200px]">
                <iframe
                  title={m.contact.mapTitle}
                  className="absolute inset-0 h-full w-full border-0"
                  src={`https://www.google.com/maps?q=${LAB_LOCATION.lat},${LAB_LOCATION.lng}&z=17&hl=${mapHl}&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </div>

          <div>
            <form
              onSubmit={onSubmit}
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-lg sm:p-8"
            >
              <h2 className="text-lg font-bold text-urgen-navy">{m.contact.formTitle}</h2>
              <p className="mt-2 text-sm text-slate-600">{m.contact.formHint}</p>
              <label className="mt-6 block text-sm font-semibold text-urgen-navy">
                {m.contact.name}
                <input
                  required
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-urgen-purple focus:ring-2 focus:ring-urgen-purple/25"
                />
              </label>
              <label className="mt-4 block text-sm font-semibold text-urgen-navy">
                {m.contact.message}
                <textarea
                  required
                  rows={5}
                  className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-urgen-purple focus:ring-2 focus:ring-urgen-purple/25"
                />
              </label>
              {sent ? (
                <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
                  {m.contact.sent}
                </p>
              ) : (
                <Button type="submit" className="mt-6">
                  {m.contact.send}
                </Button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
