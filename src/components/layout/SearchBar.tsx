import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLocaleContext } from '../../i18n/useLocaleContext'

type SearchBarProps = {
  className?: string
  autoFocus?: boolean
  /** inline = compact in nav; overlay = centered modal-style bar */
  layout?: 'inline' | 'overlay'
  onNavigate?: () => void
}

function SearchIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  )
}

export function SearchBar({ className = '', autoFocus, layout = 'inline', onNavigate }: SearchBarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { messages: m } = useLocaleContext()
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (location.pathname === '/search') {
      setValue(params.get('q') ?? '')
    }
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!autoFocus || !inputRef.current) return
    requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true })
    })
  }, [autoFocus])

  function submit(e: FormEvent) {
    e.preventDefault()
    const q = value.trim()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
    onNavigate?.()
  }

  const isOverlay = layout === 'overlay'

  const shellClass = isOverlay
    ? 'rounded-full border border-slate-200/90 bg-white/95 py-2 ps-5 pe-2 shadow-[0_16px_48px_-20px_rgba(26,35,126,0.35)] backdrop-blur-md sm:py-2.5 sm:ps-6'
    : 'rounded-full border border-slate-200 bg-white py-1.5 ps-4 pe-1.5 shadow-sm'

  const inputClass = isOverlay
    ? 'min-w-0 flex-1 border-0 bg-transparent py-3 text-base text-urgen-navy placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:text-lg sm:py-3.5'
    : 'min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-urgen-navy placeholder:text-slate-400 focus:outline-none focus:ring-0'

  const submitClass = isOverlay
    ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-l from-urgen-purple to-urgen-magenta text-white shadow-md transition hover:brightness-105 active:scale-95 sm:h-12 sm:w-12'
    : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-l from-urgen-purple to-urgen-magenta text-white transition hover:brightness-105 active:scale-95'

  return (
    <form onSubmit={submit} className={className}>
      <div
        className={`flex items-center gap-2 transition focus-within:border-urgen-purple/40 focus-within:ring-2 focus-within:ring-urgen-purple/20 ${shellClass}`}
      >
        <span className="shrink-0 text-slate-400" aria-hidden>
          <SearchIcon className={isOverlay ? 'h-5 w-5 sm:h-6 sm:w-6' : 'h-4 w-4'} />
        </span>
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={m.searchPage.placeholder}
          aria-label={m.searchPage.ariaSearch}
          autoComplete="off"
          className={inputClass}
        />
        <button type="submit" className={submitClass} aria-label={m.searchPage.submitLabel}>
          <svg className={isOverlay ? 'h-5 w-5' : 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </form>
  )
}
