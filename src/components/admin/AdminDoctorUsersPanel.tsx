import { type FormEvent, useEffect, useState } from 'react'
import type { Messages } from '../../i18n/messages'
import {
  createDoctorUser,
  deleteDoctorUser,
  displayDoctorUserEmail,
  fetchDoctorUsersAdmin,
  isDoctorPlaceholderEmail,
  setDoctorUserLocked,
  updateDoctorUser,
  type DoctorUserAdminRow,
} from '../../lib/doctorUsersAdmin'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { PasswordInput } from '../ui/PasswordInput'

type Props = {
  m: Messages['admin']
}

const inputClass =
  'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20'

function explainDoctorUserErr(raw: string | undefined, m: Messages['admin']): string {
  const code = raw?.trim()
  if (!code) return m.doctorUsersErrGeneric
  const map: Record<string, string> = {
    weak_password: m.doctorUsersErrWeak,
    missing_fields: m.doctorUsersErrRequired,
    invalid_username: m.doctorUsersErrInvalidUsername,
    invalid_username_chars: m.doctorUsersErrInvalidUsername,
    forbidden: m.doctorUsersErrForbidden,
    unauthorized: m.doctorUsersErrForbidden,
    server_misconfigured: m.doctorUsersErrServer,
  }
  if (map[code]) return map[code]
  if (/non-2xx|failed to fetch|function .*not found/i.test(code)) return m.doctorUsersErrNotDeployed
  return code.length > 200 ? m.doctorUsersErrGeneric : code
}

