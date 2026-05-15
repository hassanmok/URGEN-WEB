import type { ReactNode } from 'react'

export const sectionEyebrowClass =
  'mb-2 text-2xl font-bold tracking-wide text-[#a028c1] sm:mb-3 sm:text-3xl lg:text-4xl normal-case'

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
          <p className={eyebrowClassName ?? sectionEyebrowClass}>{eyebrow}</p>
        ) : (
          eyebrow
        )
      )}
      <h2 className="text-xl font-bold leading-snug text-urgen-navy sm:text-2xl lg:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">{subtitle}</p>
      )}
    </div>
  )
}
