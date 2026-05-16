import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

function rpcMissingError(code: string | undefined, message: string | undefined): boolean {
  if (code === 'PGRST202') return true
  const m = message ?? ''
  return /does not exist/i.test(m) && /function/i.test(m)
}

export async function fetchPartnerLabProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ lab_display_name: string } | null> {
  const rpcRes = await supabase.rpc('get_my_partner_lab')

  if (!rpcRes.error && rpcRes.data?.length) {
    const name = rpcRes.data[0]?.lab_display_name
    if (name != null && String(name).trim() !== '') {
      return { lab_display_name: name }
    }
  }

  if (rpcRes.error && !rpcMissingError(rpcRes.error.code, rpcRes.error.message)) {
    console.error('[get_my_partner_lab]', rpcRes.error.code, rpcRes.error.message, { userId })
    return null
  }

  if (!rpcRes.error && (!rpcRes.data || rpcRes.data.length === 0)) {
    console.warn('[partner_lab_users] لا يوجد صف لهذا المستخدم — تحقق من insert والـ UUID.', {
      userId,
    })
    return null
  }

  const { data, error } = await supabase
    .from('partner_lab_users')
    .select('lab_display_name')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[partner_lab_users]', error.code, error.message, { userId })
    return null
  }
  if (!data) {
    console.warn('[partner_lab_users] لا يوجد صف لهذا المستخدم — تحقق من insert والـ UUID.', {
      userId,
    })
    return null
  }
  return { lab_display_name: data.lab_display_name }
}

/** يحوّل اسم المستخدم المعرف للمختبر إلى البريد؛ أو يقبل البريد كما هو (توافق مع البيانات القديمة). */
export async function resolvePartnerLoginEmail(
  supabase: SupabaseClient<Database>,
  identifier: string,
): Promise<{ ok: true; email: string } | { ok: false }> {
  const trimmed = identifier.trim()
  if (!trimmed) return { ok: false }

  const rpcRes = await supabase.rpc('partner_resolve_login', { p_username: trimmed })

  if (!rpcRes.error && rpcRes.data?.length && rpcRes.data[0]?.email) {
    const email = rpcRes.data[0].email.trim()
    if (email) return { ok: true, email }
  }

  if (trimmed.includes('@')) {
    return { ok: true, email: trimmed }
  }

  return { ok: false }
}
