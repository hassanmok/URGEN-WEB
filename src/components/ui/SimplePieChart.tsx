type Slice = {
  label: string
  count: number
  color: string
}

type Props = {
  title: string
  slices: Slice[]
  emptyLabel?: string
  size?: number
  animate?: boolean
  className?: string
}

function buildConicGradient(slices: Slice[], total: number): string {
  if (total <= 0) return 'conic-gradient(#e2e8f0 0deg 360deg)'
  let deg = 0
  const stops: string[] = []
  for (const s of slices) {
    if (s.count <= 0) continue
    const span = (s.count / total) * 360
    const end = deg + span
    stops.push(`${s.color} ${deg}deg ${end}deg`)
    deg = end
  }
  if (stops.length === 0) return 'conic-gradient(#e2e8f0 0deg 360deg)'
  return `conic-gradient(${stops.join(', ')})`
}

export function SimplePieChart({
  title,
  slices,
  emptyLabel,
  size = 200,
  animate = false,
  className = '',
}: Props) {
  const total = slices.reduce((n, s) => n + s.count, 0)
  const active = slices.filter((s) => s.count > 0)

  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <h3 className="font-bold text-urgen-navy">{title}</h3>

      {total === 0 ? (
        <p className="mt-6 text-sm text-slate-500">{emptyLabel ?? '—'}</p>
      ) : (
        <>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {active.map((s, i) => {
              const pct = Math.round((s.count / total) * 100)
              return (
                <li
                  key={s.label}
                  className={`flex items-center gap-2 text-sm text-slate-700 ${animate ? 'doctor-analytics-enter' : ''}`}
                  style={animate ? { animationDelay: `${80 + i * 60}ms` } : undefined}
                >
                  <span
                    className="inline-block size-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: s.color }}
                    aria-hidden
                  />
                  <span>
                    {s.label}{' '}
                    <span className="font-semibold tabular-nums text-urgen-navy">
                      ({pct}%)
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>

          <div className="mt-6 flex justify-center">
            <div
              className={`rounded-full shadow-inner ${animate ? 'doctor-analytics-pie' : ''}`}
              style={{
                width: size,
                height: size,
                background: buildConicGradient(slices, total),
              }}
              role="img"
              aria-label={active
                .map((s) => `${s.label}: ${Math.round((s.count / total) * 100)}%`)
                .join(', ')}
            />
          </div>
        </>
      )}
    </section>
  )
}
