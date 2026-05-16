import { type FormEvent, useEffect, useState } from 'react'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import type { Messages } from '../../i18n/messages'
import {
  createPartnerLabUser,
  fetchPartnerLabUsersAdmin,
  type PartnerLabUserAdminRow,
} from '../../lib/partnerLabUsersAdmin'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/Button'

type Props = {
  m: Messages['admin']
}

const inputClass =
  'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20'

function formatLabDate(iso: string | null, locale: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      dateStyle: 'medium',
    })
  } catch {
    return iso
  }
}

function explainPartnerUserErr(raw: string | undefined, m: Messages['admin']): string {
  const code = raw?.trim()
  if (!code) return m.partnerUsersErrGeneric
  const map: Record<string, string> = {
    weak_password: m.partnerUsersErrWeak,
    invalid_email: m.partnerUsersErrGeneric,
    missing_fields: m.partnerUsersErrRequired,
    invalid_username: m.partnerUsersErrInvalidUsername,
    invalid_username_chars: m.partnerUsersErrInvalidUsername,
    forbidden: m.partnerUsersErrForbidden,
    unauthorized: m.partnerUsersErrForbidden,
    server_misconfigured: m.partnerUsersErrServer,
  }
  if (map[code]) return map[code]
  if (/non-2xx|failed to fetch|function .*not found/i.test(code)) return m.partnerUsersErrNotDeployed
  return code.length > 200 ? m.partnerUsersErrGeneric : code
}

export function AdminPartnerLabUsersPanel({ m }: Props) {
  const { locale } = useLocaleContext()
  const hasSupabase = Boolean(supabase)
  const [rows, setRows] = useState<PartnerLabUserAdminRow[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [partner_username, setPartnerUsername] = useState('')
  const [lab_display_name, setLabDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')

  async function reload() {
    setLoading(true)
    const res = await fetchPartnerLabUsersAdmin()
    if (res.ok && res.rows) {
      setRows(res.rows)
      setMessage(null)
    } else {
      setRows([])
      setMessage({ type: 'err', text: res.error ?? m.partnerUsersLoadErr })
    }
    setLoading(false)
  }

  useEffect(() => {
    if (hasSupabase) void reload()
    else setLoading(false)
  }, [hasSupabase])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (password !== password2) {
      setMessage({ type: 'err', text: m.partnerUsersErrMismatch })
      return
    }
    if (password.length < 6) {
      setMessage({ type: 'err', text: m.partnerUsersErrWeak })
      return
    }

    const u = partner_username.trim()
    if (u.length < 2 || u.length > 64 || !/^[a-zA-Z0-9._-]+$/.test(u)) {
      setMessage({ type: 'err', text: m.partnerUsersErrInvalidUsername })
      return
    }

    if (!lab_display_name.trim() || !email.trim()) {
      setMessage({ type: 'err', text: m.partnerUsersErrRequired })
      return
    }

    setSubmitting(true)
    const result = await createPartnerLabUser({
      email: email.trim(),
      password,
      lab_display_name: lab_display_name.trim(),
      partner_username: u,
    })
    setSubmitting(false)

    if (!result.ok) {
      setMessage({
        type: 'err',
        text: explainPartnerUserErr(result.error, m),
      })
      return
    }

    setMessage({ type: 'ok', text: m.partnerUsersCreated })
    setPassword('')
    setPassword2('')
    setPartnerUsername('')
    setLabDisplayName('')
    setEmail('')
    await reload()
  }

  if (!hasSupabase) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        {m.supabaseRequired}
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-urgen-navy">{m.partnerUsersTitle}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{m.partnerUsersIntro}</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">{m.partnerUsersUsername}</span>
          <input
            type="text"
            value={partner_username}
            onChange={(e) => setPartnerUsername(e.target.value)}
            className={`${inputClass} mt-1`}
            dir="ltr"
            autoComplete="off"
            placeholder="lab-alpha"
          />
          <span className="mt-1 block text-xs text-slate-500">{m.partnerUsersUsernameHint}</span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">{m.partnerUsersLabName}</span>
          <input
            type="text"
            value={lab_display_name}
            onChange={(e) => setLabDisplayName(e.target.value)}
            className={`${inputClass} mt-1`}
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
            autoComplete="organization"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">{m.partnerUsersEmail}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputClass} mt-1`}
            dir="ltr"
            autoComplete="email"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">{m.partnerUsersPassword}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} mt-1`}
              dir="ltr"
              autoComplete="new-password"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">{m.partnerUsersPasswordConfirm}</span>
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className={`${inputClass} mt-1`}
              dir="ltr"
              autoComplete="new-password"
            />
          </label>
        </div>

        <Button type="submit" disabled={submitting}>
          {submitting ? m.partnerUsersCreating : m.partnerUsersCreate}
        </Button>
      </form>

      {message && (
        <p
          className={`mt-4 text-sm ${message.type === 'ok' ? 'text-green-700' : 'text-red-600'}`}
          role={message.type === 'err' ? 'alert' : undefined}
        >
          {message.text}
        </p>
      )}

      <h3 className="mt-10 text-base font-bold text-urgen-navy">{m.partnerUsersListTitle}</h3>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">{m.partnerUsersLoading}</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{m.partnerUsersEmpty}</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left rtl:text-right">
                <th className="px-3 py-2 font-semibold text-slate-700">{m.partnerUsersColLab}</th>
                <th className="px-3 py-2 font-semibold text-slate-700">{m.partnerUsersColUsername}</th>
                <th className="px-3 py-2 font-semibold text-slate-700">{m.partnerUsersColEmail}</th>
                <th className="px-3 py-2 font-semibold text-slate-700">{m.partnerUsersColCreated}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.user_id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 text-slate-800">{row.lab_display_name}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-700" dir="ltr">
                    {row.partner_username ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-700" dir="ltr">
                    {row.email}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{formatLabDate(row.created_at, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
