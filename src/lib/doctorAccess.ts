import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

function rpcMissingError(code: string | undefined, message: string | undefined): boolean {
  if (code === 'PGRST202') return true
  const m = message ?? ''
  return /does not exist/i.test(m) && /function/i.test(m)
}

export async function fetchDoctorProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ display_name: string; is_locked?: boolean } | null> {
  const rpcRes = await supabase.rpc('get_my_doctor_profile')

  if (!rpcRes.error && rpcRes.data?.length) {
    const name = rpcRes.data[0]?.display_name
    if (name != null && String(name).trim() !== '') {
      return { display_name: name }
    }
  }

  if (rpcRes.error && !rpcMissingError(rpcRes.error.code, rpcRes.error.message)) {
    console.error('[get_my_doctor_profile]', rpcRes.error.code, rpcRes.error.message, { userId })
    return null
  }

  const { data, error } = await supabase
    .from('doctor_users')
    .select('display_name, is_locked')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[doctor_users]', error.code, error.message, { userId })
    return null
  }
  if (!data) return null
  if (data.is_locked) return null
  return { display_name: data.display_name, is_locked: data.is_locked }
}

export async function resolveDoctorLoginEmail(
  supabase: SupabaseClient<Database>,
  identifier: string,
): Promise<{ ok: true; email: string } | { ok: false }> {
  const trimmed = identifier.trim()
  if (!trimmed) return { ok: false }

  const rpcRes = await supabase.rpc('doctor_resolve_login', { p_username: trimmed })

  if (!rpcRes.error && rpcRes.data?.length && rpcRes.data[0]?.email) {
    const email = rpcRes.data[0].email.trim()
    if (email) return { ok: true, email }
  }

  if (trimmed.includes('@')) {
    return { ok: true, email: trimmed }
  }

  return { ok: false }
}
