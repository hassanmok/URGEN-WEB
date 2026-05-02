import { Link } from 'react-router-dom'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import { Button } from '../ui/Button'

export function CtaBanner() {
  const { messages: m } = useLocaleContext()

  return (
    <section className="relative overflow-hidden bg-urgen-navy py-16 text-white lg:py-20">
      <div
        className="pointer-events-none absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-urgen-purple/40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-urgen-sky/25 blur-3xl"
        aria-hidden
      />
      <svg
        className="pointer-events-none absolute left-8 top-8 h-40 w-40 opacity-20"
        viewBox="0 0 100 100"
        aria-hidden
      >
        <path
          d="M20 80c15-25 30-35 50-35s35 10 50 35"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M20 20c15 25 30 35 50 35s35-10 50-35"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
        />
      </svg>

      <div className="container-urgen relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-extrabold leading-snug sm:text-3xl">{m.cta.title}</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-200">{m.cta.subtitle}</p>
        </div>
        <Link to="/book">
          <Button className="shadow-xl shadow-black/20">{m.cta.button}</Button>
        </Link>
      </div>
    </section>
  )
}
