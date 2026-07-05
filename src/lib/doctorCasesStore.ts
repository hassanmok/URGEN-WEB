import { supabase } from './supabase'
import { buildPatientFullName, type PatientNameParts } from './patientName'
import { generateDoctorRequestImage } from './doctorRequestImage'
import { tokenize } from './searchIndex'
import type { Database } from '../types/database'

export type DoctorCaseRow = Database['public']['Tables']['doctor_cases']['Row']
export type DoctorCaseTestRow = Database['public']['Tables']['doctor_case_tests']['Row']
export type DoctorCaseFileRow = Database['public']['Tables']['doctor_case_files']['Row']
export type DoctorDiseaseType = 'oncology' | 'reproductive' | 'pediatric' | 'other'
export type DoctorGender = 'male' | 'female' | 'other'
export type DoctorAgeUnit = 'days' | 'months' | 'years'
export type DoctorCaseStatus = 'sent' | 'pending' | 'in_progress' | 'rejected' | 'done'
export type DoctorResultValue = 'positive' | 'negative'

/** يوحّد القيم القديمة (accepted) مع pending */
export function normalizeDoctorCaseStatus(status: string | null | undefined): DoctorCaseStatus {
  if (status === 'accepted' || status === 'pending') return 'pending'
  if (status === 'in_progress') return 'in_progress'
  if (status === 'rejected') return 'rejected'
  if (status === 'done') return 'done'
  return 'sent'
}

const BUCKET = 'doctor-case-files'
const RESULT_BUCKET = 'doctor-case-reports'

export function pdfPathForDoctorCase(caseId: string) {
  return `${caseId}/report.pdf`
}

/** صلاحية رابط التحميل للطبيب انتهت (لا يُعتبر منتهياً إذا لم يُحدَّد تاريخ). */
export function isDoctorResultPdfExpired(
  row: Pick<DoctorCaseRow, 'pdf_expires_at'>,
): boolean {
  if (row.pdf_expires_at == null) return false
  return new Date(row.pdf_expires_at).getTime() <= Date.now()
}

/** Generated filled request form image — not a user attachment. */
export const DOCTOR_REQUEST_FORM_FILE_NAME = 'Request-General-Filled.png'
const LEGACY_REQUEST_FORM_PDF = 'Request-General-Filled.pdf'
const REQUEST_FORM_STORAGE_MARKER = '/__request_form__/'

export function isDoctorRequestFormFile(file: { storage_path: string; file_name: string }): boolean {
  return (
    file.storage_path.includes(REQUEST_FORM_STORAGE_MARKER) ||
    file.file_name === DOCTOR_REQUEST_FORM_FILE_NAME ||
    file.file_name === LEGACY_REQUEST_FORM_PDF
  )
}

export function splitDoctorCaseFiles(files: DoctorCaseFileRow[]): {
  requestForm: DoctorCaseFileRow | null
  attachments: DoctorCaseFileRow[]
} {
  let requestForm: DoctorCaseFileRow | null = null
  const attachments: DoctorCaseFileRow[] = []
  for (const f of files) {
    if (isDoctorRequestFormFile(f)) requestForm = f
    else attachments.push(f)
  }
  return { requestForm, attachments }
}

export const OTHER_TEST_SLUG_PREFIX = '__other__:'

export function isCustomOtherTestSlug(slug: string): boolean {
  return slug.startsWith(OTHER_TEST_SLUG_PREFIX)
}

export function newCustomOtherTestSlug(): string {
  return `${OTHER_TEST_SLUG_PREFIX}${crypto.randomUUID()}`
}

export function resolveDoctorCaseTestTitle(
  test: Pick<DoctorCaseTestRow, 'test_slug' | 'test_title_override'>,
  catalog: { slug: string; title_ar: string; title_en: string | null }[],
  locale: string,
): string {
  if (test.test_title_override?.trim()) return test.test_title_override.trim()
  const row = catalog.find((x) => x.slug === test.test_slug)
  if (!row) return test.test_slug
  return locale === 'ar' ? row.title_ar : (row.title_en ?? row.title_ar)
}

export function doctorDiseaseTypeLabel(
  row: Pick<DoctorCaseRow, 'disease_type' | 'disease_type_other'>,
  labels: {
    oncology: string
    reproductive: string
    pediatric: string
    other: string
  },
): string {
  if (row.disease_type === 'other') {
    return row.disease_type_other?.trim() || labels.other
  }
  if (row.disease_type === 'oncology') return labels.oncology
  if (row.disease_type === 'reproductive') return labels.reproductive
  return labels.pediatric
}

