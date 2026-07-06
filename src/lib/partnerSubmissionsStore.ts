import { supabase } from './supabase'
import { fetchPartnerLabUsersAdmin } from './partnerLabUsersAdmin'
import { tokenize } from './searchIndex'
import { isCustomOtherTestSlug } from './doctorCasesStore'
import type { Database } from '../types/database'
import type { LabTest } from '../types/labTest'

export type PartnerSubmissionRow = Database['public']['Tables']['partner_submissions']['Row']
export type PartnerAgeUnit = 'days' | 'months' | 'years'

const BUCKET = 'partner-reports'

export function pdfPathForSubmission(submissionId: string) {
  return `${submissionId}/report.pdf`
}

/** صلاحية رابط التحميل للمختبر انتهت (لا يُعتبر منتهياً إذا لم يُحدَّد تاريخ). */
export function isPartnerPdfExpired(row: Pick<PartnerSubmissionRow, 'pdf_expires_at'>): boolean {
  if (row.pdf_expires_at == null) return false
  return new Date(row.pdf_expires_at).getTime() <= Date.now()
}

/** تطبيع نص البحث (عربي/لاتيني) لمطابقة أسماء التحاليل والمرضى */
export function normalizePartnerSearchText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function findTestBySlug(tests: LabTest[], slug: string): LabTest | undefined {
  const key = slug.trim().toLowerCase()
  if (!key) return undefined
  const keyCompact = key.replace(/[-_\s]/g, '')
  return tests.find((t) => {
    const s = t.slug.toLowerCase()
    if (s === key) return true
    return s.replace(/[-_\s]/g, '') === keyCompact
  })
}

/** عنوان الفحص المعروض (كتالوج أو فحص مخصص «أخرى») */
export function resolvePartnerSubmissionTestTitle(
  row: Pick<PartnerSubmissionRow, 'test_slug' | 'test_title_override'>,
  tests: LabTest[],
  locale: string,
): string {
  const override = row.test_title_override?.trim()
  if (override) return override
  const test = findTestBySlug(tests, row.test_slug)
  if (test) return locale === 'ar' ? test.title_ar : (test.title_en ?? test.title_ar)
  return row.test_slug
}

/** كل النصوص القابلة للبحث لتحليل (عناوين، وصف، slug بصيغ مختلفة) */
export function buildTestSearchNeedles(test: LabTest | undefined, slug: string): string[] {
  const slugVariants = [
    slug,
    slug.replace(/-/g, '_'),
    slug.replace(/_/g, '-'),
    slug.replace(/[-_]/g, ' '),
  ]
  if (!test) return [...new Set(slugVariants.filter((s) => s.trim().length > 0))]

  return [
    ...slugVariants,
    test.slug,
    test.title_ar,
    test.title_en ?? '',
    test.description_ar,
    test.description_en ?? '',
    test.long_description_ar ?? '',
    test.long_description_en ?? '',
    test.clinical_use_ar ?? '',
    test.clinical_use_en ?? '',
    test.sample_ar ?? '',
    test.sample_en ?? '',
    test.method_ar ?? '',
    test.method_en ?? '',
  ].filter((s) => Boolean(s?.trim()))
}

function needlesMatchQuery(needles: readonly string[], rawQuery: string): boolean {
  const q = rawQuery.trim()
  if (!q) return true

  const tokens = tokenize(q)
  if (!tokens.length) return true

  const haystack = normalizePartnerSearchText(needles.filter(Boolean).join(' '))
  if (!haystack) return false

  return tokens.every((token) => {
    const nt = normalizePartnerSearchText(token)
    return nt.length > 0 && haystack.includes(nt)
  })
}

