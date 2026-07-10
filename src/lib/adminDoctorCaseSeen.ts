import { supabase } from './supabase'
import { normalizeDoctorCaseStatus, type DoctorCaseRow } from './doctorCasesStore'

const STORAGE_KEY = 'urgen_admin_seen_doctor_cases_v1'

const ACTIONABLE_DOCTOR_STATUSES = new Set(['sent', 'pending', 'in_progress'])

/** حالة تحتاج متابعة من الإدارة (بما فيها المستوردة بدون فحوصات) */
export function isAdminNotifiableDoctorCase(row: DoctorCaseRow): boolean {
  return ACTIONABLE_DOCTOR_STATUSES.has(normalizeDoctorCaseStatus(row.status))
}

/** يظهر في الإشعارات: حالة نشطة أو سبق عرضها للأدمن */
export function isDoctorCaseInAdminNotifications(
  row: DoctorCaseRow,
  seenIds: Set<string>,
): boolean {
  if (seenIds.has(row.id)) return true
  return isAdminNotifiableDoctorCase(row)
}

async function fetchSeenFromDb(): Promise<Set<string>> {
  if (!supabase) return new Set()
  const { data, error } = await supabase.rpc('doctor_case_seen_ids')
  if (error) {
    console.error('[doctor_case_seen_ids]', error.message)
    return new Set()
  }
  return new Set((data ?? []).map((id) => String(id)))
}

function fetchSeenFromLocal(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

async function migrateLocalSeenToDb(): Promise<void> {
  if (!supabase) return
  const local = fetchSeenFromLocal()
  if (local.size === 0) return
  for (const caseId of local) {
    await supabase.rpc('doctor_case_mark_seen', { p_case_id: caseId })
  }
  localStorage.removeItem(STORAGE_KEY)
}

export async function fetchSeenDoctorCaseIds(): Promise<Set<string>> {
  if (!supabase) return fetchSeenFromLocal()
  await migrateLocalSeenToDb()
  return fetchSeenFromDb()
}

export async function markDoctorCaseSeen(caseId: string): Promise<void> {
  const id = caseId.trim()
  if (!id) return

  if (!supabase) {
    const seen = fetchSeenFromLocal()
    seen.add(id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]))
    return
  }

  await migrateLocalSeenToDb()

  const { error } = await supabase.rpc('doctor_case_mark_seen', { p_case_id: id })
  if (error) console.error('[doctor_case_mark_seen]', error.message)
}

export function getAdminDoctorCaseNotifications(cases: DoctorCaseRow[]): DoctorCaseRow[] {
  return cases
    .filter((c) => isAdminNotifiableDoctorCase(c))
    .sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0
      return tb - ta
    })
}

export function countUnseenDoctorCases(
  cases: DoctorCaseRow[],
  seenIds: Set<string>,
): number {
  return cases.filter((c) => !seenIds.has(c.id) && isAdminNotifiableDoctorCase(c)).length
}
