import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLocaleContext } from '../../i18n/useLocaleContext'

type SearchBarProps = {
  className?: string
  autoFocus?: boolean
  /** شريط بحث كبير يُستخدم في الطبقة العلوية (مثل مواقع التشخيص الجيني) */
  layout?: 'inline' | 'overlay'
  /** يُستدعى بعد التوجيه إلى صفحة البحث (مثلاً لإغلاق قائمة الجوال) */
  onNavigate?: () => void
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
  const inputClass = isOverlay
    ? 'min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-base text-urgen-navy shadow-inner placeholder:text-slate-400 focus:border-urgen-purple focus:bg-white focus:outline-none focus:ring-2 focus:ring-urgen-purple/25'
    : 'min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-urgen-navy placeholder:text-slate-400 focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/25'
  const btnClass = isOverlay
    ? 'shrink-0 rounded-2xl bg-urgen-purple px-8 py-3.5 text-base font-semibold text-white transition hover:bg-urgen-purple/90'
    : 'shrink-0 rounded-xl bg-urgen-purple px-3 py-2 text-sm font-semibold text-white transition hover:bg-urgen-purple/90'

  return (
    <form onSubmit={submit} className={`flex gap-3 ${className}`}>
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
      <button type="submit" className={btnClass}>
        {m.searchPage.submitLabel}
      </button>
    </form>
  )
}
