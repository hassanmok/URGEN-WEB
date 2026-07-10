import { supabase } from './supabase'
import {
  groupPartnerSubmissions,
  type PartnerSubmissionGroup,
  type PartnerSubmissionRow,
} from './partnerSubmissionsStore'

const STORAGE_KEY = 'urgen_admin_seen_submission_groups_v1'

/** حالات تحتاج متابعة من الإدارة */
const ACTIONABLE_PARTNER_STATUSES = new Set(['sent', 'pending', 'in_progress'])

export function isActionablePartnerGroup(group: PartnerSubmissionGroup): boolean {
  return group.items.some((row) => ACTIONABLE_PARTNER_STATUSES.has(row.status))
}

/** يظهر في الإشعارات: طلب نشط أو سبق عرضه للأدمن */
export function isPartnerGroupInAdminNotifications(
  group: PartnerSubmissionGroup,
  seenKeys: Set<string>,
): boolean {
  if (seenKeys.has(group.groupKey)) return true
  return isActionablePartnerGroup(group)
}

export function partnerSubmissionGroupKey(
  row: Pick<PartnerSubmissionRow, 'id' | 'batch_id'>,
): string {
  return row.batch_id ? `batch:${row.batch_id}` : `solo:${row.id}`
}

async function fetchSeenFromDb(): Promise<Set<string>> {
  if (!supabase) return new Set()
  const { data, error } = await supabase.rpc('partner_submission_seen_group_keys')
  if (error) {
    console.error('[partner_submission_seen_group_keys]', error.message)
    return new Set()
  }
  return new Set((data ?? []).filter((x): x is string => typeof x === 'string'))
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

export async function fetchSeenSubmissionGroupKeys(): Promise<Set<string>> {
  if (!supabase) return fetchSeenFromLocal()
  await migrateLocalSeenToDb()
  return fetchSeenFromDb()
}

async function migrateLocalSeenToDb(): Promise<void> {
  if (!supabase) return
  const local = fetchSeenFromLocal()
  if (local.size === 0) return
  for (const k of local) {
    await supabase.rpc('partner_submission_mark_group_seen', { p_group_key: k })
  }
  localStorage.removeItem(STORAGE_KEY)
}

export async function markSubmissionGroupSeen(groupKey: string): Promise<void> {
  const key = groupKey.trim()
  if (!key) return

  if (!supabase) {
    const seen = fetchSeenFromLocal()
    seen.add(key)
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]))
    return
  }

  await migrateLocalSeenToDb()

  const { error } = await supabase.rpc('partner_submission_mark_group_seen', {
    p_group_key: key,
  })
  if (error) console.error('[partner_submission_mark_group_seen]', error.message)
}

export async function isSubmissionGroupSeen(groupKey: string): Promise<boolean> {
  const seen = await fetchSeenSubmissionGroupKeys()
  return seen.has(groupKey)
}

export async function getUnseenSubmissionGroups(
  rows: PartnerSubmissionRow[],
): Promise<PartnerSubmissionGroup[]> {
  const seen = await fetchSeenSubmissionGroupKeys()
  return groupPartnerSubmissions(rows).filter((g) => !seen.has(g.groupKey))
}

/** كل طلبات المختبرات — تبقى في الإشعارات بغض النظر عن الحالة */
export function getAdminSubmissionNotificationGroups(
  rows: PartnerSubmissionRow[],
): PartnerSubmissionGroup[] {
  return groupPartnerSubmissions(rows).sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0
    return tb - ta
  })
}

export function countUnseenSubmissionGroups(
  groups: PartnerSubmissionGroup[],
  seenKeys: Set<string>,
): number {
  return groups.filter(
    (g) => !seenKeys.has(g.groupKey) && isActionablePartnerGroup(g),
  ).length
}
