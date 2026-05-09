import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import { Logo } from '../Logo'
import { Button } from '../ui/Button'
import { LanguageSwitcher } from './LanguageSwitcher'
import { SearchBar } from './SearchBar'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [portalReady, setPortalReady] = useState(false)
  const [overlayEntered, setOverlayEntered] = useState(false)
  const { pathname } = useLocation()
  const { messages: m } = useLocaleContext()

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    setSearchOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!searchOpen) {
      setOverlayEntered(false)
      return
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setOverlayEntered(true))
    })
    return () => cancelAnimationFrame(id)
  }, [searchOpen])

  useEffect(() => {
    if (!searchOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searchOpen])

  /** منع تمرير الصفحة خلف طبقة البحث (سطح المكتب فقط) */
  useEffect(() => {
    if (!searchOpen || typeof window === 'undefined') return
    const mq = window.matchMedia('(min-width: 768px)')
    if (!mq.matches) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [searchOpen])

  const links = [
    { to: '/', label: m.nav.home },
    { to: '/tests', label: m.nav.tests },
    { to: '/technology', label: m.nav.technology },
    { to: '/about', label: m.nav.about },
    { to: '/contact', label: m.nav.contact },
  ]

  const desktopSearchOverlay =
    portalReady &&
    searchOpen &&
    typeof document !== 'undefined' &&
    createPortal(
      <>
        {/* تعتيم المحتوى أسفل الهيدر — أسلوب مشابه لمواقع مثل Blueprint Genetics */}
        <div
          role="presentation"
          aria-hidden
          className={[
            'fixed inset-x-0 bottom-0 z-[70] hidden bg-slate-900/45 backdrop-blur-[2px] transition-opacity duration-500 ease-out md:block',
            'top-24 lg:top-[5.5rem]',
            overlayEntered ? 'pointer-events-auto cursor-pointer opacity-100' : 'pointer-events-none opacity-0',
          ].join(' ')}
          onClick={() => setSearchOpen(false)}
        />
        {/* شريط بحث بعرض الشاشة أسفل الشريط العلوي */}
        <div
          id="nav-search-panel"
          role="search"
          aria-hidden={!overlayEntered}
          className={[
            'fixed inset-x-0 z-[75] hidden border-b border-slate-200 bg-white shadow-xl transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:block',
            'top-24 lg:top-[5.5rem]',
            overlayEntered
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none -translate-y-4 opacity-0',
            'motion-reduce:transition-opacity motion-reduce:duration-300',
          ].join(' ')}
        >
          <div className="container-urgen px-4 py-6 md:px-6">
            <SearchBar
              layout="overlay"
              className="mx-auto max-w-3xl"
              autoFocus={overlayEntered}
              onNavigate={() => {
                setSearchOpen(false)
                setOpen(false)
              }}
            />
          </div>
        </div>
      </>,
      document.body,
    )

  return (
    <header className="sticky top-0 z-[80] border-b border-slate-100/80 bg-white/95 backdrop-blur-md relative">
      <div className="container-urgen flex h-24 items-center justify-between gap-3 lg:h-[5.5rem] lg:gap-4">
        <Link
          to="/"
          className="min-w-0 shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-urgen-purple/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          onClick={() => setOpen(false)}
        >
          <Logo />
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex lg:justify-start lg:gap-1 xl:flex-none xl:justify-start"
          aria-label={m.nav.main}
        >
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-lg px-5 py-4 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-urgen-purple/10 text-urgen-purple'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-urgen-navy'
                }`
              }
              end={l.to === '/'}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className={`hidden rounded-lg p-2 md:inline-flex ${
              searchOpen ? 'bg-slate-100 text-urgen-navy' : 'text-urgen-navy hover:bg-slate-100'
            }`}
            aria-expanded={searchOpen}
            aria-controls="nav-search-panel"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <span className="sr-only">
              {searchOpen ? m.searchPage.closeOverlay : m.searchPage.ariaSearch}
            </span>
            {searchOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </button>
          <LanguageSwitcher />
          <Link to="/book" className="hidden sm:inline-flex">
            <Button className="px-4 py-2 text-sm">{m.nav.book}</Button>
          </Link>
          <button
            type="button"
            className="inline-flex rounded-lg p-2 text-urgen-navy hover:bg-slate-100 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{m.nav.menu}</span>
            {open ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {desktopSearchOverlay}

      {open && (
        <div
          id="mobile-nav"
          className="border-t border-slate-100 bg-white px-4 py-4 md:hidden"
        >
          <SearchBar className="mb-4 w-full" onNavigate={() => setOpen(false)} />
          <nav className="flex flex-col gap-1" aria-label={m.nav.mobile}>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 text-base font-semibold ${
                    isActive ? 'bg-urgen-purple/10 text-urgen-purple' : 'text-slate-700'
                  }`
                }
                end={l.to === '/'}
              >
                {l.label}
              </NavLink>
            ))}
            <Link to="/book" onClick={() => setOpen(false)} className="mt-2">
              <Button className="w-full">{m.nav.book}</Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
