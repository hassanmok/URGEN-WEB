import { supabase } from './supabase'

const PARTNER_PLACEHOLDER_EMAIL_SUFFIX = '@partner.urgen.local'

export function isPartnerPlaceholderEmail(email: string | null | undefined): boolean {
  if (!email) return true
  return email.trim().toLowerCase().endsWith(PARTNER_PLACEHOLDER_EMAIL_SUFFIX)
}

export function displayPartnerLabUserEmail(email: string | null | undefined): string {
  if (!email || isPartnerPlaceholderEmail(email)) return '—'
  return email
}

export type PartnerLabUserAdminRow = {
  user_id: string
  email: string
  lab_display_name: string
  partner_username: string | null
  country_code: string | null
  governorate_id: string | null
  region_id: string | null
  is_locked: boolean
  created_at: string | null
}

async function invokeManage(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
    'manage-partner-lab-user',
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

export async function fetchPartnerLabUsersAdmin(): Promise<{
  ok: boolean
  rows?: PartnerLabUserAdminRow[]
  error?: string
}> {
  if (!supabase) return { ok: false, error: 'no_supabase' }
  const { data, error } = await supabase.rpc('partner_lab_users_admin_list')
  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: (data ?? []) as PartnerLabUserAdminRow[] }
}

export async function createPartnerLabUser(input: {
  email?: string
  password: string
  lab_display_name: string
  partner_username: string
  country_code?: string
  governorate_id?: string
  region_id?: string
}): Promise<{ ok: boolean; user_id?: string; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const { data, error } = await supabase.functions.invoke<{
    ok?: boolean
    user_id?: string
    error?: string
  }>('create-partner-lab-user', {
    body: {
      ...(input.email?.trim() ? { email: input.email.trim() } : {}),
      password: input.password,
      lab_display_name: input.lab_display_name.trim(),
      partner_username: input.partner_username.trim(),
      country_code: input.country_code?.trim() || null,
      governorate_id: input.governorate_id?.trim() || null,
      region_id: input.region_id?.trim() || null,
    },
  })

  if (error) {
    const fromBody = await tryParseFunctionsResponseBody(error)
    return { ok: false, error: fromBody ?? error.message }
  }

  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { ok: false, error: String(data.error) }
  }

  if (data?.ok && data.user_id) {
    return { ok: true, user_id: data.user_id }
  }

  return { ok: false, error: 'unexpected_response' }
}

export async function updatePartnerLabUser(input: {
  user_id: string
  lab_display_name: string
  partner_username: string
  email?: string
  password?: string
  country_code?: string
  governorate_id?: string
  region_id?: string
}): Promise<{ ok: boolean; error?: string }> {
  return invokeManage({
    action: 'update',
    user_id: input.user_id,
    lab_display_name: input.lab_display_name.trim(),
    partner_username: input.partner_username.trim(),
    email: input.email?.trim(),
    password: input.password,
    country_code: input.country_code?.trim() || null,
    governorate_id: input.governorate_id?.trim() || null,
    region_id: input.region_id?.trim() || null,
  })
}

export async function setPartnerLabUserLocked(
  user_id: string,
  is_locked: boolean,
): Promise<{ ok: boolean; error?: string }> {
  return invokeManage({ action: 'set_locked', user_id, is_locked })
}

export async function deletePartnerLabUser(user_id: string): Promise<{ ok: boolean; error?: string }> {
  return invokeManage({ action: 'delete', user_id })
}

async function tryParseFunctionsResponseBody(err: unknown): Promise<string | null> {
  const ctx = err && typeof err === 'object' && 'context' in err ? (err as { context: unknown }).context : null
  if (ctx instanceof Response) {
    try {
      const j: unknown = await ctx.clone().json()
      if (j && typeof j === 'object' && 'error' in j) return String((j as { error: string }).error)
    } catch {
      /* ignore */
    }
  }
  return null
}
