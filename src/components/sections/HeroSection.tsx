import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import { pickLocale, useSiteContent } from '../../i18n/useSiteContent'
import { Button } from '../ui/Button'

const HERO_VIDEO = '/genetic.mp4'

export function HeroSection() {
  const { locale } = useLocaleContext()
  const { content } = useSiteContent()
  const hero = pickLocale(content.hero, locale)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)

  const markVideoReady = useCallback(() => {
    setVideoReady(true)
  }, [])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      markVideoReady()
    }
  }, [markVideoReady])

  useEffect(() => {
    if (!videoReady) return
    const el = videoRef.current
    if (!el) return
    void el.play().catch(() => {
      /* سياسات التشغيل التلقائي قد تمنع التشغيل حتى مع muted */
    })
  }, [videoReady])

  /** Logical alignment: `start` = right in RTL (Arabic), left in LTR (English) — same pattern as English. */
  const blockAlign = 'max-w-3xl self-start text-start'

  return (
    <section
      className="relative min-h-[min(92vh,820px)] overflow-hidden"
      aria-busy={!videoReady}
    >
      {!videoReady && (
        <div
          className="absolute inset-0 z-0 animate-pulse bg-slate-100"
          aria-hidden
        />
      )}
      <video
        ref={videoRef}
        className={`absolute inset-0 z-[1] h-full w-full scale-[1.01] object-cover object-[65%_center] transition-opacity duration-0 sm:object-center ${
          videoReady ? 'opacity-100' : 'opacity-0'
        }`}
        src={HERO_VIDEO}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
        onCanPlayThrough={markVideoReady}
        onLoadedData={(e) => {
          if (e.currentTarget.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
            markVideoReady()
          }
        }}
      />
      {/* التدرج الداكن يظهر فقط بعد جاهزية الفيديو حتى يُرى skeleton التحميل */}
      {videoReady && (
        <>
          <div
            className="absolute inset-0 z-[2] bg-[linear-gradient(105deg,rgba(15,23,42,0.94)_0%,rgba(26,35,126,0.72)_38%,rgba(79,70,229,0.22)_72%,transparent_100%)]"
            aria-hidden
          />
          <div
            className="absolute inset-0 z-[2] bg-linear-to-b from-transparent via-transparent to-urgen-navy/50"
            aria-hidden
          />
        </>
      )}

      <div className="container-urgen relative z-[3] flex min-h-[min(92vh,820px)] flex-col justify-center py-20 lg:py-28">
        <div className={blockAlign}>
          <h1
            className={`mt-4 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl ${
              videoReady ? 'text-white drop-shadow-sm' : 'text-urgen-navy'
            }`}
          >
            {hero.title}
          </h1>
          <p
            className={`mt-6 text-lg leading-relaxed sm:text-xl ${
              videoReady ? 'text-slate-100/95' : 'text-slate-600'
            }`}
          >
            {hero.subtitle}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/tests">
              <Button
                variant="outline"
                className={
                  videoReady
                    ? 'border-white/50 bg-white/10 text-black backdrop-blur hover:bg-white/20'
                    : ''
                }
              >
                {hero.browseTests}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
