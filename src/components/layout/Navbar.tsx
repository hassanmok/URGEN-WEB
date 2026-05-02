import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import { Logo } from '../Logo'
import { Button } from '../ui/Button'
import { LanguageSwitcher } from './LanguageSwitcher'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const { messages: m } = useLocaleContext()

  const links = [
    { to: '/', label: m.nav.home },
    { to: '/tests', label: m.nav.tests },
    { to: '/prices', label: m.nav.prices },
    { to: '/about', label: m.nav.about },
    { to: '/contact', label: m.nav.contact },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100/80 bg-white/90 backdrop-blur-md">
      <div className="container-urgen flex h-16 items-center justify-between gap-4 lg:h-[4.25rem]">
        <Link
          to="/"
          className="min-w-0 shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-urgen-purple/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          onClick={() => setOpen(false)}
        >
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label={m.nav.main}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-semibold transition ${
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

        <div className="flex items-center gap-2">
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

      {open && (
        <div
          id="mobile-nav"
          className="border-t border-slate-100 bg-white px-4 py-4 md:hidden"
        >
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
