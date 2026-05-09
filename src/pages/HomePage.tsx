import { FeatureBar } from '../components/sections/FeatureBar'
import { HeroSection } from '../components/sections/HeroSection'
import { TestsPreview } from '../components/sections/TestsPreview'
import { WhyUrgen } from '../components/sections/WhyUrgen'
import { CtaBanner } from '../components/sections/CtaBanner'

export function HomePage() {
  return (
    <>
      <HeroSection />
      <FeatureBar />
      <WhyUrgen />
      <TestsPreview />
      <CtaBanner />
    </>
  )
}
