import { supabase } from './supabase'

const DOCTOR_PLACEHOLDER_EMAIL_SUFFIX = '@doctor.urgen.local'

export function isDoctorPlaceholderEmail(email: string | null | undefined): boolean {
  if (!email) return true
  return email.trim().toLowerCase().endsWith(DOCTOR_PLACEHOLDER_EMAIL_SUFFIX)
}

export function displayDoctorUserEmail(email: string | null | undefined): string {
  if (!email || isDoctorPlaceholderEmail(email)) return '—'
  return email
}

export type DoctorUserAdminRow = {
  user_id: string
  email: string
  display_name: string
  doctor_username: string | null
  is_locked: boolean
  created_at: string | null
}

async function invokeManage(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
    'manage-doctor-user',
    { body },
  )

  if (error) {
    const fromBody = await tryParseFunctionsResponseBody(error)
    return { ok: false, error: fromBody ?? error.message }
  }
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { ok: false, error: String(data.error) }
  }
  if (data?.ok) return { ok: true }
  return { ok: false, error: 'unexpected_response' }
}

export async function fetchDoctorUsersAdmin(): Promise<{
  ok: boolean
  rows?: DoctorUserAdminRow[]
  error?: string
}> {
  if (!supabase) return { ok: false, error: 'no_supabase' }
  const { data, error } = await supabase.rpc('doctor_users_admin_list')
  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: (data ?? []) as DoctorUserAdminRow[] }
}

export async function createDoctorUser(input: {
  email?: string
  password: string
  display_name: string
  doctor_username: string
}): Promise<{ ok: boolean; user_id?: string; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const { data, error } = await supabase.functions.invoke<{
    ok?: boolean
    user_id?: string
    error?: string
  }>('create-doctor-user', {
    body: {
      ...(input.email?.trim() ? { email: input.email.trim() } : {}),
      password: input.password,
      display_name: input.display_name.trim(),
      doctor_username: input.doctor_username.trim(),
    },
  })

  if (error) {
    const fromBody = await tryParseFunctionsResponseBody(error)
    return { ok: false, error: fromBody ?? error.message }
  }
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { ok: false, error: String(data.error) }
  }
  if (data?.ok) return { ok: true, user_id: data.user_id }
  return { ok: false, error: 'unexpected_response' }
}

export async function updateDoctorUser(input: {
  user_id: string
  display_name: string
  doctor_username: string
  email?: string
  password?: string
}): Promise<{ ok: boolean; error?: string }> {
  return invokeManage({
    action: 'update',
    user_id: input.user_id,
    display_name: input.display_name,
    doctor_username: input.doctor_username,
    ...(input.email?.trim() ? { email: input.email.trim() } : {}),
    ...(input.password ? { password: input.password } : {}),
  })
}

export async function setDoctorUserLocked(
  user_id: string,
  is_locked: boolean,
): Promise<{ ok: boolean; error?: string }> {
  return invokeManage({ action: 'set_locked', user_id, is_locked })
}

export async function deleteDoctorUser(user_id: string): Promise<{ ok: boolean; error?: string }> {
  return invokeManage({ action: 'delete', user_id })
}

async function tryParseFunctionsResponseBody(err: {
  context?: { json?: () => Promise<unknown> }
}): Promise<string | undefined> {
  try {
    const json = await err.context?.json?.()
    if (json && typeof json === 'object' && 'error' in json) {
      return String((json as { error: unknown }).error)
    }
  } catch {
    /* ignore */
  }
  return undefined
}
