import {
  fetchDoctorCaseTestsForCaseIds,
  fetchDoctorCases,
  groupDoctorCaseTestsByCaseId,
  normalizeDoctorCaseStatus,
  type DoctorCaseRow,
  type DoctorCaseTestRow,
} from './doctorCasesStore'

export type DoctorAnalyticsRecentRow = {
  id: string
  case_id: string
  patient_full_name: string
  age_value: number
  age_unit: string
  test_slug: string
  test_title_override: string | null
  status: string
  result_value: string | null
  created_at: string | null
}

export type GenderCount = { gender: 'male' | 'female' | 'other'; count: number }

export const AGE_GROUP_KEYS = ['0-17', '18-30', '31-45', '46-60', '61+'] as const
export type AgeGroupKey = (typeof AGE_GROUP_KEYS)[number]

export type AgeGroupCount = { group: AgeGroupKey; count: number }

/** عدد المرضى لكل فئة عمرية ضمن فحص معيّن */
export type TestAgeBreakdown = {
  test_slug: string
  totalPatients: number
  byAgeGroup: AgeGroupCount[]
}

export type DoctorAnalyticsSummary = {
  totalCases: number
  totalTests: number
  byGender: GenderCount[]
  byAgeGroup: AgeGroupCount[]
  byTestAgeGroup: TestAgeBreakdown[]
  ageDominantGroup: AgeGroupKey | null
  ageDominantGroupPct: number
  ageUnder18Pct: number
  byStatus: { status: string; count: number }[]
  byTestSlug: { test_slug: string; count: number }[]
  byAgeUnit: { age_unit: string; count: number }[]
  ageValueAvgYears: number | null
  recent: DoctorAnalyticsRecentRow[]
}

const GENDER_ORDER: GenderCount['gender'][] = ['male', 'female', 'other']

function ageGroupKey(years: number): AgeGroupKey {
  if (years < 18) return '0-17'
  if (years < 31) return '18-30'
  if (years < 46) return '31-45'
  if (years < 61) return '46-60'
  return '61+'
}

function normalizeGender(g: string): GenderCount['gender'] {
  if (g === 'male' || g === 'female') return g
  return 'other'
}

function ageToApproxYears(value: number, unit: string): number {
  if (unit === 'years') return value
  if (unit === 'months') return value / 12
  if (unit === 'days') return value / 365
  return value
}