function buildDoctorCaseTestRows(
  caseId: string,
  slugs: string[],
  titleBySlug: Map<string, string>,
) {
  return slugs.map((test_slug) => ({
    case_id: caseId,
    test_slug,
    test_title_override: isCustomOtherTestSlug(test_slug)
      ? titleBySlug.get(test_slug)?.trim() || null
      : null,
  }))
}

/** بحث محلي في حالات الطبيب: اسم المريض، التشخيص، الفحص، العمر… */
export function doctorCaseMatchesPatientSearch(
  row: DoctorCaseRow,
  query: string,
  caseTests: DoctorCaseTestRow[],
  catalog: { slug: string; title_ar: string; title_en: string | null }[],
  locale: string,
): boolean {
  const q = query.trim()
  if (!q) return true

  const tokens = tokenize(q)
  if (!tokens.length) return true

  const testHay = caseTests
    .map((t) => resolveDoctorCaseTestTitle(t, catalog, locale) + ' ' + t.test_slug)
    .join(' ')

  const hay = [
    row.patient_full_name,
    row.patient_name1,
    row.patient_name2,
    row.patient_name3,
    row.patient_name4,
    row.diagnosis,
    row.disease_type,
    row.disease_type_other,
    String(row.age_value),
    row.age_unit,
    testHay,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (tokens.every((t) => hay.includes(t))) return true

  const digitsOnly = q.replace(/\D/g, '')
  if (digitsOnly.length > 0) {
    const n = Number.parseInt(digitsOnly, 10)
    if (Number.isFinite(n) && row.age_value === n) return true
  }

  return false
}

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream',
])

