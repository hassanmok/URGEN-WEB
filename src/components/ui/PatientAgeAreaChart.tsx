export type AgeChartPoint = { label: string; count: number }

export type AgeChartKpi = {
  value: string
  label: string
  color: string
}

type Props = {
  title: string
  kpis: AgeChartKpi[]
  points: AgeChartPoint[]
  emptyLabel?: string
}

const CHART_W = 560
const CHART_H = 220
const PAD_L = 44
const PAD_R = 16
const PAD_T = 12
const PAD_B = 36

function niceMax(n: number): number {
  if (n <= 0) return 5
  if (n <= 5) return 5
  const mag = 10 ** Math.floor(Math.log10(n))
  const step = n / mag <= 2 ? mag / 2 : mag
  return Math.ceil(n / step) * step
}

/** Smooth cubic path through normalized points (0–1). */
function smoothCurvePath(norm: { x: number; y: number }[]): string {
  if (norm.length === 0) return ''
  if (norm.length === 1) {
    const p = norm[0]
    return `M ${p.x} ${p.y} L ${p.x} ${p.y}`
  }

  const pts = norm.map((p) => ({ x: p.x, y: p.y }))
  let d = `M ${pts[0].x} ${pts[0].y}`

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(i + 2, pts.length - 1)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }

  return d
}

function toChartCoords(
  points: AgeChartPoint[],
  yMax: number,
): { x: number; y: number; label: string }[] {
  const innerW = CHART_W - PAD_L - PAD_R
  const innerH = CHART_H - PAD_T - PAD_B
  const n = points.length
  if (n === 0) return []

  return points.map((p, i) => {
    const x = PAD_L + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
    const y = PAD_T + innerH - (p.count / yMax) * innerH
    return { x, y, label: p.label }
  })
}

export function PatientAgeAreaChart({ title, kpis, points, emptyLabel }: Props) {
  const total = points.reduce((n, p) => n + p.count, 0)
  const maxCount = Math.max(...points.map((p) => p.count), 0)
  const yMax = niceMax(maxCount)

  const coords = toChartCoords(points, yMax)
  const innerH = CHART_H - PAD_T - PAD_B
  const baseline = PAD_T + innerH

  const norm = coords.map((c) => ({
    x: c.x,
    y: c.y,
    label: c.label,
  }))

  const linePath = smoothCurvePath(norm)
  const areaPath =
    linePath && norm.length > 0
      ? `${linePath} L ${norm[norm.length - 1].x} ${baseline} L ${norm[0].x} ${baseline} Z`
      : ''

  const yTicks = 5
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((yMax / yTicks) * i),
  )

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-bold text-urgen-navy">{title}</h3>

      {total === 0 ? (
        <p className="mt-6 text-sm text-slate-500">{emptyLabel ?? '—'}</p>
      ) : (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="text-center sm:text-start">
                <p className="text-2xl font-bold tabular-nums" style={{ color: kpi.color }}>
                  {kpi.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{kpi.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 overflow-x-auto">
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              className="w-full min-w-[320px] max-w-full"
              role="img"
              aria-label={title}
            >
              {tickValues.map((v) => {
                const y = PAD_T + innerH - (v / yMax) * innerH
                return (
                  <g key={v}>
                    <line
                      x1={PAD_L}
                      y1={y}
                      x2={CHART_W - PAD_R}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeWidth={1}
                    />
                    <text
                      x={PAD_L - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-slate-400 text-[10px]"
                    >
                      {v}
                    </text>
                  </g>
                )
              })}

              {areaPath && (
                <path d={areaPath} fill="#7c3aed" fillOpacity={0.35} stroke="none" />
              )}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {coords.map((c) => (
                <circle key={c.label} cx={c.x} cy={c.y} r={4} fill="#7c3aed" />
              ))}

              {coords.map((c) => (
                <text
                  key={`lbl-${c.label}`}
                  x={c.x}
                  y={CHART_H - 8}
                  textAnchor="middle"
                  className="fill-slate-600 text-[10px]"
                >
                  {c.label}
                </text>
              ))}
            </svg>
          </div>
        </>
      )}
    </section>
  )
}
