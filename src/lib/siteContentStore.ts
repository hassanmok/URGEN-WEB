import {
  defaultSiteContent,
  type SiteContentKey,
  type SiteContentMap,
} from './siteContentDefaults'
import { supabase } from './supabase'

export async function fetchSiteContent(): Promise<SiteContentMap> {
  if (!supabase) return structuredClone(defaultSiteContent)

  const { data, error } = await supabase.from('site_content').select('key, data')

  if (error || !data?.length) return structuredClone(defaultSiteContent)

  const merged: SiteContentMap = structuredClone(defaultSiteContent)
  for (const row of data) {
    const key = row.key as SiteContentKey
    if (key in merged && row.data) {
      ;(merged as Record<string, unknown>)[key] = row.data
    }
  }
  return merged
}

/** دفع المحتوى الافتراضي الحالي (من الكود) إلى Supabase */
export async function syncDefaultSiteContentToSupabase(): Promise<{
  ok: boolean
  error?: string
}> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const rows = (Object.keys(defaultSiteContent) as SiteContentKey[]).map((key) => ({
    key,
    data: defaultSiteContent[key],
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('site_content').upsert(rows, { onConflict: 'key' })
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function updateSiteContentKey(
  key: SiteContentKey,
  data: SiteContentMap[SiteContentKey],
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }
  const { error } = await supabase.from('site_content').upsert({
    key,
    data,
    updated_at: new Date().toISOString(),
  })
  return error ? { ok: false, error: error.message } : { ok: true }
}
