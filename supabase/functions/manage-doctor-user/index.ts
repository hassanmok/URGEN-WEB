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
  const { data: doctorSelf } = await userClient
    .from('doctor_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (partnerSelf || doctorSelf) return json({ error: 'forbidden' }, 403)

  let body: {
    action?: Action
    user_id?: string
    display_name?: string
    doctor_username?: string
    email?: string
    password?: string
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
      .from('doctor_users')
      .update({ is_locked: body.is_locked })
      .eq('user_id', userId)
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true }, 200)
  }

  if (action === 'update') {
    const display_name = body.display_name?.trim() ?? ''
    const doctor_username = body.doctor_username?.trim() ?? ''
    if (!display_name || !doctor_username) return json({ error: 'missing_fields' }, 400)
    if (doctor_username.length < 2 || doctor_username.length > 64) {
      return json({ error: 'invalid_username' }, 400)
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(doctor_username)) {
      return json({ error: 'invalid_username_chars' }, 400)
    }

    const { error: dbErr } = await admin
      .from('doctor_users')
      .update({ display_name, doctor_username })
      .eq('user_id', userId)
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
