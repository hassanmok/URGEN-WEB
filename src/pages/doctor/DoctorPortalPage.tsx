import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { LanguageSwitcher } from '../../components/layout/LanguageSwitcher'
import { Button } from '../../components/ui/Button'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { Logo } from '../../components/Logo'
import { DoctorAnalyticsPanel } from '../../components/doctor/DoctorAnalyticsPanel'
import { DoctorCaseSubmitPanel } from '../../components/doctor/DoctorCaseSubmitPanel'
import { DoctorMyCasesPanel } from '../../components/doctor/DoctorMyCasesPanel'
import { DoctorReportNotificationsBell } from '../../components/portal/DoctorReportNotificationsBell'
import { supabase } from '../../lib/supabase'
import type { PortalReportNotificationItem } from '../../lib/portalReportNotifications'
import { fetchDoctorProfile, resolveDoctorLoginEmail } from '../../lib/doctorAccess'
import { fetchPartnerLabProfile } from '../../lib/partnerAccess'
import { useLocaleContext } from '../../i18n/useLocaleContext'

function navClass(active: boolean): string {
  return `rounded-xl px-4 py-2 text-sm font-semibold ${
    active ? 'bg-urgen-purple text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
  }`
}

export function DoctorPortalPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { locale, messages } = useLocaleContext()
  const m = messages.doctorPortal

  const [checking, setChecking] = useState(true)
  const [doctorOk, setDoctorOk] = useState(false)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [staffBlocking, setStaffBlocking] = useState(false)

  const [loginUsername, setLoginUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginErr, setLoginErr] = useState<string | null>(null)
  const [loginBusy, setLoginBusy] = useState(false)
  const [highlightCaseId, setHighlightCaseId] = useState<string | null>(null)

  async function refreshSession() {
    setChecking(true)
    if (!supabase) {
      setDoctorOk(false)
      setStaffBlocking(false)
      setChecking(false)
      return
    }
    const { data } = await supabase.auth.getSession()
    const user = data.session?.user
    if (!user?.id) {
      setDisplayName(null)
      setDoctorOk(false)
      setStaffBlocking(false)
      setChecking(false)
      return
    }
    const partner = await fetchPartnerLabProfile(supabase, user.id)
    if (partner) {
      setDoctorOk(false)
      setStaffBlocking(true)
      setChecking(false)
      return
    }
    const profile = await fetchDoctorProfile(supabase, user.id)
    if (!profile) {
      setDisplayName(null)
      setDoctorOk(false)
      setStaffBlocking(false)
      setChecking(false)
      return
    }
    setStaffBlocking(false)
    setDisplayName(profile.display_name)
    setDoctorOk(true)
    setChecking(false)
  }

  useEffect(() => {
    void refreshSession()
  }, [])

  async function onLogin(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setLoginErr(null)
    setLoginBusy(true)
    const resolved = await resolveDoctorLoginEmail(supabase, loginUsername)
    if (!resolved.ok) {
      setLoginBusy(false)
      setLoginErr(m.notDoctor)
      return
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: resolved.email,
      password,
    })
    setLoginBusy(false)
    if (error) {
      setLoginErr(m.loginFailed)
      return
    }
    await refreshSession()
    navigate('/doctor/analytics', { replace: true })
  }

  async function onLogout() {
    if (supabase) await supabase.auth.signOut()
    setDoctorOk(false)
    setDisplayName(null)
  }

  function onReportNotificationSelect(item: PortalReportNotificationItem) {
    setHighlightCaseId(item.id)
    navigate('/doctor/my-cases')
  }

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
            <LanguageSwitcher />
          </div>
        </header>
        <div className="mx-auto mt-16 max-w-lg px-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-8 shadow-sm">
            <p className="text-sm leading-relaxed text-amber-950">{m.staffPortalBlocked}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button type="button" onClick={() => void onLogout()}>
                {m.staffPortalSignOut}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/partner')}>
                {m.staffPortalPartner}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!doctorOk) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white px-4 py-4">
          <div className="container-urgen flex flex-wrap items-center justify-between gap-4">
            <Link to="/">
              <Logo />
            </Link>
            <LanguageSwitcher />
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

  const path = location.pathname.replace(/\/$/, '')

  return (
    <div className="min-h-screen bg-slate-50" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="container-urgen flex flex-wrap items-center justify-between gap-4">
          <Link to="/">
            <Logo />
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <DoctorReportNotificationsBell onSelect={onReportNotificationSelect} />
            <LanguageSwitcher />
            <span className="text-sm text-slate-600">
              {m.welcome}
              {displayName ? ` — ${displayName}` : ''}
            </span>
            <Button type="button" variant="secondary" className="text-sm" onClick={() => void onLogout()}>
              {m.signOut}
            </Button>
          </div>
        </div>
      </header>

      <main className="container-urgen py-8">
        <nav className="mb-6 flex flex-wrap gap-2">
          <Link to="/doctor/analytics" className={navClass(path.endsWith('/analytics'))}>
            {m.tabAnalytics}
          </Link>
          <Link to="/doctor/submit" className={navClass(path.endsWith('/submit'))}>
            {m.tabCases}
          </Link>
          <Link to="/doctor/my-cases" className={navClass(path.endsWith('/my-cases'))}>
            {m.tabMyCases}
          </Link>
        </nav>

        <Routes>
          <Route index element={<Navigate to="analytics" replace />} />
          <Route path="analytics" element={<DoctorAnalyticsPanel m={m} />} />
          <Route path="submit" element={<DoctorCaseSubmitPanel m={m} />} />
          <Route
            path="my-cases"
            element={
              <DoctorMyCasesPanel
                m={m}
                highlightCaseId={highlightCaseId}
                onHighlightHandled={() => setHighlightCaseId(null)}
              />
            }
          />
          <Route path="*" element={<Navigate to="analytics" replace />} />
        </Routes>
      </main>
    </div>
  )
}
