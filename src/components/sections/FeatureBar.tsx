import { useLocaleContext } from '../../i18n/useLocaleContext'
import { FeatureCard } from '../ui/FeatureCard'

const icons = [
  <svg key="tech" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>,
  <svg key="acc" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
  </svg>,
  <svg key="priv" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
    />
  </svg>,
  <svg key="price" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>,
] as const

export function FeatureBar() {
  const { messages: m } = useLocaleContext()

  return (
    <div className="relative z-10 -mt-16 lg:-mt-20">
      <div className="container-urgen">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {m.featureBar.map((item, i) => (
            <FeatureCard
              key={item.title}
              title={item.title}
              description={item.description}
              icon={icons[i]!}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
