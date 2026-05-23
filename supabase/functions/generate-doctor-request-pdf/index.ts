import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1?target=deno'
import fontkit from 'https://esm.sh/@pdf-lib/fontkit@1.1.1?target=deno'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BUCKET = 'doctor-case-files'
const REQUEST_FORM_MARKER = '/__request_form__/'
const REQUEST_FORM_FILE_NAME = 'Request-General-Filled.pdf'

const AGE_UNITS_AR = { days: 'أيام', months: 'أشهر', years: 'سنوات' }
const AGE_UNITS_EN = { days: 'days', months: 'months', years: 'years' }

let templateBytes: Uint8Array | null = null
let arabicFontBytes: Uint8Array | null = null

async function loadAssets() {
  if (!templateBytes) {
    templateBytes = await Deno.readFile(new URL('./request-general.pdf', import.meta.url))
  }
  if (!arabicFontBytes) {
    arabicFontBytes = await Deno.readFile(new URL('./NotoSansArabic-Regular.ttf', import.meta.url))
  }
}

function wrapLines(
  text: string,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  fontSize: number,
  maxWidth: number,
): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []
  const lines: string[] = []
  for (const paragraph of normalized.split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    if (!words.length) continue
    let current = words[0] ?? ''
    for (let i = 1; i < words.length; i++) {
      const word = words[i]!
      const trial = `${current} ${word}`
      if (font.widthOfTextAtSize(trial, fontSize) <= maxWidth) current = trial
      else {
        lines.push(current)
        current = word
      }
    }
    lines.push(current)
  }
  return lines
}

function drawWrapped(
  page: ReturnType<PDFDocument['getPages']>[number],
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  text: string,
  x: number,
  startY: number,
  fontSize: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const lines = wrapLines(text, font, fontSize, maxWidth).slice(0, maxLines)
  let y = startY
  const ink = rgb(0.1, 0.1, 0.15)
  for (const line of lines) {
    page.drawText(line, { x, y, size: fontSize, font, color: ink })
    y -= lineHeight
  }
}

