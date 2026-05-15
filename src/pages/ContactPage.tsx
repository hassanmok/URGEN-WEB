import { useState, type FormEvent, type ReactNode } from 'react'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Button } from '../components/ui/Button'
import { submitContactMessage } from '../lib/contactStore'
import { supabase } from '../lib/supabase'
import { useLocaleContext } from '../i18n/useLocaleContext'
import { pickLocale, useSiteContent } from '../i18n/useSiteContent'

const LAB_LOCATION = {
  lat: 33.312282541093865,
  lng: 44.366563979826594,
} as const

const PHONES = [
  { href: 'tel:+9647818220220', label: '+964 781 822 0220' },
  { href: 'tel:+9647718220220', label: '+964 771 822 0220' },
] as const

const inputClass =
  'mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-urgen-purple focus:ring-2 focus:ring-urgen-purple/25'

const quickActionClass =
  'flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-urgen-navy transition hover:border-urgen-purple/40 hover:bg-urgen-sky-soft/50 active:scale-[0.99]'

export function ContactPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { locale, messages: m } = useLocaleContext()
  const { content } = useSiteContent()
  const contact = pickLocale(content.contact, locale)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const full_name = String(fd.get('name') ?? '').trim()
    const email = String(fd.get('email') ?? '').trim()
    const message = String(fd.get('message') ?? '').trim()

    if (!full_name || !message) return

    if (!supabase) {
      setSent(true)
      setError(m.contact.noSupabase)
      return
    }

    setSubmitting(true)
    const result = await submitContactMessage({ full_name, email: email || undefined, message })
    setSubmitting(false)

    if (!result.ok) {
      setError(m.contact.errSubmit)
      return
    }

    setSent(true)
    e.currentTarget.reset()
  }

  const mapHl = locale === 'ar' ? 'ar' : 'en'
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${LAB_LOCATION.lat},${LAB_LOCATION.lng}`

  return (
    <div className="bg-gradient-to-b from-urgen-sky-soft/40 to-white py-8 sm:py-12 lg:py-20">
      <div className="container-urgen">
        <SectionHeading
          eyebrow={contact.eyebrow}
          title={contact.title}
          subtitle={contact.subtitle}
          align="start"
        />

        <div className="mt-6 grid grid-cols-2 gap-2 sm:hidden">
          {PHONES.map((phone) => (
            <a
              key={phone.href}
              href={phone.href}
              className={`${quickActionClass} col-span-1`}
              dir="ltr"
            >
              <PhoneIcon />
              <span className="truncate text-xs">{phone.label}</span>
            </a>
          ))}
          <a
            href={`mailto:${contact.email}`}
            className={`${quickActionClass} col-span-2`}
            dir="ltr"
          >
            <EmailIcon />
            <span className="truncate">{contact.email}</span>
          </a>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${quickActionClass} col-span-2 border-urgen-purple/25 bg-urgen-sky-soft/30`}
          >
            <MapPinIcon />
            {m.contact.getDirections}
          </a>
        </div>

        <div className="mt-8 grid gap-6 lg:mt-12 lg:grid-cols-[1fr_1.1fr] lg:gap-10 lg:items-start">
          <div className="order-1 lg:order-2">
            <form
              onSubmit={onSubmit}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-lg sm:p-6 lg:p-8"
            >
              <h2 className="text-lg font-bold text-urgen-navy">{m.contact.formTitle}</h2>
              <p className="mt-2 hidden text-sm text-slate-600 sm:block">{m.contact.formHint}</p>
              <label className="mt-5 block text-sm font-semibold text-urgen-navy sm:mt-6">
                {m.contact.name}
                <input name="name" required className={inputClass} autoComplete="name" />
              </label>
              <label className="mt-4 block text-sm font-semibold text-urgen-navy">
                {m.contact.email}
                <input
                  name="email"
                  type="email"
                  className={inputClass}
                  dir="ltr"
                  autoComplete="email"
                />
              </label>
              <label className="mt-4 block text-sm font-semibold text-urgen-navy">
                {m.contact.message}
                <textarea
                  name="message"
                  required
                  rows={4}
                  className={`${inputClass} resize-y sm:min-h-[8.5rem]`}
                />
              </label>
              {error && <p className="mt-4 text-sm text-amber-800">{error}</p>}
              {sent ? (
                <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
                  {m.contact.sent}
                </p>
              ) : (
                <Button type="submit" className="mt-6 w-full sm:w-auto" disabled={submitting}>
                  {submitting ? '…' : m.contact.send}
                </Button>
              )}
            </form>
          </div>

          <div className="order-2 space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 lg:order-1">
            <h2 className="text-lg font-bold text-urgen-navy">{m.contact.detailsTitle}</h2>
            <ul className="hidden space-y-4 text-slate-700 sm:block">
              <ContactRow
                icon={<PhoneIcon />}
                label={m.contact.phone}
                content={
                  <>
                    {PHONES.map((phone) => (
                      <a
                        key={phone.href}
                        href={phone.href}
                        className="block hover:text-urgen-navy"
                        dir="ltr"
                      >
                        {phone.label.replace(/\s/g, '')}
                      </a>
                    ))}
                  </>
                }
              />
              <ContactRow
                icon={<EmailIcon />}
                label={m.contact.email}
                content={
                  <a
                    className="text-sm hover:text-urgen-purple"
                    href={`mailto:${contact.email}`}
                    dir="ltr"
                  >
                    {contact.email}
                  </a>
                }
              />
              <ContactRow
                icon={<MapPinIcon />}
                label={m.contact.location}
                content={<p className="text-sm text-slate-600">{contact.address}</p>}
              />
            </ul>

            <div className="sm:hidden">
              <p className="text-sm font-semibold text-urgen-navy">{m.contact.location}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{contact.address}</p>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
              <div className="relative h-48 w-full sm:aspect-video sm:h-auto sm:min-h-[200px]">
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
        </div>
      </div>
    </div>
  )
}

function ContactRow({
  icon,
  label,
  content,
}: {
  icon: ReactNode
  label: string
  content: ReactNode
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 shrink-0 text-urgen-purple" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-urgen-navy">{label}</p>
        <div className="mt-0.5 text-sm">{content}</div>
      </div>
    </li>
  )
}

function PhoneIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z" />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
    </svg>
  )
}
