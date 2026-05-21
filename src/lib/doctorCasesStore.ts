import { supabase } from './supabase'
import { buildPatientFullName, type PatientNameParts } from './patientName'
import type { Database } from '../types/database'

export type DoctorCaseRow = Database['public']['Tables']['doctor_cases']['Row']
export type DoctorCaseTestRow = Database['public']['Tables']['doctor_case_tests']['Row']
export type DoctorCaseFileRow = Database['public']['Tables']['doctor_case_files']['Row']
export type DoctorDiseaseType = 'oncology' | 'reproductive' | 'pediatric'
export type DoctorGender = 'male' | 'female' | 'other'
export type DoctorAgeUnit = 'days' | 'months' | 'years'
export type DoctorCaseStatus = 'sent' | 'accepted' | 'rejected'

/** يوحّد القيم القديمة (pending) مع accepted */
export function normalizeDoctorCaseStatus(status: string | null | undefined): DoctorCaseStatus {
  if (status === 'pending' || status === 'accepted') return 'accepted'
  if (status === 'rejected') return 'rejected'
  return 'sent'
}

const BUCKET = 'doctor-case-files'

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
  oncology_tumor_type?: string
  oncology_stage?: string
  oncology_treatment?: string
  test_slugs: string[]
}

export async function insertDoctorCase(
  input: DoctorCaseFormInput & { files: File[] },
): Promise<{ ok: boolean; case_id?: string; count?: number; error?: string }> {
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

  const testRows = slugs.map((test_slug) => ({ case_id: caseId, test_slug }))
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

  return { ok: true, case_id: caseId, count: slugs.length }
}

export type UpdateDoctorCaseInput = DoctorCaseFormInput & {
  newFiles: File[]
  removeFileIds: string[]
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
    .select('id, status')
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

  const testRows = slugs.map((test_slug) => ({ case_id: caseId, test_slug }))
  const { error: testErr } = await supabase.from('doctor_case_tests').insert(testRows)
  if (testErr) return { ok: false, error: testErr.message }

  for (const fileId of input.removeFileIds) {
    const delRes = await deleteDoctorCaseFile(fileId)
    if (!delRes.ok) return delRes
  }

  const uploadRes = await uploadDoctorCaseFiles(caseId, uid, input.newFiles)
  if (!uploadRes.ok) return uploadRes

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
  status: DoctorCaseStatus,
  rejection_reason?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'not_signed_in' }

  const edge = await invokeManageDoctorCase({
    action: 'set_status',
    case_id: id,
    status,
    rejection_reason: rejection_reason ?? null,
  })
  if (edge.ok) return { ok: true }
  if (edge.error && edge.error !== 'edge_not_deployed') {
    return { ok: false, error: edge.error }
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
    return { ok: false, error: rpcErr.message }
  }

  const patch: Database['public']['Tables']['doctor_cases']['Update'] = {
    status,
    rejection_reason: status === 'rejected' ? (rejection_reason?.trim() || 'Rejected') : null,
  }

  const { data, error } = await supabase
    .from('doctor_cases')
    .update(patch)
    .eq('id', id)
    .select('id, status')
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'update_blocked' }
  return { ok: true }
}

export async function createDoctorCaseFileDownloadUrl(
  storagePath: string,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600)

  if (error || !data?.signedUrl) return { ok: false, error: error?.message ?? 'sign_failed' }
  return { ok: true, url: data.signedUrl }
}