const ALLOWED_EXT = new Set(['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'doc', 'docx'])

export function isAllowedDoctorCaseFile(file: File): boolean {
  const mime = file.type || ''
  if (ALLOWED_MIME.has(mime)) return true
  if (mime.startsWith('image/')) return true
  const ext = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : ''
  return Boolean(ext && ALLOWED_EXT.has(ext))
}

export function storagePathForCaseFile(caseId: string, fileId: string, fileName: string) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'file'
  return `${caseId}/${fileId}_${safe}`
}

function storagePathForRequestForm(caseId: string, fileId: string) {
  return `${caseId}${REQUEST_FORM_STORAGE_MARKER}${fileId}_${DOCTOR_REQUEST_FORM_FILE_NAME}`
}

async function fetchDoctorDisplayName(userId: string): Promise<string> {
  if (!supabase) return '—'
  const { data } = await supabase
    .from('doctor_users')
    .select('display_name')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.display_name?.trim() || '—'
}

export type RequestFormImageContext = {
  locale: string
  ageUnitLabels: { days: string; months: string; years: string }
  testTitles: string[]
  diseaseTypeLabel?: string
  oncologyDetails?: string
}

export function buildRequestFormImageContext(
  locale: string,
  ageUnitLabels: { days: string; months: string; years: string },
  testTitles: string[],
  extras?: { diseaseTypeLabel?: string; oncologyDetails?: string },
): RequestFormImageContext {
  return { locale, ageUnitLabels, testTitles, ...extras }
}

/** @deprecated use buildRequestFormImageContext */
export const buildRequestFormPdfContext = buildRequestFormImageContext
export type RequestFormPdfContext = RequestFormImageContext

function formatRequestDate(iso: string | null | undefined, locale: string): string {
  const d = iso ? new Date(iso) : new Date()
  return d.toLocaleDateString(locale === 'ar' ? 'ar-IQ' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function buildDiagnosisBlock(row: Pick<DoctorCaseRow, 'diagnosis' | 'disease_type' | 'oncology_tumor_type' | 'oncology_stage' | 'oncology_treatment'>, ctx: RequestFormImageContext): string {
  const parts = [row.diagnosis.trim()]
  if (ctx.diseaseTypeLabel) parts.push(ctx.diseaseTypeLabel)
  if (ctx.oncologyDetails) parts.push(ctx.oncologyDetails)
  if (row.disease_type === 'oncology' && !ctx.oncologyDetails) {
    const extras = [row.oncology_tumor_type, row.oncology_stage, row.oncology_treatment].filter(Boolean)
    if (extras.length) parts.push(extras.join(' · '))
  }
  return parts.filter(Boolean).join('\n')
}

async function deleteExistingRequestFormFile(caseId: string): Promise<void> {
  if (!supabase) return
  const { data: rows } = await supabase
    .from('doctor_case_files')
    .select('id, storage_path')
    .eq('case_id', caseId)

  const formRows = (rows ?? []).filter((r) => r.storage_path.includes(REQUEST_FORM_STORAGE_MARKER))
  for (const row of formRows) {
    await deleteDoctorCaseFile(row.id)
  }
}

async function uploadRequestFormImage(
  caseId: string,
  doctorUserId: string,
  imageBlob: Blob,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  await deleteExistingRequestFormFile(caseId)

  const fileId = crypto.randomUUID()
  const path = storagePathForRequestForm(caseId, fileId)

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, imageBlob, {
    cacheControl: '3600',
    upsert: false,
    contentType: 'image/png',
  })
  if (upErr) return { ok: false, error: upErr.message }

  const { error: dbErr } = await supabase.from('doctor_case_files').insert({
    case_id: caseId,
    doctor_user_id: doctorUserId,
    storage_path: path,
    file_name: DOCTOR_REQUEST_FORM_FILE_NAME,
    mime_type: 'image/png',
    byte_size: imageBlob.size,
  })

  if (dbErr) {
    await supabase.storage.from(BUCKET).remove([path])
    return { ok: false, error: dbErr.message }
  }

  return { ok: true }
}

/** Generate filled request form image and attach to the case. */
export async function attachDoctorRequestFormImage(
  caseId: string,
  doctorUserId: string,
  caseRow: Pick<
    DoctorCaseRow,
    | 'patient_full_name'
    | 'age_value'
    | 'age_unit'
    | 'gender'
    | 'diagnosis'
    | 'disease_type'
    | 'oncology_tumor_type'
    | 'oncology_stage'
    | 'oncology_treatment'
    | 'created_at'
  >,
  ctx: RequestFormImageContext,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const physicianName = await fetchDoctorDisplayName(doctorUserId)
    const unitLabel =
      caseRow.age_unit === 'days'
        ? ctx.ageUnitLabels.days
        : caseRow.age_unit === 'months'
          ? ctx.ageUnitLabels.months
          : ctx.ageUnitLabels.years

    const imageBlob = await generateDoctorRequestImage({
      patientFullName: caseRow.patient_full_name,
      ageText: `${caseRow.age_value} ${unitLabel}`,
      gender: caseRow.gender as DoctorGender,
      physicianName,
      diagnosis: buildDiagnosisBlock(caseRow, ctx),
      testTitles: ctx.testTitles,
      requestDate: formatRequestDate(caseRow.created_at, ctx.locale),
    })
    return uploadRequestFormImage(caseId, doctorUserId, imageBlob)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'image_generate_failed' }
  }
}

/** @deprecated use attachDoctorRequestFormImage */
export const attachDoctorRequestFormPdf = attachDoctorRequestFormImage

/** Regenerate request form image (doctor portal). */
export async function regenerateDoctorRequestFormImage(
  caseId: string,
  doctorUserId: string,
  caseRow: Parameters<typeof attachDoctorRequestFormImage>[2],
  ctx: RequestFormImageContext,
): Promise<{ ok: boolean; error?: string }> {
  return attachDoctorRequestFormImage(caseId, doctorUserId, caseRow, ctx)
}

/** @deprecated */
export const regenerateDoctorRequestFormPdf = regenerateDoctorRequestFormImage

export async function fetchDoctorCases(): Promise<{
  ok: boolean
  rows?: DoctorCaseRow[]
  error?: string
}> {
  if (!supabase) return { ok: false, error: 'no_supabase' }
  const { data, error } = await supabase
    .from('doctor_cases')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: (data ?? []) as DoctorCaseRow[] }
}

/** لوحة الإدارة: جميع حالات الأطباء */
export async function fetchAllDoctorCasesAdmin(): Promise<{
  ok: boolean
  rows?: DoctorCaseRow[]
  error?: string
}> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'not_signed_in' }

  const { data, error } = await supabase
    .from('doctor_cases')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: (data ?? []) as DoctorCaseRow[] }
}

