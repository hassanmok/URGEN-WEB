import { PricingTable } from '../components/ui/PricingTable'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useLocaleContext } from '../i18n/useLocaleContext'
import { usePricingTiers } from '../i18n/usePricingTiers'

export function PricesPage() {
  const { messages: m } = useLocaleContext()
  const pricingTiers = usePricingTiers()

  return (
    <div className="bg-gradient-to-b from-white to-slate-50 py-14 lg:py-20">
      <div className="container-urgen">
        <SectionHeading
          eyebrow={m.pricesPage.eyebrow}
          title={m.pricesPage.title}
          subtitle={m.pricesPage.subtitle}
        />
        <div className="mt-12">
          <PricingTable tiers={pricingTiers} />
        </div>

        <div className="mt-16 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:p-10">
          <h2 className="text-xl font-bold text-urgen-navy">{m.pricesPage.faqTitle}</h2>
          <dl className="mt-6 space-y-6">
            <div>
              <dt className="font-semibold text-slate-800">{m.pricesPage.faq1q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-600">{m.pricesPage.faq1a}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-800">{m.pricesPage.faq2q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-600">{m.pricesPage.faq2a}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