export function computeDoctorAnalytics(
  cases: DoctorCaseRow[],
  tests: DoctorCaseTestRow[],
): DoctorAnalyticsSummary {
  const testsByCase = groupDoctorCaseTestsByCaseId(tests)
  const statusMap = new Map<string, number>()
  const genderMap = new Map<GenderCount['gender'], number>()
  const ageGroupMap = new Map<AgeGroupKey, number>()
  for (const key of AGE_GROUP_KEYS) ageGroupMap.set(key, 0)
  const testMap = new Map<string, number>()
  const testAgeMap = new Map<string, Map<AgeGroupKey, number>>()
  const unitMap = new Map<string, number>()
  let ageSum = 0
  let ageCount = 0
  const recent: DoctorAnalyticsRecentRow[] = []

  for (const row of cases) {
    const status = normalizeDoctorCaseStatus(row.status)
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1)
    const g = normalizeGender(row.gender)
    genderMap.set(g, (genderMap.get(g) ?? 0) + 1)
    unitMap.set(row.age_unit, (unitMap.get(row.age_unit) ?? 0) + 1)
    const years = ageToApproxYears(row.age_value, row.age_unit)
    ageSum += years
    ageCount += 1
    const ag = ageGroupKey(years)
    ageGroupMap.set(ag, (ageGroupMap.get(ag) ?? 0) + 1)

    const caseTests = testsByCase.get(row.id) ?? []
    if (caseTests.length === 0) {
      recent.push({
        id: row.id,
        case_id: row.id,
        patient_full_name: row.patient_full_name,
        age_value: row.age_value,
        age_unit: row.age_unit,
        test_slug: '',
        test_title_override: null,
        status,
        result_value: row.result_value,
        created_at: row.created_at,
      })
    } else {
      for (const t of caseTests) {
        testMap.set(t.test_slug, (testMap.get(t.test_slug) ?? 0) + 1)
        if (!testAgeMap.has(t.test_slug)) {
          const gMap = new Map<AgeGroupKey, number>()
          for (const key of AGE_GROUP_KEYS) gMap.set(key, 0)
          testAgeMap.set(t.test_slug, gMap)
        }
        const gMap = testAgeMap.get(t.test_slug)!
        gMap.set(ag, (gMap.get(ag) ?? 0) + 1)
        recent.push({
          id: `${row.id}-${t.test_slug}`,
          case_id: row.id,
          patient_full_name: row.patient_full_name,
          age_value: row.age_value,
          age_unit: row.age_unit,
          test_slug: t.test_slug,
          test_title_override: t.test_title_override,
          status,
          result_value: row.result_value,
          created_at: row.created_at,
        })
      }
    }
  }

  const byGender = GENDER_ORDER.map((gender) => ({
    gender,
    count: genderMap.get(gender) ?? 0,
  })).filter((row) => row.count > 0)

  const byAgeGroup = AGE_GROUP_KEYS.map((group) => ({
    group,
    count: ageGroupMap.get(group) ?? 0,
  }))

  let ageDominantGroup: AgeGroupKey | null = null
  let maxGroupCount = 0
  for (const row of byAgeGroup) {
    if (row.count > maxGroupCount) {
      maxGroupCount = row.count
      ageDominantGroup = row.group
    }
  }
  const ageDominantGroupPct =
    ageCount > 0 && maxGroupCount > 0 ? Math.round((maxGroupCount / ageCount) * 100) : 0
  const under18 = ageGroupMap.get('0-17') ?? 0
  const ageUnder18Pct = ageCount > 0 ? Math.round((under18 / ageCount) * 100) : 0

  const byStatus = [...statusMap.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)

  const byTestSlug = [...testMap.entries()]
    .map(([test_slug, count]) => ({ test_slug, count }))
    .sort((a, b) => b.count - a.count)

  const byTestAgeGroup: TestAgeBreakdown[] = [...testAgeMap.entries()]
    .map(([test_slug, gMap]) => {
      const byAgeGroup = AGE_GROUP_KEYS.map((group) => ({
        group,
        count: gMap.get(group) ?? 0,
      }))
      const totalPatients = byAgeGroup.reduce((n, row) => n + row.count, 0)
      return { test_slug, totalPatients, byAgeGroup }
    })
    .sort((a, b) => b.totalPatients - a.totalPatients)

  const byAgeUnit = [...unitMap.entries()]
    .map(([age_unit, count]) => ({ age_unit, count }))
    .sort((a, b) => b.count - a.count)

  recent.sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0
    return tb - ta
  })

  return {
    totalCases: cases.length,
    totalTests: tests.length,
    byGender,
    byAgeGroup,
    byTestAgeGroup,
    ageDominantGroup,
    ageDominantGroupPct,
    ageUnder18Pct,
    byStatus,
    byTestSlug,
    byAgeUnit,
    ageValueAvgYears: ageCount > 0 ? Math.round((ageSum / ageCount) * 10) / 10 : null,
    recent: recent.slice(0, 50),
  }
}

/** تحليل حالات المريض التي أرسلها الطبيب المسجّل فقط (RLS على doctor_cases). */
export async function fetchDoctorCasesForAnalytics(): Promise<{
  ok: boolean
  cases?: DoctorCaseRow[]
  tests?: DoctorCaseTestRow[]
  error?: string
}> {
  const casesRes = await fetchDoctorCases()
  if (!casesRes.ok) return { ok: false, error: casesRes.error }

  const caseRows = casesRes.rows ?? []
  const testsRes = await fetchDoctorCaseTestsForCaseIds(caseRows.map((r) => r.id))
  if (!testsRes.ok) return { ok: false, error: testsRes.error }

  return { ok: true, cases: caseRows, tests: testsRes.rows ?? [] }
}