/** لوحة الإدارة: ملفات جميع الحالات */
export async function fetchAllDoctorCaseFilesAdmin(): Promise<{
  ok: boolean
  rows?: DoctorCaseFileRow[]
  error?: string
}> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'not_signed_in' }

  const { data, error } = await supabase
    .from('doctor_case_files')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: (data ?? []) as DoctorCaseFileRow[] }
}

export function groupDoctorCaseFilesByCaseId(
  files: DoctorCaseFileRow[],
): Map<string, DoctorCaseFileRow[]> {
  const map = new Map<string, DoctorCaseFileRow[]>()
  for (const f of files) {
    const list = map.get(f.case_id) ?? []
    list.push(f)
    map.set(f.case_id, list)
  }
  return map
}

export async function fetchDoctorCaseTests(caseId: string): Promise<{
  ok: boolean
  rows?: DoctorCaseTestRow[]
  error?: string
}> {
  if (!supabase) return { ok: false, error: 'no_supabase' }
  const { data, error } = await supabase
    .from('doctor_case_tests')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true })

  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: (data ?? []) as DoctorCaseTestRow[] }
}

export async function fetchDoctorCaseTestsForCaseIds(
  caseIds: string[],
): Promise<{ ok: boolean; rows?: DoctorCaseTestRow[]; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }
  if (caseIds.length === 0) return { ok: true, rows: [] }

  const { data, error } = await supabase
    .from('doctor_case_tests')
    .select('*')
    .in('case_id', caseIds)

  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: (data ?? []) as DoctorCaseTestRow[] }
}

export function groupDoctorCaseTestsByCaseId(
  rows: DoctorCaseTestRow[],
): Map<string, DoctorCaseTestRow[]> {
  const map = new Map<string, DoctorCaseTestRow[]>()
  for (const row of rows) {
    const list = map.get(row.case_id) ?? []
    list.push(row)
    map.set(row.case_id, list)
  }
  return map
}

export async function fetchAllDoctorCaseTestsAdmin(): Promise<{
  ok: boolean
  rows?: DoctorCaseTestRow[]
  error?: string
}> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'not_signed_in' }

  const { data, error } = await supabase.from('doctor_case_tests').select('*')

  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: (data ?? []) as DoctorCaseTestRow[] }
}

export async function fetchDoctorCaseFiles(caseId: string): Promise<{
  ok: boolean
  rows?: DoctorCaseFileRow[]
  error?: string
}> {
  if (!supabase) return { ok: false, error: 'no_supabase' }
  const { data, error } = await supabase
    .from('doctor_case_files')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true })

  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: (data ?? []) as DoctorCaseFileRow[] }
}

export type DoctorCaseFormInput = {
  patientName: PatientNameParts
  age_value: number
  age_unit: DoctorAgeUnit
  gender: DoctorGender
  diagnosis: string
  disease_type: DoctorDiseaseType
  disease_type_other?: string | null
  oncology_tumor_type?: string
  oncology_stage?: string
  oncology_treatment?: string
  test_slugs: string[]
  /** عناوين الفحوصات المخصصة (slug يبدأ بـ __other__:) */
  other_test_titles?: Record<string, string>
}

