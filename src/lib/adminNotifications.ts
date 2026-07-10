import {
  countUnseenSubmissionGroups,
  isPartnerGroupInAdminNotifications,
} from './adminPartnerSubmissionSeen'
import {
  countUnseenDoctorCases,
  isDoctorCaseInAdminNotifications,
} from './adminDoctorCaseSeen'
import type { DoctorCaseRow } from './doctorCasesStore'
import type { PartnerSubmissionGroup } from './partnerSubmissionsStore'

export type AdminNotificationItem = {
  key: string
  kind: 'partner' | 'doctor'
  targetId: string
  patientName: string
  sourceName: string
  detail: string
  at: string | null
  seen: boolean
}

export type AdminUnseenCounts = {
  partner: number
  doctor: number
  total: number
}

export function buildAdminNotificationItems(input: {
  partnerGroups: PartnerSubmissionGroup[]
  partnerSeenKeys: Set<string>
  labNames: Map<string, string>
  doctorCases: DoctorCaseRow[]
  doctorSeenIds: Set<string>
  doctorNames: Map<string, string>
  labels: {
    partnerTests: (n: number) => string
    doctorDiagnosis: string
  }
}): AdminNotificationItem[] {
  const partnerItems: AdminNotificationItem[] = input.partnerGroups
    .filter((group) => isPartnerGroupInAdminNotifications(group, input.partnerSeenKeys))
    .map((group) => ({
      key: `partner:${group.groupKey}`,
      kind: 'partner' as const,
      targetId: group.groupKey,
      patientName: group.patient_full_name,
      sourceName:
        input.labNames.get(group.partner_user_id) ?? group.partner_user_id.slice(0, 8),
      detail: input.labels.partnerTests(group.items.length),
      at: group.created_at,
      seen: input.partnerSeenKeys.has(group.groupKey),
    }))

  const doctorItems: AdminNotificationItem[] = input.doctorCases
    .filter((row) => isDoctorCaseInAdminNotifications(row, input.doctorSeenIds))
    .map((row) => ({
      key: `doctor:${row.id}`,
      kind: 'doctor' as const,
      targetId: row.id,
      patientName: row.patient_full_name,
      sourceName:
        input.doctorNames.get(row.doctor_user_id) ?? row.doctor_user_id.slice(0, 8),
      detail: row.diagnosis?.trim() || input.labels.doctorDiagnosis,
      at: row.created_at,
      seen: input.doctorSeenIds.has(row.id),
    }))

  return [...partnerItems, ...doctorItems].sort((a, b) => {
    if (a.seen !== b.seen) return a.seen ? 1 : -1
    const ta = a.at ? new Date(a.at).getTime() : 0
    const tb = b.at ? new Date(b.at).getTime() : 0
    return tb - ta
  })
}

export function countUnseenAdminNotifications(input: {
  partnerGroups: PartnerSubmissionGroup[]
  partnerSeenKeys: Set<string>
  doctorCases: DoctorCaseRow[]
  doctorSeenIds: Set<string>
}): AdminUnseenCounts {
  const partner = countUnseenSubmissionGroups(input.partnerGroups, input.partnerSeenKeys)
  const doctor = countUnseenDoctorCases(input.doctorCases, input.doctorSeenIds)
  return { partner, doctor, total: partner + doctor }
}
