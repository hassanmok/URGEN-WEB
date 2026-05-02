import { Link } from 'react-router-dom'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import type { PricingTier } from '../../types/pricing'
import { Button } from './Button'

type PricingTableProps = {
  tiers: PricingTier[]
}

export function PricingTable({ tiers }: PricingTableProps) {
  const { locale, messages: m } = useLocaleContext()
  const fmt = new Intl.NumberFormat(locale === 'ar' ? 'ar-IQ' : 'en-US')

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {tiers.map((tier) => (
        <article
          key={tier.id}
          className={`relative flex flex-col rounded-2xl border p-6 shadow-sm transition ${
            tier.highlighted
              ? 'border-urgen-purple bg-gradient-to-b from-white to-urgen-sky-soft shadow-lg ring-2 ring-urgen-purple/30'
              : 'border-slate-100 bg-white hover:shadow-md'
          }`}
        >
          {tier.highlighted && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-l from-urgen-purple to-urgen-magenta px-3 py-1 text-xs font-bold text-white">
              {m.pricing.badge}
            </span>
          )}
          <h3 className="text-xl font-bold text-urgen-navy">{tier.name}</h3>
          <p className="mt-2 text-sm text-slate-600">{tier.description}</p>
          <p className="mt-6 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-urgen-navy">
              {fmt.format(tier.priceIqd)}
            </span>
            <span className="text-sm font-medium text-slate-500">{m.pricing.currency}</span>
          </p>
          <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-700">
            {tier.features.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-urgen-sky" aria-hidden />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Link to="/book" className="mt-8">
            <Button className="w-full" variant={tier.highlighted ? 'primary' : 'secondary'}>
              {m.pricing.choosePlan}
            </Button>
          </Link>
        </article>
      ))}
    </div>
  )
}
