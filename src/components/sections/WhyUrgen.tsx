import { useLocaleContext } from '../../i18n/useLocaleContext'
import { FeatureCard } from '../ui/FeatureCard'
import { SectionHeading } from '../ui/SectionHeading'

/** Eyebrow style: solid navy Arabic/English lead + gradient “URGEN” + punctuation (matches brand artwork). */
function WhyUrgenEyebrow({
  lead,
  punct,
  dir,
}: {
  lead: string
  punct: string
  dir: 'rtl' | 'ltr'
}) {
  return (
    <p
      className="mb-4 text-4xl font-semibold tracking-wide text-balance"
      dir={dir}
    >
      <span className="text-urgen-navy">{lead}</span>
      {/* dir=ltr isolates Latin wordmark so RTL پَرَنت does not reverse flex order (UR before GEN) */}
      <span
        dir="ltr"
        className="inline-flex flex-row flex-wrap items-baseline gap-0 [unicode-bidi:embed]"
      >
        <span className="bg-linear-to-r from-[#5896f3] to-[#0D47A1] bg-clip-text font-black text-transparent">
          UR
        </span>
        <span className="bg-linear-to-r from-[#0D47A1] to-[#bc2ee4] bg-clip-text font-normal text-transparent">
          GEN
        </span>
      </span> <span className="text-[#bc2ee4]">{punct}</span>
    </p>
  )
}

const icons = [
  <svg key="support" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>,
  <svg key="intl" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>,
  <svg key="fast" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>,
  <svg key="team" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>,
] as const

export function WhyUrgen() {
  const { locale, messages: m } = useLocaleContext()

  return (
    <section className="bg-urgen-sky-soft py-16 lg:py-24">
      <div className="container-urgen">
        <SectionHeading
          eyebrow={
            <WhyUrgenEyebrow
              lead={m.whyUrgen.eyebrowLead}
              punct={m.whyUrgen.eyebrowPunct}
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
            />
          }
          title={m.whyUrgen.title}
          subtitle={m.whyUrgen.subtitle}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {m.whyUrgen.items.map((item, i) => (
            <FeatureCard
              key={item.title}
              title={item.title}
              description={item.description}
              icon={icons[i]!}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
