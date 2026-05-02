import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { LocaleContext, type LocaleContextValue } from './locale-context'
import { messages, type Locale } from './messages'
import type { Messages } from './messages'

const STORAGE_KEY = 'urgen-locale'

function readStoredLocale(): Locale | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'ar' || raw === 'en') return raw
  } catch {
    /* ignore */
  }
  return null
}

function applyDocumentLocale(locale: Locale, meta: Messages['meta']) {
  document.documentElement.lang = locale === 'ar' ? 'ar' : 'en'
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  document.title = meta.title
  const desc = document.querySelector('meta[name="description"]')
  if (desc) desc.setAttribute('content', meta.description)
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale() ?? 'ar')

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
    applyDocumentLocale(next, messages[next].meta)
  }, [])

  useEffect(() => {
    applyDocumentLocale(locale, messages[locale].meta)
  }, [locale])

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      messages: messages[locale],
    }),
    [locale, setLocale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
