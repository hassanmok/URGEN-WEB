import { Link } from 'react-router-dom'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import { Button } from '../ui/Button'

/** صورة الهوية — مساحة داكنة على جانب النص */
const HERO_IMAGE = '/hero-banner.png'

export function HeroSection() {
  const { messages: m } = useLocaleContext()

  /** Logical alignment: `start` = right in RTL (Arabic), left in LTR (English) — same pattern as English. */
  const blockAlign = 'max-w-3xl self-start text-start'

  return (
    <section className="relative min-h-[min(92vh,820px)] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-position-[65%_center] sm:bg-center"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        aria-hidden
      />
      {/* تدرج يغمّق الجانب الأيسر (حيث النص) ويُبقي الجانب الأيمن أوضح للحمض النووي */}
      <div
        className="absolute inset-0 bg-[linear-gradient(105deg,rgba(15,23,42,0.94)_0%,rgba(26,35,126,0.72)_38%,rgba(79,70,229,0.22)_72%,transparent_100%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-urgen-navy/50"
        aria-hidden
      />

      <div className="container-urgen relative flex min-h-[min(92vh,820px)] flex-col justify-center py-20 lg:py-28">
        <div className={blockAlign}>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
            {m.hero.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-100/95 sm:text-xl">{m.hero.subtitle}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/tests">
              <Button
                variant="outline"
                className="border-white/50 bg-white/10 text-black backdrop-blur hover:bg-white/20"
              >
                {m.hero.browseTests}
              </Button>
            </Link>
            <Link to="/book">
              <Button>{m.hero.bookNow}</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
