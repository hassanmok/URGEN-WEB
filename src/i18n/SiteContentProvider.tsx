import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { fetchSiteContent } from '../lib/siteContentStore'
import type { SiteContentMap } from '../lib/siteContentDefaults'
import { defaultSiteContent } from '../lib/siteContentDefaults'
import { supabase } from '../lib/supabase'

type SiteContentContextValue = {
  content: SiteContentMap
  loading: boolean
  fromSupabase: boolean
  reload: () => Promise<void>
}

export const SiteContentContext = createContext<SiteContentContextValue | null>(null)

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContentMap>(defaultSiteContent)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [fromSupabase, setFromSupabase] = useState(false)

  const reload = useCallback(async () => {
    if (!supabase) {
      setContent(structuredClone(defaultSiteContent))
      setFromSupabase(false)
      setLoading(false)
      return
    }
    setLoading(true)
    const data = await fetchSiteContent()
    setContent(data)
    setFromSupabase(true)
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return (
    <SiteContentContext.Provider value={{ content, loading, fromSupabase, reload }}>
      {children}
    </SiteContentContext.Provider>
  )
}
