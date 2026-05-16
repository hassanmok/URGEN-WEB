import { supabase } from './supabase'

export type PartnerLabUserAdminRow = {
  user_id: string
  email: string
  lab_display_name: string
  partner_username: string | null
  created_at: string | null
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
  email: string
  password: string
  lab_display_name: string
  partner_username: string
}): Promise<{ ok: boolean; user_id?: string; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const { data, error } = await supabase.functions.invoke<{
    ok?: boolean
    user_id?: string
    error?: string
  }>('create-partner-lab-user', {
    body: {
      email: input.email.trim(),
      password: input.password,
      lab_display_name: input.lab_display_name.trim(),
      partner_username: input.partner_username.trim(),
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
