import { useCallback, useEffect, useState } from 'react'
import type { NewsCarouselSlide } from '../../lib/newsFormat'

type Props = {
  slides: NewsCarouselSlide[]
  prevLabel: string
  nextLabel: string
  autoPlayMs?: number
  className?: string
}

export function ImageCarousel({
  slides,
  prevLabel,
  nextLabel,
  autoPlayMs = 6000,
  className = '',
}: Props) {
  const [index, setIndex] = useState(0)
  const count = slides.length

  const go = useCallback(
    (next: number) => {
      if (count <= 0) return
      setIndex(((next % count) + count) % count)
    },
    [count],
  )

  useEffect(() => {
    setIndex(0)
  }, [slides])

  useEffect(() => {
    if (count <= 1 || !autoPlayMs) return
    const id = window.setInterval(() => go(index + 1), autoPlayMs)
    return () => window.clearInterval(id)
  }, [count, autoPlayMs, go, index])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') go(index - 1)
      if (e.key === 'ArrowRight') go(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, index])

  if (count === 0) {
    return (
      <div
        className={`flex aspect-[21/9] min-h-[220px] items-center justify-center bg-gradient-to-br from-urgen-purple/10 via-urgen-sky-soft/40 to-slate-50 ${className}`}
        aria-hidden
      />
    )
  }

  const current = slides[index]!

  return (
    <div
      className={`group relative overflow-hidden bg-slate-900 ${className}`}
      dir="ltr"
      role="region"
      aria-roledescription="carousel"
      aria-label={current.alt}
    >
      <div className="relative aspect-[21/9] min-h-[220px] w-full sm:min-h-[280px] lg:min-h-[360px]">
        {slides.map((slide, i) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-500 ease-out ${
              i === index ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={i !== index}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              className="h-full w-full object-contain"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}

        {current.caption && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-6 pb-10 pt-16 sm:px-10">
            <p className="max-w-3xl text-sm text-white/95 sm:text-base" dir="auto">
              {current.caption}
            </p>
          </div>
        )}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-urgen-navy shadow-md transition hover:bg-white sm:left-5 sm:h-12 sm:w-12"
            aria-label={prevLabel}
          >
            <ChevronIcon dir="prev" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-urgen-navy shadow-md transition hover:bg-white sm:right-5 sm:h-12 sm:w-12"
            aria-label={nextLabel}
          >
            <ChevronIcon dir="next" />
          </button>

          <ol className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((slide, i) => (
              <li key={slide.src}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    i === index ? 'bg-white scale-110' : 'bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`${i + 1} / ${count}`}
                  aria-current={i === index ? 'true' : undefined}
                />
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}

function ChevronIcon({ dir }: { dir: 'prev' | 'next' }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      {dir === 'prev' ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      )}
    </svg>
  )
}
