import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

  if (userErr || !user) {
    return json({ error: 'unauthorized' }, 401)
  }

  const { data: partnerSelf } = await userClient
    .from('partner_lab_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (partnerSelf) {
    return json({ error: 'forbidden' }, 403)
  }

  let body: {
    email?: string
    password?: string
    lab_display_name?: string
    partner_username?: string
  }

  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const email = body.email?.trim() ?? ''
  const password = body.password ?? ''
  const lab_display_name = body.lab_display_name?.trim() ?? ''
  const partner_username = body.partner_username?.trim() ?? ''

  if (!email || !password || !lab_display_name || !partner_username) {
    return json({ error: 'missing_fields' }, 400)
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'invalid_email' }, 400)
  }

  if (password.length < 6) {
    return json({ error: 'weak_password' }, 400)
  }

  if (partner_username.length < 2 || partner_username.length > 64) {
    return json({ error: 'invalid_username' }, 400)
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(partner_username)) {
    return json({ error: 'invalid_username_chars' }, 400)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createErr || !created.user) {
    const msg = createErr?.message ?? 'create_failed'
    const dup = /already|registered|exists/i.test(msg)
    return json({ error: msg }, dup ? 409 : 400)
  }

  const { error: insertErr } = await admin.from('partner_lab_users').insert({
    user_id: created.user.id,
    lab_display_name,
    partner_username,
  })

  if (insertErr) {
    await admin.auth.admin.deleteUser(created.user.id)
    return json({ error: insertErr.message }, 400)
  }

  return json({ ok: true, user_id: created.user.id }, 200)
})

function json(payload: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
