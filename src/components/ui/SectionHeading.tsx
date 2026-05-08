import type { ReactNode } from 'react'

const defaultEyebrowClass =
  'mb-2 text-sm font-semibold uppercase tracking-wide text-urgen-purple'

type SectionHeadingProps = {
  eyebrow?: string | ReactNode
  /** When `eyebrow` is a string, replaces default eyebrow typography/color classes. */
  eyebrowClassName?: string
  title: string
  subtitle?: string
  align?: 'center' | 'start'
}

export function SectionHeading({
  eyebrow,
  eyebrowClassName,
  title,
  subtitle,
  align = 'center',
}: SectionHeadingProps) {
  const alignClass = align === 'center' ? 'mx-auto text-center' : 'text-start'

  return (
    <div className={`max-w-3xl ${alignClass}`}>
      {eyebrow != null && (
        typeof eyebrow === 'string' ? (
          <p className={eyebrowClassName ?? defaultEyebrowClass}>{eyebrow}</p>
        ) : (
          eyebrow
        )
      )}
      <h2 className="text-2xl font-bold text-urgen-navy sm:text-xl">{title}</h2>
      {subtitle && (
        <p className="mt-2 text-base leading-relaxed text-slate-600">{subtitle}</p>
      )}
    </div>
  )
}
