import { labTestsCatalogEntries } from '../data/labTestsCatalog'
import { supabase } from './supabase'
import type { LabTestCatalogEntry } from '../types/labTest'

function catalogRowToDb(row: LabTestCatalogEntry) {
  return {
    slug: row.slug,
    category: row.category,
    title_ar: row.title_ar,
    title_en: row.title_en,
    description_ar: row.description_ar,
    description_en: row.description_en,
    long_description_ar: row.long_description_ar ?? row.description_ar,
    long_description_en: row.description_en ?? null,
    clinical_use_ar: row.clinical_use_ar,
    clinical_use_en: row.clinical_use_en,
    sample_ar: row.sample_ar,
    sample_en: row.sample_en,
    method_ar: row.method_ar,
    method_en: row.method_en,
    turnaround_ar: row.turnaround_ar,
    turnaround_en: row.turnaround_en,
    price_display_ar: row.price_display_ar,
    price_display_en: row.price_display_en,
    preparation_ar: row.preparation_ar,
    preparation_en: row.preparation_en,
    limitation_note_ar: row.limitation_note_ar ?? null,
    limitation_note_en: row.limitation_note_en ?? null,
    image_url: row.image_url,
    sort_order: row.sort_order,
  }
}

/** رفع قائمة الفحوصات الكاملة من الكود إلى Supabase (upsert حسب slug) */
export async function syncCatalogToSupabase(): Promise<{
  ok: boolean
  count?: number
  error?: string
}> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const rows = labTestsCatalogEntries.map(catalogRowToDb)
  const chunkSize = 25

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error } = await supabase.from('tests').upsert(chunk, { onConflict: 'slug' })
    if (error) return { ok: false, error: error.message }
  }

  return { ok: true, count: rows.length }
}
