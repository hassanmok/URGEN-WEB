import { createContext } from 'react'
import type { Locale, Messages } from './messages'

export type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  messages: Messages
}

export const LocaleContext = createContext<LocaleContextValue | null>(null)
