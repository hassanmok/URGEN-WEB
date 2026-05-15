import { useContext } from 'react'
import { SiteContentContext } from './SiteContentProvider'
import type { Locale } from './messages'

export function useSiteContent() {
  const ctx = useContext(SiteContentContext)
  if (!ctx) {
    throw new Error('useSiteContent must be used within SiteContentProvider')
  }
  return ctx
}

export function pickLocale<T>(block: { ar: T; en: T }, locale: Locale): T {
  return locale === 'ar' ? block.ar : block.en
}
