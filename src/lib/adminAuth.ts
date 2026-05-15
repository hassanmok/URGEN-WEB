import { supabase } from './supabase'

const SESSION_KEY = 'urgen_admin_session'

export type AdminSession =
  | { mode: 'local' }
  | { mode: 'supabase'; email: string }

export function getAdminSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AdminSession
  } catch {
    return null
  }
}

export function setLocalAdminSession() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ mode: 'local' } satisfies AdminSession))
}

export function setSupabaseAdminSession(email: string) {
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ mode: 'supabase', email } satisfies AdminSession),
  )
}

export function clearAdminSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

export async function signInAdmin(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) {
    const expected = import.meta.env.VITE_ADMIN_PASSWORD
    if (!expected) {
      return { ok: false, error: 'no_password_configured' }
    }
    if (password !== expected) {
      return { ok: false, error: 'invalid_password' }
    }
    setLocalAdminSession()
    return { ok: true }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error || !data.user) {
    return { ok: false, error: error?.message ?? 'auth_failed' }
  }

  setSupabaseAdminSession(data.user.email ?? email)
  return { ok: true }
}

export async function signOutAdmin() {
  clearAdminSession()
  if (supabase) {
    await supabase.auth.signOut()
  }
}

export async function restoreSupabaseSession(): Promise<boolean> {
  if (!supabase) return Boolean(getAdminSession()?.mode === 'local')
  const { data } = await supabase.auth.getSession()
  if (data.session?.user) {
    setSupabaseAdminSession(data.session.user.email ?? '')
    return true
  }
  if (getAdminSession()?.mode === 'local') return true
  clearAdminSession()
  return false
}