export async function insertDoctorCase(
  input: DoctorCaseFormInput & {
    files: File[]
    requestFormContext?: RequestFormPdfContext
  },
): Promise<{
  ok: boolean
  case_id?: string
  count?: number
  error?: string
  pdf_failed?: boolean
  image_failed?: boolean
}> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const { data: userData } = await supabase.auth.getUser()
  const uid = userData.user?.id
  if (!uid) return { ok: false, error: 'not_signed_in' }

  const patient_full_name = buildPatientFullName(input.patientName)
  const [n1, n2, n3, n4] = input.patientName.map((p) => p.trim())

  const row: Database['public']['Tables']['doctor_cases']['Insert'] = {
    doctor_user_id: uid,
    patient_name1: n1,
    patient_name2: n2,
    patient_name3: n3,
    patient_name4: n4,
    patient_full_name,
    age_value: input.age_value,
    age_unit: input.age_unit,
    gender: input.gender,
    diagnosis: input.diagnosis.trim(),
    disease_type: input.disease_type,
    oncology_tumor_type:
      input.disease_type === 'oncology' ? input.oncology_tumor_type?.trim() || null : null,
    oncology_stage:
      input.disease_type === 'oncology' ? input.oncology_stage?.trim() || null : null,
    oncology_treatment:
      input.disease_type === 'oncology' ? input.oncology_treatment?.trim() || null : null,
    disease_type_other:
      input.disease_type === 'other' ? input.disease_type_other?.trim() || null : null,
    status: 'sent',
  }

  const { data: inserted, error } = await supabase.from('doctor_cases').insert(row).select('id').single()

  if (error || !inserted?.id) {
    return { ok: false, error: error?.message ?? 'insert_failed' }
  }

  const caseId = inserted.id

  const slugs = [...new Set(input.test_slugs.map((s) => s.trim()).filter(Boolean))]
  if (slugs.length === 0) {
    await supabase.from('doctor_cases').delete().eq('id', caseId)
    return { ok: false, error: 'no_tests' }
  }

  const titleBySlug = new Map(Object.entries(input.other_test_titles ?? {}))
  const testRows = buildDoctorCaseTestRows(caseId, slugs, titleBySlug)
  const { error: testErr } = await supabase.from('doctor_case_tests').insert(testRows)
  if (testErr) {
    await supabase.from('doctor_cases').delete().eq('id', caseId)
    return { ok: false, error: testErr.message }
  }

  const uploadRes = await uploadDoctorCaseFiles(caseId, uid, input.files)
  if (!uploadRes.ok) {
    await supabase.from('doctor_cases').delete().eq('id', caseId)
    return { ok: false, error: uploadRes.error }
  }

  if (input.requestFormContext) {
    const imgRes = await attachDoctorRequestFormImage(
      caseId,
      uid,
      {
        patient_full_name,
        age_value: input.age_value,
        age_unit: input.age_unit,
        gender: input.gender,
        diagnosis: input.diagnosis.trim(),
        disease_type: input.disease_type,
        oncology_tumor_type:
          input.disease_type === 'oncology' ? input.oncology_tumor_type?.trim() || null : null,
        oncology_stage:
          input.disease_type === 'oncology' ? input.oncology_stage?.trim() || null : null,
        oncology_treatment:
          input.disease_type === 'oncology' ? input.oncology_treatment?.trim() || null : null,
        created_at: new Date().toISOString(),
      },
      input.requestFormContext,
    )
    if (!imgRes.ok) {
      console.error('[doctor_request_image]', imgRes.error)
      return { ok: true, case_id: caseId, count: slugs.length, image_failed: true }
    }
  }

  return { ok: true, case_id: caseId, count: slugs.length }
}

export type UpdateDoctorCaseInput = DoctorCaseFormInput & {
  newFiles: File[]
  removeFileIds: string[]
  requestFormContext?: RequestFormPdfContext
}

