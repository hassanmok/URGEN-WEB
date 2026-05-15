import { useLocaleContext } from '../i18n/useLocaleContext'
import { pickLocale, useSiteContent } from '../i18n/useSiteContent'
import { SectionHeading } from '../components/ui/SectionHeading'
import { FeatureCard } from '../components/ui/FeatureCard'

const valueIcons = [
  <svg key="v1" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
  </svg>,
  <svg key="v2" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>,
  <svg key="v3" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>,
] as const

export function AboutPage() {
  const { locale } = useLocaleContext()
  const { content } = useSiteContent()
  const about = pickLocale(content.about, locale)
  const proseAlign = locale === 'ar' ? 'text-right' : 'text-left'

  return (
    <div className="bg-white py-14 lg:py-20">
      <div className="container-urgen">
        <SectionHeading eyebrow={about.eyebrow} title={about.title} subtitle={about.subtitle} />

        <div
          className={`mx-auto mt-12 max-w-3xl space-y-4 text-base leading-relaxed text-slate-600 ${proseAlign}`}
        >
          <p>{about.p1}</p>
          <p>{about.p2}</p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {about.values.map((v, i) => (
            <FeatureCard
              key={v.title}
              title={v.title}
              description={v.description}
              icon={valueIcons[i]!}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
