import { type FormEvent, useEffect, useState } from 'react'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import type { Messages } from '../../i18n/messages'
import { COUNTRIES, governorateLabel, locationLabel, regionLabel } from '../../data/iraqLocations'
import {
  createPartnerLabUser,
  deletePartnerLabUser,
  displayPartnerLabUserEmail,
  fetchPartnerLabUsersAdmin,
  isPartnerPlaceholderEmail,
  setPartnerLabUserLocked,
  updatePartnerLabUser,
  type PartnerLabUserAdminRow,
} from '../../lib/partnerLabUsersAdmin'
import { supabase } from '../../lib/supabase'
import { CascadingLocationFields } from './CascadingLocationFields'
import { Button } from '../ui/Button'
import { PasswordInput } from '../ui/PasswordInput'

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

const emptyLocation = { country: '', governorate: '', region: '' }

function LabUserStatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={
        active
          ? 'inline-flex w-fit items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200'
          : 'inline-flex w-fit items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-300'
      }
    >
      {label}
    </span>
  )
}

function LabUserDetailRow({
  label,
  value,
  mono,
  status,
}: {
  label: string
  value: string
  mono?: boolean
  status?: 'active' | 'locked'
}) {
  return (
    <div className="grid grid-cols-1 gap-0.5 border-b border-slate-100 py-2.5 last:border-0 sm:grid-cols-[10rem_1fr] sm:gap-x-4">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      {status ? (
        <LabUserStatusBadge active={status === 'active'} label={value} />
      ) : (
        <span
          className={`text-sm text-urgen-navy ${mono ? 'font-mono font-normal' : 'font-medium'}`}
          dir={mono ? 'ltr' : undefined}
        >
          {value}
        </span>
      )}
    </div>
  )
}