async function buildFilledPdf(input: {
  patientFullName: string
  ageText: string
  gender: string
  physicianName: string
  diagnosis: string
  testTitles: string[]
  requestDate: string
}): Promise<Uint8Array> {
  await loadAssets()
  const templateDoc = await PDFDocument.load(templateBytes!)
  const { width, height } = templateDoc.getPages()[0]!.getSize()

  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const arabicFont = await doc.embedFont(arabicFontBytes!)
  const latinFont = await doc.embedFont(StandardFonts.Helvetica)

  const [embeddedPage] = await doc.embedPdf(templateDoc, [0])
  const page = doc.addPage([width, height])
  page.drawPage(embeddedPage, { x: 0, y: 0, width, height })

  const fontSize = 10
  const smallSize = 9
  const ink = rgb(0.1, 0.1, 0.15)
  const testsText = input.testTitles.join(' · ')

  page.drawText(input.patientFullName, { x: 128, y: 600, size: fontSize, font: arabicFont, color: ink })
  page.drawText(input.ageText, { x: 418, y: 600, size: fontSize, font: arabicFont, color: ink })

  if (input.gender === 'male') {
    page.drawText('X', { x: 444, y: 604, size: 12, font: latinFont, color: ink })
  } else if (input.gender === 'female') {
    page.drawText('X', { x: 477, y: 604, size: 12, font: latinFont, color: ink })
  }

  page.drawText(input.physicianName, { x: 108, y: 568, size: fontSize, font: arabicFont, color: ink })
  page.drawText(input.requestDate, { x: 378, y: 568, size: fontSize, font: latinFont, color: ink })
  drawWrapped(page, arabicFont, input.diagnosis, 38, 528, smallSize, 280, 12, 8)
  drawWrapped(page, arabicFont, testsText, 38, 368, smallSize, 440, 11, 14)

  return doc.save()
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  if (!supabaseUrl || !serviceRoleKey || !anonKey) return json({ error: 'server_misconfigured' }, 500)

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser()
  if (userErr || !user) return json({ error: 'unauthorized' }, 401)

  let body: { case_id?: string; locale?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const caseId = body.case_id?.trim()
  if (!caseId) return json({ error: 'missing_case_id' }, 400)
  const locale = body.locale === 'en' ? 'en' : 'ar'
  const ageUnits = locale === 'en' ? AGE_UNITS_EN : AGE_UNITS_AR

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

  const isDoctor = Boolean(doctorSelf)
  const isStaff = !partnerSelf && !doctorSelf

  if (!isDoctor && !isStaff) return json({ error: 'forbidden' }, 403)

  let caseQuery = userClient
    .from('doctor_cases')
    .select(
      'id, doctor_user_id, patient_full_name, age_value, age_unit, gender, diagnosis, created_at',
    )
    .eq('id', caseId)

  if (isDoctor) {
    caseQuery = caseQuery.eq('doctor_user_id', user.id)
  }

  const { data: caseRow, error: caseErr } = await caseQuery.maybeSingle()
  if (caseErr || !caseRow) return json({ error: 'case_not_found' }, 404)

  const doctorUserId = caseRow.doctor_user_id

  const { data: caseTests } = await userClient
    .from('doctor_case_tests')
    .select('test_slug')
    .eq('case_id', caseId)

  const slugs = (caseTests ?? []).map((t) => t.test_slug)
  const { data: testsCatalog } = await userClient.from('tests').select('slug, title_ar, title_en').in('slug', slugs)

  const titleBySlug = new Map((testsCatalog ?? []).map((t) => [t.slug, t]))
  const testTitles = slugs.map((slug) => {
    const t = titleBySlug.get(slug)
    if (!t) return slug
    return locale === 'ar' ? t.title_ar : (t.title_en ?? t.title_ar)
  })

  const { data: doctorProfile } = await userClient
    .from('doctor_users')
    .select('display_name')
    .eq('user_id', doctorUserId)
    .maybeSingle()

  const unitKey = caseRow.age_unit as keyof typeof ageUnits
  const ageText = `${caseRow.age_value} ${ageUnits[unitKey] ?? caseRow.age_unit}`

  const requestDate = new Date(caseRow.created_at ?? Date.now()).toLocaleDateString(
    locale === 'ar' ? 'ar-IQ' : 'en-GB',
    { day: '2-digit', month: '2-digit', year: 'numeric' },
  )

  let pdfBytes: Uint8Array
  try {
    pdfBytes = await buildFilledPdf({
      patientFullName: caseRow.patient_full_name,
      ageText,
      gender: caseRow.gender,
      physicianName: doctorProfile?.display_name?.trim() || '—',
      diagnosis: caseRow.diagnosis,
      testTitles,
      requestDate,
    })
  } catch (e) {
    console.error('[pdf_build]', e)
    return json({ error: 'pdf_build_failed' }, 500)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: oldFiles } = await admin
    .from('doctor_case_files')
    .select('id, storage_path')
    .eq('case_id', caseId)

  for (const f of oldFiles ?? []) {
    if (f.storage_path.includes(REQUEST_FORM_MARKER)) {
      await admin.storage.from(BUCKET).remove([f.storage_path])
      await admin.from('doctor_case_files').delete().eq('id', f.id)
    }
  }

  const fileId = crypto.randomUUID()
  const storagePath = `${caseId}${REQUEST_FORM_MARKER}${fileId}_${REQUEST_FORM_FILE_NAME}`

  const { error: upErr } = await admin.storage.from(BUCKET).upload(storagePath, pdfBytes, {
    contentType: 'application/pdf',
    upsert: true,
  })
  if (upErr) {
    console.error('[storage_upload]', upErr)
    return json({ error: upErr.message }, 500)
  }

  const { error: insErr } = await admin.from('doctor_case_files').insert({
    case_id: caseId,
    doctor_user_id: doctorUserId,
    storage_path: storagePath,
    file_name: REQUEST_FORM_FILE_NAME,
    mime_type: 'application/pdf',
    byte_size: pdfBytes.byteLength,
  })

  if (insErr) {
    console.error('[db_insert]', insErr)
    await admin.storage.from(BUCKET).remove([storagePath])
    return json({ error: insErr.message }, 500)
  }

  return json({ ok: true, storage_path: storagePath, byte_size: pdfBytes.byteLength })
})
