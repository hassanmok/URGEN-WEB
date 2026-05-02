type SectionHeadingProps = {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'center' | 'start'
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
}: SectionHeadingProps) {
  const alignClass = align === 'center' ? 'mx-auto text-center' : 'text-start'

  return (
    <div className={`max-w-3xl ${alignClass}`}>
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-urgen-purple">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-bold text-urgen-navy sm:text-3xl">{title}</h2>
      {subtitle && (
        <p className="mt-3 text-base leading-relaxed text-slate-600">{subtitle}</p>
      )}
    </div>
  )
}
