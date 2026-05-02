import { PricingTable } from '../components/ui/PricingTable'
import { SectionHeading } from '../components/ui/SectionHeading'
import { FeatureBar } from '../components/sections/FeatureBar'
import { HeroSection } from '../components/sections/HeroSection'
import { TestsPreview } from '../components/sections/TestsPreview'
import { WhyUrgen } from '../components/sections/WhyUrgen'
import { CtaBanner } from '../components/sections/CtaBanner'
import { useLocaleContext } from '../i18n/useLocaleContext'
import { usePricingTiers } from '../i18n/usePricingTiers'

export function HomePage() {
  const { messages: m } = useLocaleContext()
  const pricingTiers = usePricingTiers()

  return (
    <>
      <HeroSection />
      <FeatureBar />
      <WhyUrgen />
      <TestsPreview />
      <CtaBanner />
      <section className="bg-slate-50 py-16 lg:py-24">
        <div className="container-urgen">
          <SectionHeading
            eyebrow={m.home.pricingEyebrow}
            title={m.home.pricingTitle}
            subtitle={m.home.pricingSubtitle}
          />
          <div className="mt-12">
            <PricingTable tiers={pricingTiers} />
          </div>
        </div>
      </section>
    </>
  )
}
