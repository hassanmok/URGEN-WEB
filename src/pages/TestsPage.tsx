import { useTests } from '../hooks/useTests'
import { useLocaleContext } from '../i18n/useLocaleContext'
import { SectionHeading } from '../components/ui/SectionHeading'
import { TestCard } from '../components/ui/TestCard'

export function TestsPage() {
  const { tests, loading, error, usingFallback } = useTests()
  const { messages: m } = useLocaleContext()

  return (
    <div className="bg-white py-14 lg:py-20">
      <div className="container-urgen">
        <SectionHeading
          eyebrow={m.testsPage.eyebrow}
          title={m.testsPage.title}
          subtitle={m.testsPage.subtitle}
        />

        {usingFallback && !loading && (
          <p className="mx-auto mt-6 max-w-3xl rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-950">
            {m.testsPage.fallbackNotice}
          </p>
        )}

        {error && (
          <p className="mx-auto mt-6 max-w-3xl rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-900">
            {error}
          </p>
        )}

        {loading ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[360px] animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tests.map((t) => (
              <TestCard key={t.id} test={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