export function AdminDoctorUsersPanel({ m }: Props) {
  const hasSupabase = Boolean(supabase)
  const [rows, setRows] = useState<DoctorUserAdminRow[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [doctor_username, setDoctorUsername] = useState('')
  const [display_name, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    doctor_username: '',
    display_name: '',
    email: '',
    password: '',
  })

  async function reload() {
    setLoading(true)
    const res = await fetchDoctorUsersAdmin()
    if (res.ok && res.rows) {
      setRows(res.rows)
      setMessage(null)
    } else {
      setRows([])
      setMessage({ type: 'err', text: res.error ?? m.doctorUsersLoadErr })
    }
    setLoading(false)
  }

  useEffect(() => {
    if (hasSupabase) void reload()
    else setLoading(false)
  }, [hasSupabase])

  async function onSubmitCreate(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (password !== password2) {
      setMessage({ type: 'err', text: m.doctorUsersErrMismatch })
      return
    }
    if (password.length < 6) {
      setMessage({ type: 'err', text: m.doctorUsersErrWeak })
      return
    }
    const u = doctor_username.trim()
    if (u.length < 2 || u.length > 64 || !/^[a-zA-Z0-9._-]+$/.test(u)) {
      setMessage({ type: 'err', text: m.doctorUsersErrInvalidUsername })
      return
    }
    if (!display_name.trim()) {
      setMessage({ type: 'err', text: m.doctorUsersErrRequired })
      return
    }

    setSubmitting(true)
    const result = await createDoctorUser({
      ...(email.trim() ? { email: email.trim() } : {}),
      password,
      display_name: display_name.trim(),
      doctor_username: u,
    })
    setSubmitting(false)

    if (!result.ok) {
      setMessage({ type: 'err', text: explainDoctorUserErr(result.error, m) })
      return
    }
    setMessage({ type: 'ok', text: m.doctorUsersCreated })
    setDoctorUsername('')
    setDisplayName('')
    setEmail('')
    setPassword('')
    setPassword2('')
    await reload()
  }

  async function onSubmitEdit(e: FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setMessage(null)
    const u = editForm.doctor_username.trim()
    if (u.length < 2 || u.length > 64 || !/^[a-zA-Z0-9._-]+$/.test(u)) {
      setMessage({ type: 'err', text: m.doctorUsersErrInvalidUsername })
      return
    }
    if (!editForm.display_name.trim()) {
      setMessage({ type: 'err', text: m.doctorUsersErrRequired })
      return
    }

    setSubmitting(true)
    const result = await updateDoctorUser({
      user_id: editingId,
      display_name: editForm.display_name.trim(),
      doctor_username: u,
      ...(editForm.email.trim() ? { email: editForm.email.trim() } : {}),
      ...(editForm.password ? { password: editForm.password } : {}),
    })
    setSubmitting(false)

    if (!result.ok) {
      setMessage({ type: 'err', text: explainDoctorUserErr(result.error, m) })
      return
    }
    setMessage({ type: 'ok', text: m.doctorUsersUpdated })
    setEditingId(null)
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
      <h2 className="text-lg font-bold text-urgen-navy">{m.doctorUsersTitle}</h2>
      <p className="mt-2 text-sm text-slate-600">{m.doctorUsersIntro}</p>

      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={onSubmitCreate}>
        <label className="block sm:col-span-1">
          <span className="text-sm font-medium text-slate-700">{m.doctorUsersUsername}</span>
          <input
            type="text"
            value={doctor_username}
            onChange={(e) => setDoctorUsername(e.target.value)}
            className={`${inputClass} mt-1`}
            dir="ltr"
            required
          />
        </label>
        <label className="block sm:col-span-1">
          <span className="text-sm font-medium text-slate-700">{m.doctorUsersDisplayName}</span>
          <input
            type="text"
            value={display_name}
            onChange={(e) => setDisplayName(e.target.value)}
            className={`${inputClass} mt-1`}
            required
          />
        </label>
        <label className="block sm:col-span-1">
          <span className="text-sm font-medium text-slate-700">{m.doctorUsersEmail}</span>
          <span className="ms-1 text-xs text-slate-500">({m.doctorUsersEmailOptional})</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputClass} mt-1`}
            dir="ltr"
          />
        </label>
        <label className="block sm:col-span-1">
          <span className="text-sm font-medium text-slate-700">{m.doctorUsersPassword}</span>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} mt-1`}
            dir="ltr"
            required
          />
        </label>
        <label className="block sm:col-span-1">
          <span className="text-sm font-medium text-slate-700">{m.doctorUsersPasswordConfirm}</span>
          <PasswordInput
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            className={`${inputClass} mt-1`}
            dir="ltr"
            required
          />
        </label>
        <div className="flex items-end sm:col-span-1">
          <Button type="submit" disabled={submitting}>
            {submitting ? m.doctorUsersCreating : m.doctorUsersCreate}
          </Button>
        </div>
      </form>

      {message && (
        <p
          className={`mt-4 text-sm ${message.type === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}
        >
          {message.text}
        </p>
      )}

      <h3 className="mt-10 text-base font-bold text-urgen-navy">{m.doctorUsersListTitle}</h3>
      {loading ? (
        <p className="mt-4 text-sm text-slate-500">{m.doctorUsersLoading}</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{m.doctorUsersEmpty}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {rows.map((row) => (
            <li
              key={row.user_id}
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm"
            >
              {editingId === row.user_id ? (
                <form className="space-y-3" onSubmit={onSubmitEdit}>
                  <input
                    className={inputClass}
                    value={editForm.doctor_username}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, doctor_username: e.target.value }))
                    }
                    dir="ltr"
                  />
                  <input
                    className={inputClass}
                    value={editForm.display_name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, display_name: e.target.value }))
                    }
                  />
                  <input
                    className={inputClass}
                    type="email"
                    placeholder={m.doctorUsersEmail}
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    dir="ltr"
                  />
                  <PasswordInput
                    className={inputClass}
                    placeholder={m.doctorUsersPassword}
                    value={editForm.password}
                    onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                    dir="ltr"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={submitting}>
                      {m.doctorUsersSave}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                      {m.doctorUsersCancel}
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="font-bold text-urgen-navy">{row.display_name}</p>
                  <p className="text-slate-600">
                    {m.doctorUsersColUsername}:{' '}
                    <span dir="ltr" className="font-mono">
                      {row.doctor_username ?? '—'}
                    </span>
                  </p>
                  <p className="text-slate-600">
                    {m.doctorUsersColEmail}: {displayDoctorUserEmail(row.email)}
                  </p>
                  <p className="text-slate-600">
                    {row.is_locked ? m.doctorUsersLocked : m.doctorUsersActive}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        setEditingId(row.user_id)
                        setEditForm({
                          doctor_username: row.doctor_username ?? '',
                          display_name: row.display_name,
                          email: isDoctorPlaceholderEmail(row.email) ? '' : row.email,
                          password: '',
                        })
                      }}
                    >
                      {m.doctorUsersEdit}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs"
                      disabled={submitting}
                      onClick={() =>
                        void setDoctorUserLocked(row.user_id, !row.is_locked).then((r) => {
                          if (r.ok) void reload()
                          else setMessage({ type: 'err', text: explainDoctorUserErr(r.error, m) })
                        })
                      }
                    >
                      {row.is_locked ? m.doctorUsersUnlock : m.doctorUsersLock}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs text-red-700"
                      disabled={submitting}
                      onClick={() => {
                        if (!window.confirm(m.doctorUsersDeleteConfirm)) return
                        void deleteDoctorUser(row.user_id).then((r) => {
                          if (r.ok) void reload()
                          else setMessage({ type: 'err', text: explainDoctorUserErr(r.error, m) })
                        })
                      }}
                    >
                      {m.doctorUsersDelete}
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