export function AdminPartnerLabUsersPanel({ m }: Props) {
  const { locale } = useLocaleContext()
  const loc = locale === 'ar' ? 'ar' : 'en'
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
  const [createLoc, setCreateLoc] = useState(emptyLocation)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    partner_username: '',
    lab_display_name: '',
    email: '',
    password: '',
    ...emptyLocation,
  })

  const locationLabels = {
    country: m.partnerUsersCountry,
    governorate: m.partnerUsersGovernorate,
    region: m.partnerUsersRegion,
    selectCountry: m.partnerUsersSelectCountry,
    selectGovernorate: m.partnerUsersSelectGovernorate,
    selectRegion: m.partnerUsersSelectRegion,
  }

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

  function resetCreateForm() {
    setPartnerUsername('')
    setLabDisplayName('')
    setEmail('')
    setPassword('')
    setPassword2('')
    setCreateLoc(emptyLocation)
  }

  function startEdit(row: PartnerLabUserAdminRow) {
    setEditingId(row.user_id)
    setEditForm({
      partner_username: row.partner_username ?? '',
      lab_display_name: row.lab_display_name,
      email: isPartnerPlaceholderEmail(row.email) ? '' : row.email,
      password: '',
      country: row.country_code ?? '',
      governorate: row.governorate_id ?? '',
      region: row.region_id ?? '',
    })
    setMessage(null)
  }

  async function onSubmitCreate(e: FormEvent) {
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
    if (!lab_display_name.trim() || !createLoc.country || !createLoc.governorate || !createLoc.region) {
      setMessage({ type: 'err', text: m.partnerUsersErrRequired })
      return
    }

    setSubmitting(true)
    const result = await createPartnerLabUser({
      ...(email.trim() ? { email: email.trim() } : {}),
      password,
      lab_display_name: lab_display_name.trim(),
      partner_username: u,
      country_code: createLoc.country,
      governorate_id: createLoc.governorate,
      region_id: createLoc.region,
    })
    setSubmitting(false)

    if (!result.ok) {
      setMessage({ type: 'err', text: explainPartnerUserErr(result.error, m) })
      return
    }
    setMessage({ type: 'ok', text: m.partnerUsersCreated })
    resetCreateForm()
    await reload()
  }

  async function onSubmitEdit(e: FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setMessage(null)
    const u = editForm.partner_username.trim()
    if (u.length < 2 || u.length > 64 || !/^[a-zA-Z0-9._-]+$/.test(u)) {
      setMessage({ type: 'err', text: m.partnerUsersErrInvalidUsername })
      return
    }
    if (!editForm.lab_display_name.trim()) {
      setMessage({ type: 'err', text: m.partnerUsersErrRequired })
      return
    }
    if (editForm.password && editForm.password.length < 6) {
      setMessage({ type: 'err', text: m.partnerUsersErrWeak })
      return
    }

    setSubmitting(true)
    const result = await updatePartnerLabUser({
      user_id: editingId,
      lab_display_name: editForm.lab_display_name.trim(),
      partner_username: u,
      ...(editForm.email.trim() ? { email: editForm.email.trim() } : {}),
      password: editForm.password || undefined,
      country_code: editForm.country || undefined,
      governorate_id: editForm.governorate || undefined,
      region_id: editForm.region || undefined,
    })
    setSubmitting(false)

    if (!result.ok) {
      setMessage({ type: 'err', text: explainPartnerUserErr(result.error, m) })
      return
    }
    setMessage({ type: 'ok', text: m.partnerUsersUpdated })
    setEditingId(null)
    await reload()
  }

  async function toggleLock(row: PartnerLabUserAdminRow) {
    setMessage(null)
    setSubmitting(true)
    const result = await setPartnerLabUserLocked(row.user_id, !row.is_locked)
    setSubmitting(false)
    if (!result.ok) {
      setMessage({ type: 'err', text: explainPartnerUserErr(result.error, m) })
      return
    }
    setMessage({
      type: 'ok',
      text: row.is_locked ? m.partnerUsersUnlockedOk : m.partnerUsersLockedOk,
    })
    await reload()
  }

  async function onDelete(row: PartnerLabUserAdminRow) {
    if (!window.confirm(m.partnerUsersDeleteConfirm)) return
    setMessage(null)
    setSubmitting(true)
    const result = await deletePartnerLabUser(row.user_id)
    setSubmitting(false)
    if (!result.ok) {
      setMessage({ type: 'err', text: explainPartnerUserErr(result.error, m) })
      return
    }
    setMessage({ type: 'ok', text: m.partnerUsersDeleted })
    if (editingId === row.user_id) setEditingId(null)
    await reload()
  }

  function formatLocation(row: PartnerLabUserAdminRow) {
    if (!row.country_code) return '—'
    const country = locationLabel(COUNTRIES, row.country_code, loc)
    const gov = governorateLabel(row.governorate_id, loc)
    const reg = regionLabel(row.governorate_id, row.region_id, loc)
    return `${country} · ${gov} · ${reg}`
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
      {m.partnerUsersIntro ? (
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{m.partnerUsersIntro}</p>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={onSubmitCreate}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">{m.partnerUsersUsername}</span>
          <input
            type="text"
            value={partner_username}
            onChange={(e) => setPartnerUsername(e.target.value)}
            className={`${inputClass} mt-1`}
            dir="ltr"
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">{m.partnerUsersLabName}</span>
          <input
            type="text"
            value={lab_display_name}
            onChange={(e) => setLabDisplayName(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
        <CascadingLocationFields
          countryCode={createLoc.country}
          governorateId={createLoc.governorate}
          regionId={createLoc.region}
          onCountryChange={(country) =>
            setCreateLoc({ country, governorate: '', region: '' })
          }
          onGovernorateChange={(governorate) =>
            setCreateLoc((p) => ({ ...p, governorate, region: '' }))
          }
          onRegionChange={(region) => setCreateLoc((p) => ({ ...p, region }))}
          labels={locationLabels}
          disabled={submitting}
        />
        <label className="block">
          <span className="text-sm font-medium text-slate-700">{m.partnerUsersEmail}</span>
          <span className="mt-0.5 block text-xs text-slate-500">{m.partnerUsersEmailOptional}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputClass} mt-1`}
            dir="ltr"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">{m.partnerUsersPassword}</span>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} mt-1`}
              dir="ltr"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">{m.partnerUsersPasswordConfirm}</span>
            <PasswordInput
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className={`${inputClass} mt-1`}
              dir="ltr"
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
        <div className="mt-4 space-y-4">
          {rows.map((row) => (
            <div
              key={row.user_id}
              className={`rounded-xl border p-4 ${row.is_locked ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100 bg-slate-50/50'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1" role="list">
                  <LabUserDetailRow label={m.partnerUsersColLab} value={row.lab_display_name} />
                  <LabUserDetailRow
                    label={m.partnerUsersColUsername}
                    value={row.partner_username ?? '—'}
                    mono
                  />
                  <LabUserDetailRow
                    label={m.partnerUsersColEmail}
                    value={displayPartnerLabUserEmail(row.email)}
                    mono={!isPartnerPlaceholderEmail(row.email)}
                  />
                  <LabUserDetailRow
                    label={m.partnerUsersColLocation}
                    value={formatLocation(row)}
                  />
                  <LabUserDetailRow
                    label={m.partnerUsersColCreated}
                    value={formatLabDate(row.created_at, locale)}
                  />
                  <LabUserDetailRow
                    label={m.partnerUsersColLocked}
                    value={row.is_locked ? m.partnerUsersLocked : m.partnerUsersActive}
                    status={row.is_locked ? 'locked' : 'active'}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs"
                    disabled={submitting}
                    onClick={() => startEdit(row)}
                  >
                    {m.partnerUsersEdit}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs"
                    disabled={submitting}
                    onClick={() => void toggleLock(row)}
                  >
                    {row.is_locked ? m.partnerUsersUnlock : m.partnerUsersLock}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs text-red-700"
                    disabled={submitting}
                    onClick={() => void onDelete(row)}
                  >
                    {m.partnerUsersDelete}
                  </Button>
                </div>
              </div>

              {editingId === row.user_id && (
                <form className="mt-4 space-y-3 border-t border-slate-200 pt-4" onSubmit={onSubmitEdit}>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">{m.partnerUsersUsername}</span>
                    <input
                      type="text"
                      value={editForm.partner_username}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, partner_username: e.target.value }))
                      }
                      className={`${inputClass} mt-1`}
                      dir="ltr"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">{m.partnerUsersLabName}</span>
                    <input
                      type="text"
                      value={editForm.lab_display_name}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, lab_display_name: e.target.value }))
                      }
                      className={`${inputClass} mt-1`}
                    />
                  </label>
                  <CascadingLocationFields
                    countryCode={editForm.country}
                    governorateId={editForm.governorate}
                    regionId={editForm.region}
                    onCountryChange={(country) =>
                      setEditForm((f) => ({ ...f, country, governorate: '', region: '' }))
                    }
                    onGovernorateChange={(governorate) =>
                      setEditForm((f) => ({ ...f, governorate, region: '' }))
                    }
                    onRegionChange={(region) => setEditForm((f) => ({ ...f, region }))}
                    labels={locationLabels}
                    disabled={submitting}
                  />
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">{m.partnerUsersEmail}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{m.partnerUsersEmailOptional}</span>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                      className={`${inputClass} mt-1`}
                      dir="ltr"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">{m.partnerUsersNewPassword}</span>
                    <PasswordInput
                      value={editForm.password}
                      onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                      className={`${inputClass} mt-1`}
                      dir="ltr"
                    />
                    <span className="mt-1 block text-xs text-slate-500">
                      {m.partnerUsersLeavePasswordEmpty}
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={submitting}>
                      {m.partnerUsersSave}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                      disabled={submitting}
                    >
                      {m.partnerUsersCancel}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
