import { createElement, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Logo } from '../../components/Logo'
import { supabase } from '../../lib/supabase'
import {
  getAdminSession,
  restoreSupabaseSession,
  signInAdmin,
  signOutAdmin,
} from '../../lib/adminAuth'
import {
  createEvent,
  deleteEvent,
  fetchAllEventsAdmin,
  updateEvent,
} from '../../lib/eventsStore'
import { AdminDataPanel } from '../../components/admin/AdminDataPanel'
import { EventImageField, type EventImageFieldHandle } from '../../components/admin/EventImageField'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import type { EventInput, EventRecord } from '../../types/event'

const Box = ({ className, children }: { className?: string; children?: React.ReactNode }) =>
  createElement('div', { className }, children)

const emptyForm: EventInput = {
  title_ar: '',
  title_en: '',
  description_ar: '',
  description_en: '',
  event_date: '',
  location_ar: '',
  location_en: '',
  image_url: '',
  published: true,
}

export function AdminPage() {
  const { messages: m } = useLocaleContext()
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [events, setEvents] = useState<EventRecord[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [form, setForm] = useState<EventInput>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginSubmitting, setLoginSubmitting] = useState(false)
  const imageFieldRef = useRef<EventImageFieldHandle>(null)
  const [tab, setTab] = useState<'events' | 'data'>('events')

  const useSupabaseAuth = Boolean(supabase)

  useEffect(() => {
    void (async () => {
      const ok = await restoreSupabaseSession()
      setAuthed(ok || Boolean(getAdminSession()))
      setChecking(false)
    })()
  }, [])

  async function loadEvents() {
    setLoadingEvents(true)
    const data = await fetchAllEventsAdmin()
    setEvents(data)
    setLoadingEvents(false)
  }

  useEffect(() => {
    if (authed) void loadEvents()
  }, [authed])

  async function onLogin(e: FormEvent) {
    e.preventDefault()
    setLoginError(null)
    setLoginSubmitting(true)
    const result = await signInAdmin(email, password)
    setLoginSubmitting(false)
    if (!result.ok) {
      if (result.error === 'no_password_configured') {
        setLoginError(m.admin.noPasswordConfigured)
      } else if (result.error === 'invalid_password') {
        setLoginError(m.admin.invalidPassword)
      } else {
        setLoginError(m.admin.loginFailed)
      }
      return
    }
    setAuthed(true)
    setPassword('')
  }

  async function onLogout() {
    await signOutAdmin()
    setAuthed(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  function startEdit(event: EventRecord) {
    setEditingId(event.id)
    setForm({
      title_ar: event.title_ar,
      title_en: event.title_en,
      description_ar: event.description_ar,
      description_en: event.description_en,
      event_date: event.event_date,
      location_ar: event.location_ar ?? '',
      location_en: event.location_en ?? '',
      image_url: event.image_url ?? '',
      published: event.published,
    })
    setMessage(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setMessage(null)
  }

  async function onSubmitEvent(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (
      !form.title_ar.trim() ||
      !form.title_en.trim() ||
      !form.description_ar.trim() ||
      !form.description_en.trim() ||
      !form.event_date
    ) {
      setMessage({ type: 'err', text: m.admin.errRequired })
      return
    }

    setSubmitting(true)

    const targetId = editingId ?? crypto.randomUUID()
    const imageResolved = await imageFieldRef.current?.resolveImageUrl(targetId)
    if (imageResolved && !imageResolved.ok) {
      setSubmitting(false)
      setMessage({ type: 'err', text: m.admin.imageUploadFailed })
      return
    }

    const payload: EventInput = {
      ...form,
      image_url: imageResolved?.url ?? (form.image_url?.trim() || null),
    }

    const result = editingId
      ? await updateEvent(editingId, payload)
      : await createEvent(payload, { id: targetId })
    setSubmitting(false)

    if (!result.ok) {
      setMessage({ type: 'err', text: m.admin.saveFailed })
      return
    }

    setMessage({ type: 'ok', text: editingId ? m.admin.updated : m.admin.created })
    setForm(emptyForm)
    setEditingId(null)
    await loadEvents()
  }

  async function onDelete(id: string) {
    if (!window.confirm(m.admin.confirmDelete)) return
    const result = await deleteEvent(id)
    if (!result.ok) {
      setMessage({ type: 'err', text: m.admin.saveFailed })
      return
    }
    if (editingId === id) cancelEdit()
    await loadEvents()
  }

  if (checking) {
    return (
      <Box className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">{m.admin.checking}</p>
      </Box>
    )
  }

  if (!authed) {
    return (
      <Box className="flex min-h-screen flex-col bg-slate-50">
        <Box className="border-b border-slate-200 bg-white px-4 py-4">
          <Link to="/" className="inline-block">
            <Logo />
          </Link>
        </Box>
        <Box className="flex flex-1 items-center justify-center px-4 py-12">
          <Box className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-urgen-navy">{m.admin.loginTitle}</h1>
            <p className="mt-2 text-sm text-slate-600">{m.admin.loginSubtitle}</p>

            <form className="mt-8 space-y-4" onSubmit={onLogin}>
              {useSupabaseAuth && (
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">{m.admin.email}</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20"
                  />
                </label>
              )}
              <label className="block">
                <span className="text-sm font-medium text-slate-700">{m.admin.password}</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20"
                />
              </label>
              {loginError && <p className="text-sm text-red-600">{loginError}</p>}
              <Button type="submit" className="w-full" disabled={loginSubmitting}>
                {loginSubmitting ? m.admin.signingIn : m.admin.signIn}
              </Button>
            </form>

            {!useSupabaseAuth && (
              <p className="mt-6 text-xs leading-relaxed text-slate-500">{m.admin.localHint}</p>
            )}
            {useSupabaseAuth && (
              <p className="mt-6 text-xs leading-relaxed text-slate-500">{m.admin.supabaseHint}</p>
            )}
          </Box>
        </Box>
      </Box>
    )
  }

  const session = getAdminSession()

  return (
    <Box className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <Box className="container-urgen flex flex-wrap items-center justify-between gap-4 py-4">
          <Box>
            <h1 className="text-xl font-bold text-urgen-navy">{m.admin.dashboardTitle}</h1>
            {session?.mode === 'supabase' && session.email && (
              <p className="text-xs text-slate-500">{session.email}</p>
            )}
          </Box>
          <Box className="flex flex-wrap items-center gap-2">
            <Link to="/events">
              <Button variant="outline" className="text-sm">
                {m.admin.viewEvents}
              </Button>
            </Link>
            <Link to="/">
              <Button variant="ghost" className="text-sm">
                {m.admin.backToSite}
              </Button>
            </Link>
            <Button variant="secondary" className="text-sm" onClick={() => void onLogout()}>
              {m.admin.signOut}
            </Button>
          </Box>
        </Box>
      </header>

      <main className="container-urgen py-8 lg:py-12">
        <Box className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('events')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === 'events'
                ? 'bg-urgen-purple text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {m.admin.tabEvents}
          </button>
          <button
            type="button"
            onClick={() => setTab('data')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === 'data'
                ? 'bg-urgen-purple text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {m.admin.tabData}
          </button>
        </Box>

        {tab === 'data' ? (
          <AdminDataPanel m={m.admin} />
        ) : (
        <Box className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-urgen-navy">
              {editingId ? m.admin.editEvent : m.admin.addEvent}
            </h2>
            <form className="mt-6 space-y-4" onSubmit={onSubmitEvent}>
              <FormRow label={m.admin.titleAr}>
                <input
                  value={form.title_ar}
                  onChange={(e) => setForm((f) => ({ ...f, title_ar: e.target.value }))}
                  className={inputClass}
                  dir="rtl"
                />
              </FormRow>
              <FormRow label={m.admin.titleEn}>
                <input
                  value={form.title_en}
                  onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))}
                  className={inputClass}
                  dir="ltr"
                />
              </FormRow>
              <FormRow label={m.admin.descAr}>
                <textarea
                  value={form.description_ar}
                  onChange={(e) => setForm((f) => ({ ...f, description_ar: e.target.value }))}
                  className={`${inputClass} min-h-[88px]`}
                  dir="rtl"
                />
              </FormRow>
              <FormRow label={m.admin.descEn}>
                <textarea
                  value={form.description_en}
                  onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))}
                  className={`${inputClass} min-h-[88px]`}
                  dir="ltr"
                />
              </FormRow>
              <FormRow label={m.admin.eventDate}>
                <input
                  type="date"
                  value={form.event_date}
                  onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
                  className={inputClass}
                />
              </FormRow>
              <FormRow label={m.admin.locationAr}>
                <input
                  value={form.location_ar ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, location_ar: e.target.value }))}
                  className={inputClass}
                  dir="rtl"
                />
              </FormRow>
              <FormRow label={m.admin.locationEn}>
                <input
                  value={form.location_en ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, location_en: e.target.value }))}
                  className={inputClass}
                  dir="ltr"
                />
              </FormRow>
              <EventImageField
                ref={imageFieldRef}
                m={m.admin}
                eventId={editingId}
                currentUrl={form.image_url?.trim() || null}
                disabled={submitting}
              />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                  className="rounded border-slate-300 text-urgen-purple focus:ring-urgen-purple"
                />
                {m.admin.published}
              </label>
              {message && (
                <p className={message.type === 'ok' ? 'text-sm text-green-700' : 'text-sm text-red-600'}>
                  {message.text}
                </p>
              )}
              <Box className="flex flex-wrap gap-2 pt-2">
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? m.admin.saving
                    : editingId
                      ? m.admin.saveChanges
                      : m.admin.createEvent}
                </Button>
                {editingId && (
                  <Button type="button" variant="ghost" onClick={cancelEdit}>
                    {m.admin.cancel}
                  </Button>
                )}
              </Box>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-urgen-navy">{m.admin.eventsList}</h2>
            {loadingEvents ? (
              <p className="mt-6 text-sm text-slate-500">{m.eventsPage.loading}</p>
            ) : events.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">{m.admin.noEvents}</p>
            ) : (
              <ul className="mt-6 space-y-3">
                {events.map((event) => (
                  <li
                    key={event.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4"
                  >
                    <Box className="min-w-0 flex-1">
                      <p className="font-semibold text-urgen-navy">{event.title_ar}</p>
                      <p className="text-xs text-slate-500" dir="ltr">
                        {event.event_date}
                        {!event.published && ` · ${m.admin.draft}`}
                      </p>
                    </Box>
                    <Box className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="px-3 py-1.5 text-xs"
                        onClick={() => startEdit(event)}
                      >
                        {m.admin.edit}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                        onClick={() => void onDelete(event.id)}
                      >
                        {m.admin.delete}
                      </Button>
                    </Box>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Box>
        )}
      </main>
    </Box>
  )
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <Box className="mt-1">{children}</Box>
    </label>
  )
}

const inputClass =
  'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20'