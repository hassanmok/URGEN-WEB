import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Action = 'update' | 'delete' | 'set_locked'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'unauthorized' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ error: 'server_misconfigured' }, 500)
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser()
  if (userErr || !user) return json({ error: 'unauthorized' }, 401)

  const { data: partnerSelf } = await userClient
    .from('partner_lab_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (partnerSelf) return json({ error: 'forbidden' }, 403)

  let body: {
    action?: Action
    user_id?: string
    lab_display_name?: string
    partner_username?: string
    email?: string
    password?: string
    country_code?: string
    governorate_id?: string
    region_id?: string
    is_locked?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const action = body.action
  const userId = body.user_id?.trim()
  if (!action || !userId) return json({ error: 'missing_fields' }, 400)

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  if (action === 'delete') {
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true }, 200)
  }

  if (action === 'set_locked') {
    if (typeof body.is_locked !== 'boolean') return json({ error: 'missing_fields' }, 400)
    const { error } = await admin
      .from('partner_lab_users')
      .update({ is_locked: body.is_locked })
      .eq('user_id', userId)
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true }, 200)
  }

  if (action === 'update') {
    const lab_display_name = body.lab_display_name?.trim() ?? ''
    const partner_username = body.partner_username?.trim() ?? ''
    if (!lab_display_name || !partner_username) return json({ error: 'missing_fields' }, 400)
    if (partner_username.length < 2 || partner_username.length > 64) {
      return json({ error: 'invalid_username' }, 400)
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(partner_username)) {
      return json({ error: 'invalid_username_chars' }, 400)
    }

    const patch: Record<string, unknown> = {
      lab_display_name,
      partner_username,
      country_code: body.country_code?.trim() || null,
      governorate_id: body.governorate_id?.trim() || null,
      region_id: body.region_id?.trim() || null,
    }

    const { error: dbErr } = await admin.from('partner_lab_users').update(patch).eq('user_id', userId)
    if (dbErr) return json({ error: dbErr.message }, 400)

    const authPatch: { email?: string; password?: string } = {}
    const email = body.email?.trim()
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'invalid_email' }, 400)
      authPatch.email = email
    }
    if (body.password) {
      if (body.password.length < 6) return json({ error: 'weak_password' }, 400)
      authPatch.password = body.password
    }
    if (Object.keys(authPatch).length > 0) {
      const { error: authErr } = await admin.auth.admin.updateUserById(userId, authPatch)
      if (authErr) return json({ error: authErr.message }, 400)
    }

    return json({ ok: true }, 200)
  }

  return json({ error: 'unknown_action' }, 400)
})

function json(payload: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