export async function updateDoctorCase(
  caseId: string,
  input: UpdateDoctorCaseInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const { data: userData } = await supabase.auth.getUser()
  const uid = userData.user?.id
  if (!uid) return { ok: false, error: 'not_signed_in' }

  const { data: existing, error: fetchErr } = await supabase
    .from('doctor_cases')
    .select('id, status, created_at')
    .eq('id', caseId)
    .maybeSingle()

  if (fetchErr) return { ok: false, error: fetchErr.message }
  if (!existing || normalizeDoctorCaseStatus(existing.status) !== 'sent') {
    return { ok: false, error: 'not_editable' }
  }

  const patient_full_name = buildPatientFullName(input.patientName)
  const [n1, n2, n3, n4] = input.patientName.map((p) => p.trim())

  const patch: Database['public']['Tables']['doctor_cases']['Update'] = {
    patient_name1: n1,
    patient_name2: n2,
    patient_name3: n3,
    patient_name4: n4,
    patient_full_name,
    age_value: input.age_value,
    age_unit: input.age_unit,
    gender: input.gender,
    diagnosis: input.diagnosis.trim(),
    disease_type: input.disease_type,
    oncology_tumor_type:
      input.disease_type === 'oncology' ? input.oncology_tumor_type?.trim() || null : null,
    oncology_stage:
      input.disease_type === 'oncology' ? input.oncology_stage?.trim() || null : null,
    oncology_treatment:
      input.disease_type === 'oncology' ? input.oncology_treatment?.trim() || null : null,
    disease_type_other:
      input.disease_type === 'other' ? input.disease_type_other?.trim() || null : null,
  }

  const { data: updated, error: updErr } = await supabase
    .from('doctor_cases')
    .update(patch)
    .eq('id', caseId)
    .eq('status', 'sent')
    .select('id')
    .maybeSingle()

  if (updErr) return { ok: false, error: updErr.message }
  if (!updated) return { ok: false, error: 'not_editable' }

  const slugs = [...new Set(input.test_slugs.map((s) => s.trim()).filter(Boolean))]
  if (slugs.length === 0) return { ok: false, error: 'no_tests' }

  const { error: delTestsErr } = await supabase.from('doctor_case_tests').delete().eq('case_id', caseId)
  if (delTestsErr) return { ok: false, error: delTestsErr.message }

  const titleBySlug = new Map(Object.entries(input.other_test_titles ?? {}))
  const testRows = buildDoctorCaseTestRows(caseId, slugs, titleBySlug)
  const { error: testErr } = await supabase.from('doctor_case_tests').insert(testRows)
  if (testErr) return { ok: false, error: testErr.message }

  for (const fileId of input.removeFileIds) {
    const delRes = await deleteDoctorCaseFile(fileId)
    if (!delRes.ok) return delRes
  }

  const uploadRes = await uploadDoctorCaseFiles(caseId, uid, input.newFiles)
  if (!uploadRes.ok) return uploadRes

  if (input.requestFormContext) {
    const imgRes = await attachDoctorRequestFormImage(
      caseId,
      uid,
      {
        patient_full_name,
        age_value: input.age_value,
        age_unit: input.age_unit,
        gender: input.gender,
        diagnosis: input.diagnosis.trim(),
        disease_type: input.disease_type,
        oncology_tumor_type:
          input.disease_type === 'oncology' ? input.oncology_tumor_type?.trim() || null : null,
        oncology_stage:
          input.disease_type === 'oncology' ? input.oncology_stage?.trim() || null : null,
        oncology_treatment:
          input.disease_type === 'oncology' ? input.oncology_treatment?.trim() || null : null,
        created_at: existing.created_at,
      },
      input.requestFormContext,
    )
    if (!imgRes.ok) return imgRes
  }

  return { ok: true }
}

export async function deleteDoctorCaseFile(
  fileId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const { data: row, error: fetchErr } = await supabase
    .from('doctor_case_files')
    .select('id, storage_path, case_id')
    .eq('id', fileId)
    .maybeSingle()

  if (fetchErr) return { ok: false, error: fetchErr.message }
  if (!row) return { ok: false, error: 'not_found' }

  const { error: storageErr } = await supabase.storage.from(BUCKET).remove([row.storage_path])
  if (storageErr) return { ok: false, error: storageErr.message }

  const { error: dbErr } = await supabase.from('doctor_case_files').delete().eq('id', fileId)
  if (dbErr) return { ok: false, error: dbErr.message }

  return { ok: true }
}

async function uploadDoctorCaseFiles(
  caseId: string,
  doctorUserId: string,
  files: File[],
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }
  if (files.length === 0) return { ok: true }

  for (const file of files) {
    if (!isAllowedDoctorCaseFile(file)) {
      return { ok: false, error: 'invalid_file_type' }
    }
    if (file.size > 20 * 1024 * 1024) {
      return { ok: false, error: 'file_too_large' }
    }
  }

  for (const file of files) {
    const fileId = crypto.randomUUID()
    const path = storagePathForCaseFile(caseId, fileId, file.name)

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    })

    if (upErr) return { ok: false, error: upErr.message }

    const { error: dbErr } = await supabase.from('doctor_case_files').insert({
      case_id: caseId,
      doctor_user_id: doctorUserId,
      storage_path: path,
      file_name: file.name,
      mime_type: file.type || null,
      byte_size: file.size,
    })

    if (dbErr) {
      await supabase.storage.from(BUCKET).remove([path])
      return { ok: false, error: dbErr.message }
    }
  }

  return { ok: true }
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

function isEdgeNotDeployed(msg: string): boolean {
  return /non-2xx|failed to fetch|function .*not found|manage-doctor-case/i.test(msg)
}

async function invokeManageDoctorCase(
  body: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
    'manage-doctor-case',
    { body },
  )

  if (error) {
    const fromBody = await tryParseFunctionsResponseBody(error)
    const msg = fromBody ?? error.message
    if (isEdgeNotDeployed(msg)) return { ok: false, error: 'edge_not_deployed' }
    return { ok: false, error: msg }
  }
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { ok: false, error: String(data.error) }
  }
  if (data?.ok) return { ok: true }
  return { ok: false, error: 'unexpected_response' }
}

