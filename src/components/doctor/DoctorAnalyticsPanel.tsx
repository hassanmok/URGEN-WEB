import { useEffect, useMemo, useState } from 'react'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import { useTests } from '../../hooks/useTests'
import {
  computeDoctorAnalytics,
  fetchDoctorCasesForAnalytics,
  type DoctorAnalyticsSummary,
} from '../../lib/doctorAnalytics'
import { SimplePieChart } from '../ui/SimplePieChart'
import type { Messages } from '../../i18n/messages'
import { PatientAgeAreaChart } from '../ui/PatientAgeAreaChart'
import type { AgeGroupKey, GenderCount } from '../../lib/doctorAnalytics'

const GENDER_COLORS: Record<GenderCount['gender'], string> = {
  male: '#14b8a6',
  female: '#7c3aed',
  other: '#f97316',
}

type Props = {
  m: Messages['doctorPortal']
}

function ageLabel(value: number, unit: string, m: Messages['doctorPortal']): string {
  const u =
    unit === 'days' ? m.ageUnitDays : unit === 'months' ? m.ageUnitMonths : m.ageUnitYears
  return `${value} ${u}`
}

export function DoctorAnalyticsPanel({ m }: Props) {
  const { locale } = useLocaleContext()
  const { tests } = useTests()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<DoctorAnalyticsSummary | null>(null)

  async function reload() {
    setLoading(true)
    setError(null)
    const res = await fetchDoctorCasesForAnalytics()
    if (res.ok && res.cases) {
      setSummary(computeDoctorAnalytics(res.cases, res.tests ?? []))
    } else {
      setSummary(null)
      setError(res.error ?? m.analyticsLoadErr)
    }
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [])

  const statusLabels = useMemo(
    () => ({
      sent: m.caseStatusSent,
      accepted: m.caseStatusAccepted,
      rejected: m.caseStatusRejected,
    }),
    [m],
  )

  const ageGroupLabel = (group: AgeGroupKey): string => {
    const map: Record<AgeGroupKey, string> = {
      '0-17': m.ageGroup0_17,
      '18-30': m.ageGroup18_30,
      '31-45': m.ageGroup31_45,
      '46-60': m.ageGroup46_60,
      '61+': m.ageGroup61Plus,
    }
    return map[group]
  }

  const ageChartData = useMemo(() => {
    if (!summary) return { kpis: [], points: [] as { label: string; count: number }[] }
    const dominantLabel = summary.ageDominantGroup
      ? ageGroupLabel(summary.ageDominantGroup)
      : '—'
    const kpis = [
      {
        value:
          summary.ageValueAvgYears != null
            ? `${summary.ageValueAvgYears} ${m.ageUnitYears}`
            : '—',
        label: m.analyticsAvgAge,
        color: '#7c3aed',
      },
      {
        value: `${summary.ageDominantGroupPct}%`,
        label: `${m.analyticsDominantAge} (${dominantLabel})`,
        color: '#14b8a6',
      },
      {
        value: `${summary.ageUnder18Pct}%`,
        label: m.analyticsUnder18,
        color: '#ec4899',
      },
    ]
    const points = summary.byAgeGroup.map((row) => ({
      label: ageGroupLabel(row.group),
      count: row.count,
    }))
    return { kpis, points }
  }, [summary, m])

  const genderSlices = useMemo(() => {
    if (!summary) return []
    const labels: Record<GenderCount['gender'], string> = {
      male: m.genderMale,
      female: m.genderFemale,
      other: m.genderOther,
    }
    return summary.byGender.map((row) => ({
      label: labels[row.gender],
      count: row.count,
      color: GENDER_COLORS[row.gender],
    }))
  }, [summary, m])

  function testTitle(slug: string) {
    const t = tests.find((x) => x.slug === slug)
    if (!t) return slug
    return locale === 'ar' ? t.title_ar : (t.title_en ?? t.title_ar)
  }

  if (loading) {
    return <p className="text-sm text-slate-500">{m.analyticsLoading}</p>
  }

  if (error) {
    return (
      <div>
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          className="mt-3 text-sm font-semibold text-urgen-purple"
          onClick={() => void reload()}
        >
          {m.refresh}
        </button>
      </div>
    )
  }

  if (!summary || summary.totalCases === 0) {
    return <p className="text-sm text-slate-500">{m.analyticsEmpty}</p>
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{m.analyticsIntro}</p>
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => void reload()}
        >
          {m.refresh}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SimplePieChart
          title={m.analyticsByGender}
          slices={genderSlices}
          emptyLabel={m.analyticsEmpty}
        />
        <PatientAgeAreaChart
          title={m.analyticsByAge}
          kpis={ageChartData.kpis}
          points={ageChartData.points}
          emptyLabel={m.analyticsEmpty}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={m.analyticsTotal} value={String(summary.totalCases)} />
        <StatCard
          label={m.analyticsAvgAge}
          value={
            summary.ageValueAvgYears != null
              ? `${summary.ageValueAvgYears} ${m.ageUnitYears}`
              : '—'
          }
        />
        <StatCard label={m.analyticsTestTypes} value={String(summary.byTestSlug.length)} />
        <StatCard label={m.analyticsStatuses} value={String(summary.byStatus.length)} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-bold text-urgen-navy">{m.analyticsByTest}</h3>
        <ul className="mt-4 space-y-2">
          {summary.byTestSlug.slice(0, 15).map((row) => (
            <li
              key={row.test_slug}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-2 last:border-0"
            >
              <span className="text-sm font-medium text-urgen-navy">{testTitle(row.test_slug)}</span>
              <span className="rounded-full bg-urgen-purple/10 px-3 py-0.5 text-xs font-semibold text-urgen-purple">
                {row.count}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-urgen-navy">{m.analyticsByStatus}</h3>
          <ul className="mt-4 space-y-2">
            {summary.byStatus.map((row) => (
              <li
                key={row.status}
                className="flex justify-between gap-2 border-b border-slate-100 py-2 last:border-0"
              >
                <span className="text-sm">
                  {statusLabels[row.status as keyof typeof statusLabels] ?? row.status}
                </span>
                <span className="text-sm font-semibold tabular-nums">{row.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-urgen-navy">{m.analyticsByAgeUnit}</h3>
          <ul className="mt-4 space-y-2">
            {summary.byAgeUnit.map((row) => (
              <li
                key={row.age_unit}
                className="flex justify-between gap-2 border-b border-slate-100 py-2 last:border-0"
              >
                <span className="text-sm">
                  {row.age_unit === 'days'
                    ? m.ageUnitDays
                    : row.age_unit === 'months'
                      ? m.ageUnitMonths
                      : m.ageUnitYears}
                </span>
                <span className="text-sm font-semibold tabular-nums">{row.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-bold text-urgen-navy">{m.analyticsRecent}</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2 pe-4">{m.colPatient}</th>
                <th className="py-2 pe-4">{m.colAge}</th>
                <th className="py-2 pe-4">{m.colTest}</th>
                <th className="py-2 pe-4">{m.colStatus}</th>
                <th className="py-2">{m.colDate}</th>
              </tr>
            </thead>
            <tbody>
              {summary.recent.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 pe-4 font-medium text-urgen-navy">{row.patient_full_name}</td>
                  <td className="py-2.5 pe-4">{ageLabel(row.age_value, row.age_unit, m)}</td>
                  <td className="py-2.5 pe-4">
                    {row.test_slug ? testTitle(row.test_slug) : '—'}
                  </td>
                  <td className="py-2.5 pe-4">
                    {statusLabels[row.status as keyof typeof statusLabels] ?? row.status}
                  </td>
                  <td className="py-2.5 tabular-nums" dir="ltr">
                    {row.created_at
                      ? new Date(row.created_at).toLocaleString(
                          locale === 'ar' ? 'ar-IQ' : 'en-US',
                          { dateStyle: 'medium', timeStyle: 'short' },
                        )
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-urgen-navy">{value}</p>
    </div>
  )
}
