import type { ReactNode } from 'react'

type FeatureCardProps = {
  icon: ReactNode
  title: string
  description: string
  className?: string
}

export function FeatureCard({ icon, title, description, className = '' }: FeatureCardProps) {
  return (
    <article
      className={`rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_12px_40px_-24px_rgba(26,35,126,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-28px_rgba(123,31,162,0.35)] ${className}`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-urgen-purple/15 to-urgen-sky/20 text-urgen-purple">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-urgen-navy">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
    </article>
  )
}
