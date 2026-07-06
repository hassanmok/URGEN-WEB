import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LanguageSwitcher } from '../../components/layout/LanguageSwitcher'
import { Button } from '../../components/ui/Button'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { OtherTextDialog } from '../../components/ui/OtherTextDialog'
import { Logo } from '../../components/Logo'
import { supabase } from '../../lib/supabase'
import { fetchDoctorProfile } from '../../lib/doctorAccess'
import { fetchPartnerLabProfile, resolvePartnerLoginEmail } from '../../lib/partnerAccess'
import {
  createPartnerPdfDownloadUrl,
  markPartnerReportOpened,
  canEditPartnerSubmissionGroup,
  fetchPartnerSubmissionsForLab,
  filterPartnerSubmissionGroups,
  insertPartnerSubmissionBatch,
  isPartnerPdfExpired,
  resolvePartnerSubmissionTestTitle,
  type PartnerAgeUnit,
  type PartnerSubmissionGroup,
  type PartnerSubmissionRow,
} from '../../lib/partnerSubmissionsStore'
import { isCustomOtherTestSlug, newCustomOtherTestSlug } from '../../lib/doctorCasesStore'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import { useTests } from '../../hooks/useTests'
import { TestCheckboxPicker } from '../../components/shared/TestCheckboxPicker'
import { PartnerSubmissionEditForm } from '../../components/partner/PartnerSubmissionEditForm'
import { PartnerReportNotificationsBell } from '../../components/portal/PartnerReportNotificationsBell'
import { buildPatientFullName, isPatientNameComplete } from '../../lib/patientName'
import type { PortalReportNotificationItem } from '../../lib/portalReportNotifications'
import type { Messages } from '../../i18n/messages'

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
  const [patientName1, setPatientName1] = useState('')
  const [patientName2, setPatientName2] = useState('')
  const [patientName3, setPatientName3] = useState('')
  const [patientName4, setPatientName4] = useState('')
  const [ageValue, setAgeValue] = useState('')
  const [ageUnit, setAgeUnit] = useState<PartnerAgeUnit>('years')
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set())
  const [otherTestTitles, setOtherTestTitles] = useState<Map<string, string>>(new Map())
  const [testOtherDialogOpen, setTestOtherDialogOpen] = useState(false)
  const [testPickerKey, setTestPickerKey] = useState(0)
  const [submitBusy, setSubmitBusy] = useState(false)
  const [submitMsg, setSubmitMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [rows, setRows] = useState<PartnerSubmissionRow[]>([])
  const [loadingRows, setLoadingRows] = useState(false)
  const [requestsSearchQuery, setRequestsSearchQuery] = useState('')
  const [editingGroupKey, setEditingGroupKey] = useState<string | null>(null)
  const [highlightSubmissionId, setHighlightSubmissionId] = useState<string | null>(null)
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
    const doctorProfile = await fetchDoctorProfile(supabase, user.id)
    if (doctorProfile) {
      setLabName(null)
      setPartnerOk(false)
      setStaffBlocking(true)
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
    const nameParts = [patientName1, patientName2, patientName3, patientName4] as const
    if (!isPatientNameComplete(nameParts)) {
      setSubmitMsg({ ok: false, text: m.patientNameRequired })
      return
    }
    const name = buildPatientFullName(nameParts)
    const ageNum = Number.parseInt(ageValue, 10)
    if (!Number.isFinite(ageNum) || ageNum <= 0) return
    if (selectedTests.size === 0) {
      setSubmitMsg({ ok: false, text: m.selectAtLeastOneTest })
      return
    }

    setSubmitBusy(true)
    const res = await insertPartnerSubmissionBatch({
      patient_full_name: name,
      age_value: ageNum,
      age_unit: ageUnit,
      test_slugs: [...selectedTests],
      other_test_titles: Object.fromEntries(otherTestTitles.entries()),
    })
    setSubmitBusy(false)
    if (!res.ok) {
      setSubmitMsg({ ok: false, text: `${m.submitErr}${res.error ? `: ${res.error}` : ''}` })
      return
    }
    setSubmitMsg({
      ok: true,
      text: m.submitOkBatch.replace('{n}', String(res.count ?? selectedTests.size)),
    })
    setPatientName1('')
    setPatientName2('')
    setPatientName3('')
    setPatientName4('')
    setAgeValue('')
    setSelectedTests(new Set())
    setOtherTestTitles(new Map())
    setTestPickerKey((k) => k + 1)
    void loadRows()
  }

  function toggleTest(slug: string) {
    setSelectedTests((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) {
        next.delete(slug)
        if (isCustomOtherTestSlug(slug)) {
          setOtherTestTitles((map) => {
            const copy = new Map(map)
            copy.delete(slug)
            return copy
          })
        }
      } else {
        next.add(slug)
      }
      return next
    })
  }

  function addOtherTest(title: string) {
    const slug = newCustomOtherTestSlug()
    setOtherTestTitles((map) => new Map(map).set(slug, title))
    setSelectedTests((prev) => new Set(prev).add(slug))
  }

  const testPickerLabels = useMemo(
    () => ({
      legend: m.testSelect,
      hint: m.testSelectHint,
      loading: m.loadingTests,
      empty: m.testPlaceholder,
      searchPlaceholder: m.testSearchPlaceholder,
      searchNoResults: m.testSearchNoResults,
      otherOption: m.testOtherOption,
    }),
    [m],
  )

  function testTitle(row: Pick<PartnerSubmissionRow, 'test_slug' | 'test_title_override'>) {
    return resolvePartnerSubmissionTestTitle(row, tests, locale)
  }

  async function onReportNotificationSelect(item: PortalReportNotificationItem) {
    setTab('list')
    setEditingGroupKey(null)
    setRequestsSearchQuery('')
    if (rows.length === 0) await loadRows()
    setHighlightSubmissionId(item.id)
  }

  async function downloadPdf(row: PartnerSubmissionRow) {
    if (!row.pdf_storage_path) return
    const exp = row.pdf_expires_at ? new Date(row.pdf_expires_at).getTime() : 0
    if (exp <= Date.now()) return

    setPdfBusyId(row.id)
    const markRes = await markPartnerReportOpened(row.id)
    if (markRes.ok && markRes.opened_at) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, report_first_opened_at: markRes.opened_at! } : r,
        ),
      )
    }
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

  const filteredGroups = useMemo(
    () => filterPartnerSubmissionGroups(rows, requestsSearchQuery, tests),
    [rows, requestsSearchQuery, tests],
  )

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
              <Button type="button" variant="outline" onClick={() => navigate('/doctor')}>
                {m.staffPortalDoctor}
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
                <PasswordInput
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
            <PartnerReportNotificationsBell onSelect={onReportNotificationSelect} />
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
          <>
          <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-urgen-navy">{m.tabSubmit}</h2>
            <form className="mt-6 space-y-4" onSubmit={onSubmitRequest}>
              <fieldset className="block">
                <legend className="text-sm font-semibold text-urgen-navy">{m.patientName}</legend>
                <p className="mt-1 text-xs font-normal text-slate-500">{m.patientNameHint}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm text-slate-700">
                    {m.patientNamePart1}
                    <input
                      value={patientName1}
                      onChange={(e) => setPatientName1(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20"
                      required
                    />
                  </label>
                  <label className="block text-sm text-slate-700">
                    {m.patientNamePart2}
                    <input
                      value={patientName2}
                      onChange={(e) => setPatientName2(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20"
                      required
                    />
                  </label>
                  <label className="block text-sm text-slate-700">
                    {m.patientNamePart3}
                    <input
                      value={patientName3}
                      onChange={(e) => setPatientName3(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20"
                      required
                    />
                  </label>
                  <label className="block text-sm text-slate-700">
                    {m.patientNamePart4}
                    <input
                      value={patientName4}
                      onChange={(e) => setPatientName4(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20"
                      required
                    />
                  </label>
                </div>
              </fieldset>

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

              <TestCheckboxPicker
                key={testPickerKey}
                tests={tests}
                loading={loadingTests}
                selectedTests={selectedTests}
                onToggle={toggleTest}
                locale={locale}
                labels={testPickerLabels}
                otherTests={otherTestTitles}
                onRequestAddOther={() => setTestOtherDialogOpen(true)}
              />

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

          <OtherTextDialog
            open={testOtherDialogOpen}
            title={m.testOtherDialogTitle}
            placeholder={m.testOtherPlaceholder}
            confirmLabel={m.otherDone}
            onConfirm={addOtherTest}
            onClose={() => setTestOtherDialogOpen(false)}
          />
          </>
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
            ) : filteredGroups.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">{m.searchNoResults}</p>
            ) : (
              <ul className="mt-6 space-y-4">
                {filteredGroups.map((group) => (
                  <PartnerRequestGroup
                    key={group.groupKey}
                    group={group}
                    m={m}
                    locale={locale}
                    editing={editingGroupKey === group.groupKey}
                    onStartEdit={() => setEditingGroupKey(group.groupKey)}
                    onCancelEdit={() => setEditingGroupKey(null)}
                    onSaved={() => {
                      setEditingGroupKey(null)
                      void loadRows()
                    }}
                    highlightSubmissionId={highlightSubmissionId}
                    onHighlightHandled={() => setHighlightSubmissionId(null)}
                    testTitle={testTitle}
                    agePretty={agePretty}
                    statusLabel={statusLabel}
                    statusBadgeClass={statusBadgeClass}
                    pdfBusyId={pdfBusyId}
                    onDownloadPdf={downloadPdf}
                  />
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

function PartnerRequestGroup({
  group,
  m,
  locale,
  editing,
  onStartEdit,
  onCancelEdit,
  onSaved,
  highlightSubmissionId,
  onHighlightHandled,
  testTitle,
  agePretty,
  statusLabel,
  statusBadgeClass,
  pdfBusyId,
  onDownloadPdf,
}: {
  group: PartnerSubmissionGroup
  m: Messages['partnerPortal']
  locale: string
  editing: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaved: () => void
  testTitle: (row: Pick<PartnerSubmissionRow, 'test_slug' | 'test_title_override'>) => string
  agePretty: (row: PartnerSubmissionRow) => string
  statusLabel: (status: string) => string
  statusBadgeClass: (status: string) => string
  pdfBusyId: string | null
  highlightSubmissionId: string | null
  onHighlightHandled: () => void
  onDownloadPdf: (row: PartnerSubmissionRow) => void | Promise<void>
}) {
  const canEdit = canEditPartnerSubmissionGroup(group)

  useEffect(() => {
    if (!highlightSubmissionId) return
    const inGroup = group.items.some((row) => row.id === highlightSubmissionId)
    if (!inGroup) return

    const scrollToTarget = (attempt = 0) => {
      const el = document.getElementById(`partner-submission-${highlightSubmissionId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
      if (attempt < 24) window.setTimeout(() => scrollToTarget(attempt + 1), 100)
    }

    const t1 = window.setTimeout(() => scrollToTarget(0), 80)
    const t2 = window.setTimeout(() => onHighlightHandled(), 4000)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [highlightSubmissionId, group, onHighlightHandled])

  if (editing) {
    return (
      <li className="rounded-2xl border-2 border-urgen-purple/40 bg-slate-100 p-5 text-sm shadow-md">
        <PartnerSubmissionEditForm group={group} m={m} onCancel={onCancelEdit} onSaved={onSaved} />
      </li>
    )
  }

  return (
    <li className="rounded-2xl border-2 border-slate-300 bg-slate-100 p-5 text-sm shadow-md">
      <div className="space-y-1 border-b border-slate-200 pb-3">
        <p className="font-semibold text-urgen-navy">{group.patient_full_name}</p>
        <p className="text-slate-600">
          {agePretty({
            age_value: group.age_value,
            age_unit: group.age_unit,
          } as PartnerSubmissionRow)}
        </p>
        <p className="text-xs text-slate-500">
          {m.dateSubmitted}:{' '}
          {group.created_at
            ? new Date(group.created_at).toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en-US')
            : '—'}
        </p>
        {canEdit && (
          <div className="pt-2">
            <Button type="button" variant="outline" className="text-sm" onClick={onStartEdit}>
              {m.editRequest}
            </Button>
          </div>
        )}
      </div>
      <ul className="mt-3 space-y-3">
        {group.items.map((row) => {
          const expired = isPartnerPdfExpired(row)
          const pdfReady = row.status === 'done' && row.pdf_storage_path && !expired

          const highlighted = highlightSubmissionId === row.id

          return (
            <li
              key={row.id}
              id={`partner-submission-${row.id}`}
              className={`rounded-xl border bg-white p-3 shadow-sm transition ${
                highlighted
                  ? 'border-urgen-purple ring-2 ring-urgen-purple/40'
                  : 'border-slate-300'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium text-urgen-navy">{testTitle(row)}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusBadgeClass(row.status)}`}
                >
                  {statusLabel(row.status)}
                </span>
              </div>

              <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                {row.status === 'rejected' && (
                  <p className="text-sm text-red-800">
                    <span className="font-semibold">{m.rejectionReason}: </span>
                    {row.rejection_reason?.trim() || '—'}
                  </p>
                )}
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
                {row.report_first_opened_at && (
                  <p className="text-xs font-medium text-slate-700">
                    {m.reportFirstOpened.replace(
                      '{date}',
                      new Date(row.report_first_opened_at).toLocaleString(
                        locale === 'ar' ? 'ar-IQ' : 'en-US',
                        { dateStyle: 'medium', timeStyle: 'short' },
                      ),
                    )}
                  </p>
                )}
                {pdfReady && (
                  <Button
                    type="button"
                    className="text-sm"
                    disabled={pdfBusyId === row.id}
                    onClick={() => void onDownloadPdf(row)}
                  >
                    {pdfBusyId === row.id ? '…' : m.pdfDownload}
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </li>
  )
}
