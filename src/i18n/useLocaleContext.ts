import { useContext } from 'react'
import { LocaleContext } from './locale-context'

export function useLocaleContext() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocaleContext must be used within LocaleProvider')
  return ctx
}
