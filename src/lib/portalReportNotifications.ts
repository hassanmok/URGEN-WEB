import { supabase } from './supabase'
import {
  isPartnerPdfExpired,
  partnerSubmissionGroupKey,
  type PartnerSubmissionRow,
} from './partnerSubmissionsStore'
import { isDoctorResultPdfExpired, type DoctorCaseRow } from './doctorCasesStore'

export type PortalReportNotificationItem = {
  id: string
  groupKey: string
  patientName: string
  label: string
  at: string | null
}

const PARTNER_SEEN_KEY = 'urgen_partner_report_ready_seen_v1'
const DOCTOR_SEEN_KEY = 'urgen_doctor_report_ready_seen_v1'

function readLocalSeen(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

function writeLocalSeen(key: string, ids: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...ids]))
}

export async function fetchSeenPartnerReportIds(): Promise<Set<string>> {
  if (!supabase) return readLocalSeen(PARTNER_SEEN_KEY)
  const { data, error } = await supabase.from('partner_report_ready_seen').select('submission_id')
  if (error) {
    console.error('[partner_report_ready_seen]', error.message)
    return readLocalSeen(PARTNER_SEEN_KEY)
  }
  return new Set((data ?? []).map((r) => r.submission_id))
}

export async function markPartnerReportReadySeen(submissionId: string): Promise<void> {
  const id = submissionId.trim()
  if (!id) return

  if (!supabase) {
    const seen = readLocalSeen(PARTNER_SEEN_KEY)
    seen.add(id)
    writeLocalSeen(PARTNER_SEEN_KEY, seen)
    return
  }

  const { data: userData } = await supabase.auth.getUser()
  const uid = userData.user?.id
  if (!uid) return

  const { error } = await supabase.from('partner_report_ready_seen').upsert({
    partner_user_id: uid,
    submission_id: id,
    seen_at: new Date().toISOString(),
  })
  if (error) console.error('[partner_report_ready_seen upsert]', error.message)
}

export function listUnseenPartnerReadyReports(
  rows: PartnerSubmissionRow[],
  seenIds: Set<string>,
  testTitleFor: (row: Pick<PartnerSubmissionRow, 'test_slug' | 'test_title_override'>) => string,
): PortalReportNotificationItem[] {
  return rows
    .filter(
      (row) =>
        row.status === 'done' &&
        row.pdf_storage_path &&
        !isPartnerPdfExpired(row) &&
        !seenIds.has(row.id),
    )
    .map((row) => ({
      id: row.id,
      groupKey: partnerSubmissionGroupKey(row),
      patientName: row.patient_full_name,
      label: testTitleFor(row),
      at: row.updated_at ?? row.created_at,
    }))
    .sort((a, b) => {
      const ta = a.at ? new Date(a.at).getTime() : 0
      const tb = b.at ? new Date(b.at).getTime() : 0
      return tb - ta
    })
}

export async function fetchSeenDoctorReportIds(): Promise<Set<string>> {
  if (!supabase) return readLocalSeen(DOCTOR_SEEN_KEY)
  const { data, error } = await supabase.from('doctor_report_ready_seen').select('case_id')
  if (error) {
    console.error('[doctor_report_ready_seen]', error.message)
    return readLocalSeen(DOCTOR_SEEN_KEY)
  }
  return new Set((data ?? []).map((r) => r.case_id))
}

export async function markDoctorReportReadySeen(caseId: string): Promise<void> {
  const id = caseId.trim()
  if (!id) return

  if (!supabase) {
    const seen = readLocalSeen(DOCTOR_SEEN_KEY)
    seen.add(id)
    writeLocalSeen(DOCTOR_SEEN_KEY, seen)
    return
  }

  const { data: userData } = await supabase.auth.getUser()
  const uid = userData.user?.id
  if (!uid) return

  const { error } = await supabase.from('doctor_report_ready_seen').upsert({
    doctor_user_id: uid,
    case_id: id,
    seen_at: new Date().toISOString(),
  })
  if (error) console.error('[doctor_report_ready_seen upsert]', error.message)
}

export function listUnseenDoctorReadyReports(
  cases: DoctorCaseRow[],
  seenIds: Set<string>,
  testLabelFor: (row: DoctorCaseRow) => string,
): PortalReportNotificationItem[] {
  return cases
    .filter(
      (row) =>
        row.status === 'done' &&
        row.pdf_storage_path &&
        !isDoctorResultPdfExpired(row) &&
        !seenIds.has(row.id),
    )
    .map((row) => ({
      id: row.id,
      groupKey: row.id,
      patientName: row.patient_full_name,
      label: testLabelFor(row),
      at: row.updated_at ?? row.created_at,
    }))
    .sort((a, b) => {
      const ta = a.at ? new Date(a.at).getTime() : 0
      const tb = b.at ? new Date(b.at).getTime() : 0
      return tb - ta
    })
}