/** بحث محلي في الطلبات: اسم المريض، slug الفحص، العمر، أو عناوين إضافية (عنوان الفحص المعروض). */
export function partnerSubmissionMatchesSearch(
  row: PartnerSubmissionRow,
  rawQuery: string,
  extraNeedles: readonly string[] = [],
): boolean {
  const q = rawQuery.trim()
  if (!q) return true

  const needles = [
    row.patient_full_name,
    row.test_slug,
    row.test_title_override ?? '',
    String(row.age_value),
    row.age_unit,
    `${row.age_value} ${row.age_unit}`,
    ...extraNeedles,
  ]

  if (needlesMatchQuery(needles, q)) return true

  const digitsOnly = q.replace(/\D/g, '')
  if (digitsOnly.length > 0) {
    const n = Number.parseInt(digitsOnly, 10)
    if (Number.isFinite(n) && row.age_value === n) return true
  }

  return false
}

/** تصفية مجموعات الطلبات: يظهر الطلب إذا تطابق أي تحليل فيه أو بيانات المريض/المختبر */
export function filterPartnerSubmissionGroups(
  rows: PartnerSubmissionRow[],
  rawQuery: string,
  tests: LabTest[],
  labNames?: Map<string, string>,
): PartnerSubmissionGroup[] {
  const groups = groupPartnerSubmissions(rows)
  const q = rawQuery.trim()
  if (!q) return groups

  return groups.filter((group) => {
    const labName = labNames?.get(group.partner_user_id)
    const groupNeedles = [
      group.patient_full_name,
      String(group.age_value),
      group.age_unit,
      `${group.age_value} ${group.age_unit}`,
      labName ?? '',
    ]
    if (needlesMatchQuery(groupNeedles, q)) return true

    return group.items.some((item) => {
      const test = findTestBySlug(tests, item.test_slug)
      return partnerSubmissionMatchesSearch(
        item,
        q,
        [
          ...buildTestSearchNeedles(test, item.test_slug),
          item.test_title_override ?? '',
        ],
      )
    })
  })
}

export async function fetchPartnerSubmissionsForLab(): Promise<{
  ok: boolean
  rows?: PartnerSubmissionRow[]
  error?: string
}> {
  if (!supabase) return { ok: false, error: 'no_supabase' }
  const { data, error } = await supabase
    .from('partner_submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { ok: false, error: error.message }
  return { ok: true, rows: (data ?? []) as PartnerSubmissionRow[] }
}

export type PartnerSubmissionsAdminListMsgs = {
  partnerLabsErr: string
  partnerLabsNoSupabase: string
  partnerLabsNotSignedIn: string
  partnerLabsRpcMissing: string
}

export function partnerSubmissionsAdminListErrorMessage(
  code: string | undefined,
  m: PartnerSubmissionsAdminListMsgs,
): string {
  switch (code) {
    case 'no_supabase':
      return m.partnerLabsNoSupabase
    case 'not_signed_in':
      return m.partnerLabsNotSignedIn
    case 'rpc_missing':
      return m.partnerLabsRpcMissing
    default:
      return code?.trim() ? code : m.partnerLabsErr
  }
}

export async function fetchAllPartnerSubmissionsAdmin(): Promise<{
  ok: boolean
  rows?: PartnerSubmissionRow[]
  error?: string
}> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, error: 'not_signed_in' }

  const { data, error } = await supabase.rpc('partner_submissions_admin_list')

  if (error) {
    const msg = error.message ?? ''
    if (
      msg.includes('partner_submissions_admin_list') ||
      error.code === '42883' ||
      error.code === 'PGRST202'
    ) {
      return { ok: false, error: 'rpc_missing' }
    }
    return { ok: false, error: msg || 'fetch_failed' }
  }
  return { ok: true, rows: (data ?? []) as PartnerSubmissionRow[] }
}

export async function fetchPartnerLabNamesMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const list = await fetchPartnerLabUsersAdmin()
  if (!list.ok || !list.rows) return map
  for (const row of list.rows) {
    map.set(row.user_id, row.lab_display_name)
  }
  return map
}

