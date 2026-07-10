import { supabase } from './supabase'
import type { Database } from '../types/database'
import type { LabTest } from '../types/labTest'

export type TestAdminInput = Database['public']['Tables']['tests']['Insert']

export async function fetchAllTestsAdmin(): Promise<LabTest[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) {
    console.error('[tests admin]', error.message)
    return []
  }
  return (data ?? []) as LabTest[]
}

function normalizeTestInput(input: TestAdminInput): TestAdminInput {
  return {
    ...input,
    slug: input.slug.trim(),
    category: input.category?.trim() || null,
    title_ar: input.title_ar.trim(),
    title_en: input.title_en?.trim() || null,
    description_ar: input.description_ar.trim(),
    description_en: input.description_en?.trim() || null,
    long_description_ar: input.long_description_ar?.trim() || null,
    long_description_en: input.long_description_en?.trim() || null,
    clinical_use_ar: input.clinical_use_ar?.trim() || null,
    clinical_use_en: input.clinical_use_en?.trim() || null,
    sample_ar: input.sample_ar?.trim() || null,
    sample_en: input.sample_en?.trim() || null,
    method_ar: input.method_ar?.trim() || null,
    method_en: input.method_en?.trim() || null,
    turnaround_ar: input.turnaround_ar?.trim() || null,
    turnaround_en: input.turnaround_en?.trim() || null,
    price_display_ar: input.price_display_ar?.trim() || null,
    price_display_en: input.price_display_en?.trim() || null,
    image_url: input.image_url?.trim() || null,
    sort_order: input.sort_order ?? 0,
  }
}

export async function createTest(input: TestAdminInput): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }
  const row = normalizeTestInput(input)
  if (!row.slug || !row.title_ar || !row.description_ar) {
    return { ok: false, error: 'missing_fields' }
  }
  const { error } = await supabase.from('tests').insert(row)
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function updateTest(
  id: string,
  input: TestAdminInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }
  const row = normalizeTestInput(input)
  if (!row.slug || !row.title_ar || !row.description_ar) {
    return { ok: false, error: 'missing_fields' }
  }
  const { error } = await supabase.from('tests').update(row).eq('id', id)
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function deleteTest(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }
  const { error } = await supabase.from('tests').delete().eq('id', id)
  return error ? { ok: false, error: error.message } : { ok: true }
}

export const emptyTestAdminInput = (): TestAdminInput => ({
  slug: '',
  category: null,
  title_ar: '',
  title_en: '',
  description_ar: '',
  description_en: '',
  long_description_ar: '',
  long_description_en: '',
  clinical_use_ar: '',
  clinical_use_en: '',
  sample_ar: '',
  sample_en: '',
  method_ar: '',
  method_en: '',
  turnaround_ar: '',
  turnaround_en: '',
  price_display_ar: '',
  price_display_en: '',
  image_url: null,
  sort_order: 0,
})

export function testToAdminInput(test: LabTest): TestAdminInput {
  return {
    slug: test.slug,
    category: test.category,
    title_ar: test.title_ar,
    title_en: test.title_en ?? '',
    description_ar: test.description_ar,
    description_en: test.description_en ?? '',
    long_description_ar: test.long_description_ar ?? '',
    long_description_en: test.long_description_en ?? '',
    clinical_use_ar: test.clinical_use_ar ?? '',
    clinical_use_en: test.clinical_use_en ?? '',
    sample_ar: test.sample_ar ?? '',
    sample_en: test.sample_en ?? '',
    method_ar: test.method_ar ?? '',
    method_en: test.method_en ?? '',
    turnaround_ar: test.turnaround_ar ?? '',
    turnaround_en: test.turnaround_en ?? '',
    price_display_ar: test.price_display_ar ?? '',
    price_display_en: test.price_display_en ?? '',
    image_url: test.image_url,
    sort_order: test.sort_order ?? 0,
  }
}
