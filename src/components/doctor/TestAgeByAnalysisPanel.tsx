import { useMemo } from 'react'
import type { AgeGroupKey, TestAgeBreakdown } from '../../lib/doctorAnalytics'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'

const BAR_COLORS = ['#7c3aed', '#14b8a6', '#03a9f4', '#ec4899', '#f97316']

type Props = {
  title: string
  hint: string
  rows: TestAgeBreakdown[]
  ageGroupLabel: (group: AgeGroupKey) => string
  testTitle: (slug: string) => string
  patientsLabel: (n: number) => string
  formatAgeGroupLine: (ageLabel: string, count: number) => string
  animate: boolean
  emptyLabel: string
}

function TestAgeCard({
  row,
  index,
  ageGroupLabel,
  testTitle,
  patientsLabel,
  formatAgeGroupLine,
  animate,
}: {
  row: TestAgeBreakdown
  index: number
  ageGroupLabel: (group: AgeGroupKey) => string
  testTitle: (slug: string) => string
  patientsLabel: (n: number) => string
  formatAgeGroupLine: (ageLabel: string, count: number) => string
  animate: boolean
}) {
  const animatedTotal = useAnimatedNumber(row.totalPatients, { enabled: animate })

  const activeGroups = row.byAgeGroup.filter((g) => g.count > 0)
  const maxInTest = Math.max(...activeGroups.map((g) => g.count), 1)

  return (
    <article
      className="doctor-analytics-enter rounded-xl border border-slate-200 bg-slate-50/80 p-4"
      style={{ animationDelay: `${120 + index * 70}ms` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="font-bold text-urgen-navy">{testTitle(row.test_slug)}</h4>
        <span className="rounded-full bg-urgen-purple/15 px-3 py-1 text-xs font-semibold text-urgen-purple">
          {patientsLabel(animatedTotal)}
        </span>
      </div>

      <ul className="mt-4 space-y-3">
        {activeGroups.map((g, gi) => (
          <AgeGroupBar
            key={g.group}
            label={ageGroupLabel(g.group)}
            count={g.count}
            max={maxInTest}
            color={BAR_COLORS[gi % BAR_COLORS.length]}
            formatAgeGroupLine={formatAgeGroupLine}
            ageLabel={ageGroupLabel(g.group)}
            animate={animate}
            delayMs={180 + index * 70 + gi * 50}
          />
        ))}
      </ul>
    </article>
  )
}

function AgeGroupBar({
  label,
  count,
  max,
  color,
  formatAgeGroupLine,
  ageLabel,
  animate,
  delayMs,
}: {
  label: string
  count: number
  max: number
  color: string
  formatAgeGroupLine: (ageLabel: string, count: number) => string
  ageLabel: string
  animate: boolean
  delayMs: number
}) {
  const animatedCount = useAnimatedNumber(count, { enabled: animate })
  const pct = max > 0 ? (count / max) * 100 : 0

  return (
    <li className="doctor-analytics-enter" style={{ animationDelay: `${delayMs}ms` }}>
      <p className="text-sm font-medium text-slate-700">
        {formatAgeGroupLine(ageLabel, animatedCount)}
      </p>
      <div
        className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-200"
        title={`${label}: ${count}`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: animate ? `${pct}%` : '0%',
            backgroundColor: color,
            transitionDelay: animate ? `${delayMs}ms` : '0ms',
          }}
        />
      </div>
    </li>
  )
}

export function TestAgeByAnalysisPanel({
  title,
  hint,
  rows,
  ageGroupLabel,
  testTitle,
  patientsLabel,
  formatAgeGroupLine,
  animate,
  emptyLabel,
}: Props) {
  const sorted = useMemo(() => rows.filter((r) => r.totalPatients > 0), [rows])

  return (
    <section className="doctor-analytics-enter rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-bold text-urgen-navy">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>

      {sorted.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {sorted.map((row, index) => (
            <TestAgeCard
              key={row.test_slug}
              row={row}
              index={index}
              ageGroupLabel={ageGroupLabel}
              testTitle={testTitle}
              patientsLabel={patientsLabel}
              formatAgeGroupLine={formatAgeGroupLine}
              animate={animate}
            />
          ))}
        </div>
      )}
    </section>
  )
}