export async function insertPartnerSubmissionBatch(input: {
  patient_full_name: string
  age_value: number
  age_unit: PartnerAgeUnit
  test_slugs: string[]
  other_test_titles?: Record<string, string>
}): Promise<{ ok: boolean; batch_id?: string; count?: number; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }
  const slugs = [...new Set(input.test_slugs.map((s) => s.trim()).filter(Boolean))]
  if (slugs.length === 0) return { ok: false, error: 'no_tests' }

  const { data: userData } = await supabase.auth.getUser()
  const uid = userData.user?.id
  if (!uid) return { ok: false, error: 'not_signed_in' }

  const titleMap = input.other_test_titles ?? {}
  const batch_id = crypto.randomUUID()
  const rows = slugs.map((test_slug) => ({
    partner_user_id: uid,
    batch_id,
    patient_full_name: input.patient_full_name.trim(),
    age_value: input.age_value,
    age_unit: input.age_unit,
    test_slug,
    test_title_override: isCustomOtherTestSlug(test_slug)
      ? titleMap[test_slug]?.trim() || null
      : null,
    status: 'sent' as const,
  }))

  const { error } = await supabase.from('partner_submissions').insert(rows)
  if (error) return { ok: false, error: error.message }
  return { ok: true, batch_id, count: slugs.length }
}

/** يمكن تعديل الطلب فقط قبل قبول الإدارة (كل الفحوصات ما زالت «مرسل») */
export function canEditPartnerSubmissionGroup(group: PartnerSubmissionGroup): boolean {
  return group.items.length > 0 && group.items.every((row) => row.status === 'sent')
}

export async function updatePartnerSubmissionBatch(input: {
  existingItems: PartnerSubmissionRow[]
  patient_full_name: string
  age_value: number
  age_unit: PartnerAgeUnit
  test_slugs: string[]
  other_test_titles?: Record<string, string>
}): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const { existingItems } = input
  if (existingItems.length === 0) return { ok: false, error: 'not_found' }

  const { data: userData } = await supabase.auth.getUser()
  const uid = userData.user?.id
  if (!uid) return { ok: false, error: 'not_signed_in' }

  if (existingItems.some((row) => row.partner_user_id !== uid)) {
    return { ok: false, error: 'not_signed_in' }
  }
  if (existingItems.some((row) => row.status !== 'sent')) {
    return { ok: false, error: 'not_editable' }
  }

  const slugs = [...new Set(input.test_slugs.map((s) => s.trim()).filter(Boolean))]
  if (slugs.length === 0) return { ok: false, error: 'no_tests' }

  const batch_id = existingItems[0].batch_id ?? crypto.randomUUID()
  const created_at =
    existingItems
      .map((row) => row.created_at)
      .filter((t): t is string => Boolean(t))
      .sort()[0] ?? null

  const ids = existingItems.map((row) => row.id)
  const { error: delErr } = await supabase
    .from('partner_submissions')
    .delete()
    .in('id', ids)
    .eq('partner_user_id', uid)
    .eq('status', 'sent')

  if (delErr) return { ok: false, error: delErr.message }

  const titleMap = input.other_test_titles ?? {}
  const rows = slugs.map((test_slug) => ({
    partner_user_id: uid,
    batch_id,
    patient_full_name: input.patient_full_name.trim(),
    age_value: input.age_value,
    age_unit: input.age_unit,
    test_slug,
    test_title_override: isCustomOtherTestSlug(test_slug)
      ? titleMap[test_slug]?.trim() || null
      : null,
    status: 'sent' as const,
    ...(created_at ? { created_at } : {}),
  }))

  const { error: insErr } = await supabase.from('partner_submissions').insert(rows)
  if (insErr) return { ok: false, error: insErr.message }
  return { ok: true }
}

