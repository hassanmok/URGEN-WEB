import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Action = 'set_status'

const ALLOWED_STATUS = new Set(['sent', 'pending', 'in_progress', 'rejected', 'done'])

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
    case_id?: string
    status?: string
    rejection_reason?: string | null
  }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  if (body.action !== 'set_status') {
    return json({ error: 'unknown_action' }, 400)
  }

  const caseId = body.case_id?.trim()
  const status = body.status?.trim()
  if (!caseId || !status || !ALLOWED_STATUS.has(status)) {
    return json({ error: 'missing_fields' }, 400)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const patch: {
    status: string
    rejection_reason: string | null
    updated_at: string
  } = {
    status,
    rejection_reason:
      status === 'rejected'
        ? (body.rejection_reason?.trim() || 'Rejected')
        : null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await admin
    .from('doctor_cases')
    .update(patch)
    .eq('id', caseId)
    .select('id, status')
    .maybeSingle()

  if (error) {
    const msg = error.message ?? 'update_failed'
    if (/check constraint|doctor_cases_status_check/i.test(msg)) {
      return json(
        {
          error:
            'invalid_status_constraint — run doctor-case-results-flow.sql migration',
        },
        400,
      )
    }
    return json({ error: msg }, 400)
  }

  if (!data) {
    return json({ error: 'not_found' }, 404)
  }

  return json({ ok: true, status: data.status }, 200)
})

function json(payload: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
