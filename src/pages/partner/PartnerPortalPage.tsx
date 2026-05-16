import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LanguageSwitcher } from '../../components/layout/LanguageSwitcher'
import { Button } from '../../components/ui/Button'
import { Logo } from '../../components/Logo'
import { supabase } from '../../lib/supabase'
import { fetchPartnerLabProfile, resolvePartnerLoginEmail } from '../../lib/partnerAccess'
import {
  createPartnerPdfDownloadUrl,
  fetchPartnerSubmissionsForLab,
  insertPartnerSubmission,
  isPartnerPdfExpired,
  partnerSubmissionMatchesSearch,
  type PartnerAgeUnit,
  type PartnerSubmissionRow,
} from '../../lib/partnerSubmissionsStore'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import { useTests } from '../../hooks/useTests'

export function PartnerPortalPage() {
  const navigate = useNavigate()
  const { locale, messages } = useLocaleContext()
  const m = messages.partnerPortal
  const { tests, loading: loadingTests } = useTests()

  const [checking, setChecking] = useState(true)
  const [labName, setLabName] = useState<string | null>(null)
  const [partnerOk, setPartnerOk] = useState(false)
  const [staffBlocking, setStaffBlocking] = useState(false)

  const [loginUsername, setLoginUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginErr, setLoginErr] = useState<string | null>(null)
  const [loginBusy, setLoginBusy] = useState(false)

  const [tab, setTab] = useState<'submit' | 'list'>('submit')
  const [patientName, setPatientName] = useState('')
  const [ageValue, setAgeValue] = useState('')
  const [ageUnit, setAgeUnit] = useState<PartnerAgeUnit>('years')
  const [testSlug, setTestSlug] = useState('')
  const [submitBusy, setSubmitBusy] = useState(false)
  const [submitMsg, setSubmitMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [rows, setRows] = useState<PartnerSubmissionRow[]>([])
  const [loadingRows, setLoadingRows] = useState(false)
  const [requestsSearchQuery, setRequestsSearchQuery] = useState('')
  const [pdfBusyId, setPdfBusyId] = useState<string | null>(null)

  async function refreshSession() {
    setChecking(true)
    if (!supabase) {
      setPartnerOk(false)
      setStaffBlocking(false)
      setChecking(false)
      return
    }
    const { data } = await supabase.auth.getSession()
    const user = data.session?.user
    if (!user?.id) {
      setLabName(null)
      setPartnerOk(false)
      setStaffBlocking(false)
      setChecking(false)
      return
    }
    const profile = await fetchPartnerLabProfile(supabase, user.id)
    if (!profile) {
      setLabName(null)
      setPartnerOk(false)
      setStaffBlocking(true)
      setChecking(false)
      return
    }
    setStaffBlocking(false)
    setLabName(profile.lab_display_name)
    setPartnerOk(true)
    setChecking(false)
  }

  useEffect(() => {
    void refreshSession()
  }, [])

  async function loadRows() {
    setLoadingRows(true)
    const res = await fetchPartnerSubmissionsForLab()
    if (res.ok && res.rows) setRows(res.rows)
    setLoadingRows(false)
  }

  useEffect(() => {
    if (partnerOk) void loadRows()
  }, [partnerOk])

  async function onLogin(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setLoginErr(null)
    setLoginBusy(true)
    const resolved = await resolvePartnerLoginEmail(supabase, loginUsername)
    if (!resolved.ok) {
      setLoginBusy(false)
      setPassword('')
      setLoginErr(m.loginFailed)
      return
    }
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: resolved.email,
      password,
    })
    setLoginBusy(false)
    setPassword('')
    if (error) {
      setLoginErr(m.loginFailed)
      return
    }
    const uid =
      authData.session?.user?.id ??
      authData.user?.id ??
      (await supabase.auth.getUser()).data.user?.id
    if (!uid) {
      setLoginErr(m.loginFailed)
      return
    }
    const profile = await fetchPartnerLabProfile(supabase, uid)
    if (!profile) {
      await supabase.auth.signOut()
      setLoginErr(m.notPartner)
      return
    }
    setLabName(profile.lab_display_name)
    setPartnerOk(true)
    setStaffBlocking(false)
    void loadRows()
  }

  async function onLogout() {
    if (!supabase) return
    await supabase.auth.signOut()
    setLabName(null)
    setPartnerOk(false)
    setStaffBlocking(false)
    setRows([])
    setTab('submit')
  }

  async function onSubmitRequest(e: FormEvent) {
    e.preventDefault()
    setSubmitMsg(null)
    const name = patientName.trim()
    const ageNum = Number.parseInt(ageValue, 10)
    if (!name || name.length < 4) return
    if (!Number.isFinite(ageNum) || ageNum <= 0) return
    if (!testSlug) return

    setSubmitBusy(true)
    const res = await insertPartnerSubmission({
      patient_full_name: name,
      age_value: ageNum,
      age_unit: ageUnit,
      test_slug: testSlug,
    })
    setSubmitBusy(false)
    if (!res.ok) {
      setSubmitMsg({ ok: false, text: `${m.submitErr}${res.error ? `: ${res.error}` : ''}` })
      return
    }
    setSubmitMsg({ ok: true, text: m.submitOk })
    setPatientName('')
    setAgeValue('')
    setTestSlug('')
    void loadRows()
  }

  async function downloadPdf(row: PartnerSubmissionRow) {
    if (!row.pdf_storage_path) return
    const exp = row.pdf_expires_at ? new Date(row.pdf_expires_at).getTime() : 0
    if (exp <= Date.now()) return

    setPdfBusyId(row.id)
    const res = await createPartnerPdfDownloadUrl(row.pdf_storage_path)
    setPdfBusyId(null)
    if (!res.ok || !res.url) return
    window.open(res.url, '_blank', 'noopener,noreferrer')
  }

  function statusLabel(s: string) {
    switch (s) {
      case 'sent':
        return m.statusSent
      case 'pending':
        return m.statusPending
      case 'in_progress':
        return m.statusInProgress
      case 'rejected':
        return m.statusRejected
      case 'done':
        return m.statusDone
      default:
        return s
    }
  }

  /** ألوان الحالة: مرسل = أزرق، انتظار URGEN = كهرماني، تنفيذ = سماوي، جاهز = أخضر */
  function statusBadgeClass(s: string): string {
    switch (s) {
      case 'sent':
        return 'bg-blue-100 text-blue-950 ring-blue-300/80'
      case 'pending':
        return 'bg-amber-100 text-amber-950 ring-amber-300/80'
      case 'in_progress':
        return 'bg-sky-100 text-sky-950 ring-sky-300/80'
      case 'done':
        return 'bg-emerald-100 text-emerald-950 ring-emerald-300/80'
      case 'rejected':
        return 'bg-red-100 text-red-950 ring-red-300/80'
      default:
        return 'bg-slate-100 text-slate-800 ring-slate-300/80'
    }
  }

  function agePretty(row: PartnerSubmissionRow) {
    const v = row.age_value
    let unit: string = m.ageUnitYears
    if (row.age_unit === 'days') unit = m.ageUnitDays
    else if (row.age_unit === 'months') unit = m.ageUnitMonths
    return `${v} ${unit}`
  }

  const sortedTests = [...tests].sort((a, b) =>
    locale === 'ar'
      ? a.title_ar.localeCompare(b.title_ar, 'ar')
      : (a.title_en ?? a.title_ar).localeCompare(b.title_en ?? b.title_ar, 'en'),
  )

  const filteredRequestRows = useMemo(() => {
    return rows.filter((row) => {
      const t = tests.find((x) => x.slug === row.test_slug)
      const extras = t ? ([t.title_ar, t.title_en ?? ''].filter(Boolean) as string[]) : []
      return partnerSubmissionMatchesSearch(row, requestsSearchQuery, extras)
    })
  }, [rows, requestsSearchQuery, tests])

  if (!supabase) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto mb-6 flex max-w-md justify-end">
          <LanguageSwitcher />
        </div>
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-700">{m.supabaseRequired}</p>
          <Link to="/" className="mt-6 inline-block text-sm font-semibold text-urgen-purple">
            {m.backHome}
          </Link>
        </div>
      </div>
    )
  }

  if (checking) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <div className="flex justify-end border-b border-slate-200 bg-white px-4 py-3">
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="text-slate-500">{m.checkingSession}</p>
        </div>
      </div>
    )
  }

  if (staffBlocking) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white px-4 py-4">
          <div className="container-urgen flex flex-wrap items-center justify-between gap-4">
            <Link to="/">
              <Logo />
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <LanguageSwitcher />
              <Link to="/" className="text-sm font-medium text-urgen-purple">
                {m.backHome}
              </Link>
            </div>
          </div>
        </header>
        <div className="mx-auto mt-16 max-w-lg px-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-8 shadow-sm">
            <p className="text-sm leading-relaxed text-amber-950">{m.staffPortalBlocked}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button type="button" onClick={() => void onLogout()}>
                {m.staffPortalSignOut}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/admin')}>
                {m.staffPortalAdmin}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!partnerOk) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white px-4 py-4">
          <div className="container-urgen flex flex-wrap items-center justify-between gap-4">
            <Link to="/">
              <Logo />
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <LanguageSwitcher />
              <Link to="/" className="text-sm font-medium text-urgen-purple">
                {m.backHome}
              </Link>
            </div>
          </div>
        </header>
        <div className="mx-auto mt-16 max-w-md px-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-bold text-urgen-navy">{m.loginTitle}</h1>
            <p className="mt-2 text-sm text-slate-600">{m.loginSubtitle}</p>

            <form className="mt-6 space-y-4" onSubmit={onLogin}>
              <label className="block text-sm font-semibold text-urgen-navy">
                {m.username}
                <input
                  type="text"
                  autoComplete="username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20"
                  dir="ltr"
                  required
                />
              </label>
              <label className="block text-sm font-semibold text-urgen-navy">
                {m.password}
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20"
                  dir="ltr"
                  required
                />
              </label>
              {loginErr && <p className="text-sm text-red-600">{loginErr}</p>}
              <Button type="submit" className="w-full" disabled={loginBusy}>
                {loginBusy ? m.signingIn : m.signIn}
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="container-urgen flex flex-wrap items-center justify-between gap-4">
          <Link to="/">
            <Logo />
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher />
            <span className="text-sm text-slate-600">
              {m.welcome}
              {labName ? ` — ${labName}` : ''}
            </span>
            <Button type="button" variant="secondary" className="text-sm" onClick={() => void onLogout()}>
              {m.signOut}
            </Button>
          </div>
        </div>
      </header>

      <main className="container-urgen py-8">
        <nav className="mb-8 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
          <button
            type="button"
            onClick={() => setTab('submit')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === 'submit'
                ? 'bg-urgen-purple text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {m.tabSubmit}
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('list')
              void loadRows()
            }}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === 'list'
                ? 'bg-urgen-purple text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {m.tabMyRequests}
          </button>
        </nav>

        {tab === 'submit' && (
          <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-urgen-navy">{m.tabSubmit}</h2>
            <form className="mt-6 space-y-4" onSubmit={onSubmitRequest}>
              <label className="block text-sm font-semibold text-urgen-navy">
                {m.patientName}
                <span className="mt-1 block text-xs font-normal text-slate-500">{m.patientNameHint}</span>
                <input
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20"
                  required
                  minLength={4}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-urgen-navy">
                  {m.ageValue}
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={ageValue}
                    onChange={(e) => setAgeValue(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20"
                    required
                  />
                </label>
                <label className="block text-sm font-semibold text-urgen-navy">
                  {m.ageUnit}
                  <select
                    value={ageUnit}
                    onChange={(e) => setAgeUnit(e.target.value as PartnerAgeUnit)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20"
                  >
                    <option value="days">{m.ageUnitDays}</option>
                    <option value="months">{m.ageUnitMonths}</option>
                    <option value="years">{m.ageUnitYears}</option>
                  </select>
                </label>
              </div>

              <label className="block text-sm font-semibold text-urgen-navy">
                {m.testSelect}
                <select
                  value={testSlug}
                  onChange={(e) => setTestSlug(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20"
                  required
                  disabled={loadingTests || sortedTests.length === 0}
                >
                  <option value="">{m.testPlaceholder}</option>
                  {sortedTests.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {locale === 'ar' ? t.title_ar : (t.title_en ?? t.title_ar)} ({t.slug})
                    </option>
                  ))}
                </select>
              </label>

              {submitMsg && (
                <p className={submitMsg.ok ? 'text-sm text-green-700' : 'text-sm text-red-600'}>
                  {submitMsg.text}
                </p>
              )}

              <Button type="submit" disabled={submitBusy || loadingTests}>
                {submitBusy ? m.submitting : m.submit}
              </Button>
            </form>
          </section>
        )}

        {tab === 'list' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-urgen-navy">{m.myRequestsTitle}</h2>
              <Button
                type="button"
                variant="outline"
                className="text-sm"
                disabled={loadingRows}
                onClick={() => void loadRows()}
              >
                {m.refreshRequests}
              </Button>
            </div>
            {!loadingRows && rows.length > 0 && (
              <label className="mt-4 block">
                <span className="sr-only">{m.searchRequestsPlaceholder}</span>
                <input
                  type="search"
                  value={requestsSearchQuery}
                  onChange={(e) => setRequestsSearchQuery(e.target.value)}
                  placeholder={m.searchRequestsPlaceholder}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20"
                  autoComplete="off"
                />
              </label>
            )}
            {loadingRows ? (
              <p className="mt-6 text-sm text-slate-500">{m.loadingMyRequests}</p>
            ) : rows.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">{m.emptyRequests}</p>
            ) : filteredRequestRows.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">{m.searchNoResults}</p>
            ) : (
              <ul className="mt-6 space-y-4">
                {filteredRequestRows.map((row) => {
                  const expired = isPartnerPdfExpired(row)
                  const pdfReady = row.status === 'done' && row.pdf_storage_path && !expired

                  return (
                    <li
                      key={row.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="font-semibold text-urgen-navy">{row.patient_full_name}</p>
                          <p className="text-slate-600">{agePretty(row)}</p>
                          <p dir="ltr" className="text-slate-700">
                            {row.test_slug}
                          </p>
                          <p className="text-xs text-slate-500">
                            {m.dateSubmitted}:{' '}
                            {row.created_at
                              ? new Date(row.created_at).toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en-US')
                              : '—'}
                          </p>
                          {row.status === 'rejected' && row.rejection_reason && (
                            <p className="text-red-700">
                              {m.rejectionReason}: {row.rejection_reason}
                            </p>
                          )}
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusBadgeClass(row.status)}`}
                        >
                          {statusLabel(row.status)}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                        {row.status === 'sent' && (
                          <p className="text-xs text-slate-500">{m.pdfAwaitAcceptance}</p>
                        )}
                        {!pdfReady &&
                          row.status !== 'done' &&
                          row.status !== 'sent' &&
                          row.status !== 'rejected' && (
                            <p className="text-xs text-slate-500">{m.pdfLocked}</p>
                          )}
                        {row.status === 'done' && row.pdf_storage_path && row.pdf_expires_at && (
                          <p
                            className={`text-xs font-medium ${
                              expired ? 'text-amber-900' : 'text-emerald-800'
                            }`}
                          >
                            {expired ? m.pdfExpiredAt : m.pdfDownloadValidUntil}
                            {': '}
                            <span dir="ltr" className="inline-block font-normal tabular-nums">
                              {new Date(row.pdf_expires_at).toLocaleString(
                                locale === 'ar' ? 'ar-IQ' : 'en-US',
                              )}
                            </span>
                          </p>
                        )}
                        {row.status === 'done' && expired && (
                          <p className="text-xs text-slate-600">{m.pdfExpired}</p>
                        )}
                        {row.status === 'done' && !expired && row.pdf_storage_path && (
                          <Button
                            type="button"
                            className="text-sm"
                            disabled={pdfBusyId === row.id}
                            onClick={() => void downloadPdf(row)}
                          >
                            {pdfBusyId === row.id ? '…' : m.pdfDownload}
                          </Button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