/** @deprecated استخدم insertPartnerSubmissionBatch */
export async function insertPartnerSubmission(input: {
  patient_full_name: string
  age_value: number
  age_unit: PartnerAgeUnit
  test_slug: string
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const res = await insertPartnerSubmissionBatch({
    ...input,
    test_slugs: [input.test_slug],
  })
  if (!res.ok) return { ok: false, error: res.error }
  return { ok: true }
}

export function partnerSubmissionGroupKey(
  row: Pick<PartnerSubmissionRow, 'id' | 'batch_id'>,
): string {
  return row.batch_id ? `batch:${row.batch_id}` : `solo:${row.id}`
}

export type PartnerSubmissionGroup = {
  groupKey: string
  batch_id: string | null
  partner_user_id: string
  patient_full_name: string
  age_value: number
  age_unit: string
  created_at: string | null
  items: PartnerSubmissionRow[]
}

export function groupPartnerSubmissions(rows: PartnerSubmissionRow[]): PartnerSubmissionGroup[] {
  const map = new Map<string, PartnerSubmissionGroup>()

  for (const row of rows) {
    const key = partnerSubmissionGroupKey(row)
    let group = map.get(key)
    if (!group) {
      group = {
        groupKey: key,
        batch_id: row.batch_id,
        partner_user_id: row.partner_user_id,
        patient_full_name: row.patient_full_name,
        age_value: row.age_value,
        age_unit: row.age_unit,
        created_at: row.created_at,
        items: [],
      }
      map.set(key, group)
    }
    group.items.push(row)
    if (row.created_at && (!group.created_at || row.created_at < group.created_at)) {
      group.created_at = row.created_at
    }
  }

  return [...map.values()].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0
    return tb - ta
  })
}

export async function adminUpdateSubmissionStatus(
  id: string,
  status: 'pending' | 'in_progress' | 'rejected',
  rejection_reason?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const patch: Database['public']['Tables']['partner_submissions']['Update'] = {
    status,
    rejection_reason:
      status === 'rejected' ? (rejection_reason?.trim() || 'Rejected') : null,
  }
  if (status === 'rejected') {
    patch.pdf_storage_path = null
    patch.pdf_expires_at = null
  }

  const { error } = await supabase.from('partner_submissions').update(patch).eq('id', id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function adminUploadSubmissionPdf(
  submissionId: string,
  file: File,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }
  if (!file.type.includes('pdf')) return { ok: false, error: 'not_pdf' }

  const canonicalPath = pdfPathForSubmission(submissionId)

  const { data: existing } = await supabase
    .from('partner_submissions')
    .select('pdf_storage_path')
    .eq('id', submissionId)
    .maybeSingle()

  const pathsToRemove = new Set<string>([canonicalPath])
  if (existing?.pdf_storage_path) pathsToRemove.add(existing.pdf_storage_path)

  const { error: removeErr } = await supabase.storage.from(BUCKET).remove([...pathsToRemove])
  if (removeErr && !removeErr.message.includes('not found')) {
    /* ignore */
  }

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(canonicalPath, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: 'application/pdf',
  })

  if (upErr) return { ok: false, error: upErr.message }

  const expires = new Date()
  expires.setDate(expires.getDate() + 30)

  const { error: dbErr } = await supabase
    .from('partner_submissions')
    .update({
      pdf_storage_path: canonicalPath,
      pdf_expires_at: expires.toISOString(),
      status: 'done',
    })
    .eq('id', submissionId)

  if (dbErr) return { ok: false, error: dbErr.message }
  return { ok: true }
}

export async function createPartnerPdfDownloadUrl(
  storagePath: string | null,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (!supabase || !storagePath) return { ok: false, error: 'no_file' }

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600)

  if (error || !data?.signedUrl) return { ok: false, error: error?.message ?? 'sign_failed' }
  return { ok: true, url: data.signedUrl }
}

/** تسجيل أول فتح لتقرير PDF (يُرجع وقت الفتح الحالي أو السابق) */
export async function markPartnerReportOpened(
  submissionId: string,
): Promise<{ ok: boolean; opened_at?: string | null; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const { data, error } = await supabase.rpc('partner_submission_mark_report_opened', {
    p_submission_id: submissionId,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true, opened_at: (data as string | null) ?? null }
}
