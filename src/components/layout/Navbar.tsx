import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import { Logo } from '../Logo'
import { LanguageSwitcher } from './LanguageSwitcher'
import { SearchBar } from './SearchBar'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [portalReady, setPortalReady] = useState(false)
  const [overlayEntered, setOverlayEntered] = useState(false)
  const { pathname } = useLocation()
  const { messages: m, locale } = useLocaleContext()
  const isArabic = locale === 'ar'

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

  const links: Array<
    | { kind: 'internal'; to: string; label: string }
    | { kind: 'external'; href: string; label: string }
  > = [
    { kind: 'internal', to: '/', label: m.nav.home },
    { kind: 'internal', to: '/tests', label: m.nav.tests },
    { kind: 'external', href: 'https://genome.urgenlab.com/', label: m.nav.genome },
    { kind: 'internal', to: '/technology', label: m.nav.technology },
    { kind: 'internal', to: '/about', label: m.nav.about },
    { kind: 'internal', to: '/events', label: m.nav.events },
    { kind: 'internal', to: '/news', label: m.nav.news },
    { kind: 'internal', to: '/contact', label: m.nav.contact },
  ]

  const navItemClass =
    'rounded-lg px-5 py-4 text-sm font-semibold transition text-slate-600 hover:bg-slate-50 hover:text-urgen-navy'

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
          {links.map((l) =>
            l.kind === 'external' && l.href.includes('genome') ? (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="genome-banner genome-chip relative mx-1 inline-flex items-center gap-1.5 overflow-hidden rounded-full py-1 pl-2 pr-4 transition-transform duration-300 hover:scale-[1.05]"
              >
                <img
                  src="/images/genome-dna.png"
                  alt=""
                  aria-hidden
                  className="genome-dna relative z-10 h-9 w-9 shrink-0 object-contain drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]"
                />
                <span
                  className={`relative z-10 font-bold text-white drop-shadow-[0_1px_6px_rgba(255,255,255,0.4)] ${
                    isArabic ? 'font-sans text-sm' : 'font-serif text-sm uppercase tracking-[0.14em]'
                  }`}
                >
                  {l.label}
                </span>
              </a>
            ) : l.kind === 'external' ? (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className={navItemClass}
              >
                {l.label}
              </a>
            ) : (
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
            ),
          )}
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
            {links.map((l) =>
              l.kind === 'external' && l.href.includes('genome') ? (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="genome-banner my-1 flex items-center gap-2 overflow-hidden rounded-2xl px-3 py-2 shadow-lg shadow-purple-900/30"
                >
                  <img
                    src="/images/genome-dna.png"
                    alt=""
                    aria-hidden
                    className="genome-dna relative z-10 h-14 w-14 shrink-0 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
                  />
                  <span
                    className={`relative z-10 min-w-0 flex-1 text-center font-bold text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)] ${
                      isArabic
                        ? 'font-sans text-2xl'
                        : 'font-serif text-3xl uppercase tracking-[0.12em]'
                    }`}
                  >
                    {l.label}
                  </span>
                  <span className="genome-cta relative z-10 shrink-0 rounded-full bg-gradient-to-b from-white to-cyan-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-purple-700">
                    {m.nav.genomeCta}
                  </span>
                </a>
              ) : l.kind === 'external' ? (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-base font-semibold text-slate-700"
                >
                  {l.label}
                </a>
              ) : (
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
              ),
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
