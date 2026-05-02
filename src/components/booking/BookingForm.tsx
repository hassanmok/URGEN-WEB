import { useMemo, useState, type FormEvent } from 'react'
import { useTests } from '../../hooks/useTests'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import { getLocalizedTestCopy } from '../../i18n/localizedTest'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/Button'

const initial = {
  full_name: '',
  phone: '',
  email: '',
  preferred_date: '',
  test_slug: '',
  notes: '',
}

export function BookingForm() {
  const { tests } = useTests()
  const { locale, messages: m } = useLocaleContext()
  const [form, setForm] = useState(initial)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const testOptions = useMemo(
    () =>
      tests.map((t) => ({
        value: t.slug,
        label: getLocalizedTestCopy(t, locale, m).title,
      })),
    [tests, locale, m],
  )

  function update<K extends keyof typeof initial>(key: K, value: (typeof initial)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    setSubmitting(true)

    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      preferred_date: form.preferred_date || null,
      test_slug: form.test_slug || null,
      notes: form.notes.trim() || null,
      status: 'pending',
    }

    if (!payload.full_name || !payload.phone) {
      setMessage({ type: 'err', text: m.booking.errRequired })
      setSubmitting(false)
      return
    }

    if (!supabase) {
      setMessage({
        type: 'ok',
        text: m.booking.okLocal,
      })
      setSubmitting(false)
      setForm(initial)
      return
    }

    const { error } = await supabase.from('appointments').insert(payload)

    if (error) {
      setMessage({
        type: 'err',
        text: m.booking.errSupabase,
      })
      setSubmitting(false)
      return
    }

    setMessage({ type: 'ok', text: m.booking.okSaved })
    setForm(initial)
    setSubmitting(false)
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-lg sm:p-8"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-urgen-navy">
          {m.booking.fullName}
          <input
            required
            value={form.full_name}
            onChange={(e) => update('full_name', e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none ring-urgen-purple/30 transition focus:border-urgen-purple focus:ring-2"
            placeholder={m.booking.placeholderName}
            autoComplete="name"
          />
        </label>
        <label className="block text-sm font-semibold text-urgen-navy">
          {m.booking.phone}
          <input
            required
            dir="ltr"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none ring-urgen-purple/30 transition focus:border-urgen-purple focus:ring-2"
            placeholder={m.booking.placeholderPhone}
            autoComplete="tel"
          />
        </label>
      </div>

      <label className="block text-sm font-semibold text-urgen-navy">
        {m.booking.email}
        <input
          type="email"
          dir="ltr"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none ring-urgen-purple/30 transition focus:border-urgen-purple focus:ring-2"
          placeholder="you@example.com"
          autoComplete="email"
        />
      </label>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-urgen-navy">
          {m.booking.testRequired}
          <select
            value={form.test_slug}
            onChange={(e) => update('test_slug', e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none ring-urgen-purple/30 transition focus:border-urgen-purple focus:ring-2"
          >
            <option value="">{m.booking.selectTest}</option>
            {testOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-urgen-navy">
          {m.booking.preferredDate}
          <input
            type="date"
            value={form.preferred_date}
            onChange={(e) => update('preferred_date', e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none ring-urgen-purple/30 transition focus:border-urgen-purple focus:ring-2"
          />
        </label>
      </div>

      <label className="block text-sm font-semibold text-urgen-navy">
        {m.booking.notes}
        <textarea
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          rows={4}
          className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none ring-urgen-purple/30 transition focus:border-urgen-purple focus:ring-2"
          placeholder={m.booking.placeholderNotes}
        />
      </label>

      {message && (
        <p
          role="status"
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            message.type === 'ok'
              ? 'bg-emerald-50 text-emerald-900'
              : 'bg-red-50 text-red-900'
          }`}
        >
          {message.text}
        </p>
      )}

      <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
        {submitting ? m.booking.submitting : m.booking.submit}
      </Button>

      {!supabase && (
        <p className="text-xs leading-relaxed text-slate-500">{m.booking.envHint}</p>
      )}
    </form>
  )
}