export async function adminUpdateDoctorCaseStatus(
  id: string,
  status: 'pending' | 'in_progress' | 'rejected',
  rejection_reason?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'not_signed_in' }

  const patch: Database['public']['Tables']['doctor_cases']['Update'] = {
    status,
    rejection_reason: status === 'rejected' ? (rejection_reason?.trim() || 'Rejected') : null,
  }
  if (status === 'rejected') {
    patch.pdf_storage_path = null
    patch.pdf_expires_at = null
    patch.result_value = null
  }

  const { error: rpcErr } = await supabase.rpc('doctor_case_admin_set_status', {
    p_case_id: id,
    p_status: status,
    p_rejection_reason: rejection_reason ?? null,
  })

  if (!rpcErr) return { ok: true }

  const rpcMissing =
    rpcErr.code === 'PGRST202' ||
    rpcErr.code === '42883' ||
    (rpcErr.message?.includes('doctor_case_admin_set_status') ?? false)

  if (!rpcMissing) {
    if (/invalid_status|doctor_cases_status_check/i.test(rpcErr.message ?? '')) {
      return { ok: false, error: 'status_migration_required' }
    }
    return { ok: false, error: rpcErr.message }
  }

  const edge = await invokeManageDoctorCase({
    action: 'set_status',
    case_id: id,
    status,
    rejection_reason: rejection_reason ?? null,
  })
  if (edge.ok) return { ok: true }

  const edgeAuthBlocked =
    edge.error === 'forbidden' ||
    edge.error === 'unauthorized' ||
    edge.error === 'not_found'
  if (edgeAuthBlocked) {
    return { ok: false, error: edge.error }
  }

  const { data, error } = await supabase
    .from('doctor_cases')
    .update(patch)
    .eq('id', id)
    .select('id, status')
    .maybeSingle()

  if (error) {
    if (/check constraint|doctor_cases_status_check/i.test(error.message ?? '')) {
      return { ok: false, error: 'status_migration_required' }
    }
    return { ok: false, error: error.message }
  }
  if (!data) return { ok: false, error: 'update_blocked' }
  return { ok: true }
}

export async function adminUploadDoctorCaseResultPdf(
  caseId: string,
  file: File,
  resultValue: DoctorResultValue,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }
  if (!file.type.includes('pdf')) return { ok: false, error: 'not_pdf' }
  if (resultValue !== 'positive' && resultValue !== 'negative') {
    return { ok: false, error: 'result_required' }
  }

  const canonicalPath = pdfPathForDoctorCase(caseId)

  const { data: existing } = await supabase
    .from('doctor_cases')
    .select('pdf_storage_path')
    .eq('id', caseId)
    .maybeSingle()

  const pathsToRemove = new Set<string>([canonicalPath])
  if (existing?.pdf_storage_path) pathsToRemove.add(existing.pdf_storage_path)

  const { error: removeErr } = await supabase.storage.from(RESULT_BUCKET).remove([...pathsToRemove])
  if (removeErr && !removeErr.message.includes('not found')) {
    /* ignore */
  }

  const { error: upErr } = await supabase.storage.from(RESULT_BUCKET).upload(canonicalPath, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: 'application/pdf',
  })

  if (upErr) return { ok: false, error: upErr.message }

  const expires = new Date()
  expires.setDate(expires.getDate() + 30)

  const { error: dbErr } = await supabase
    .from('doctor_cases')
    .update({
      pdf_storage_path: canonicalPath,
      pdf_expires_at: expires.toISOString(),
      status: 'done',
      result_value: resultValue,
    })
    .eq('id', caseId)

  if (dbErr) return { ok: false, error: dbErr.message }
  return { ok: true }
}

export async function createDoctorResultPdfDownloadUrl(
  storagePath: string | null,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (!supabase || !storagePath) return { ok: false, error: 'no_file' }

  const { data, error } = await supabase.storage
    .from(RESULT_BUCKET)
    .createSignedUrl(storagePath, 3600)

  if (error || !data?.signedUrl) return { ok: false, error: error?.message ?? 'sign_failed' }
  return { ok: true, url: data.signedUrl }
}

export async function createDoctorCaseFileDownloadUrl(
  storagePath: string,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600)

  if (error || !data?.signedUrl) return { ok: false, error: error?.message ?? 'sign_failed' }
  return { ok: true, url: data.signedUrl }
}
