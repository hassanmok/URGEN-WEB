import { supabase } from './supabase'
import type { TestCategoryInput, TestCategoryRecord } from '../types/testCategory'

export async function fetchTestCategories(): Promise<TestCategoryRecord[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('test_categories')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) {
    console.error('[test_categories]', error.message)
    return []
  }
  return (data ?? []) as TestCategoryRecord[]
}

function normalizeCategoryInput(input: TestCategoryInput) {
  return {
    slug: input.slug.trim(),
    title_ar: input.title_ar.trim(),
    title_en: input.title_en.trim() || null,
    sort_order: input.sort_order,
  }
}

export async function createTestCategory(
  input: TestCategoryInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }
  const row = normalizeCategoryInput(input)
  if (!row.slug || !row.title_ar) return { ok: false, error: 'missing_fields' }
  const { error } = await supabase.from('test_categories').insert(row)
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function updateTestCategory(
  slug: string,
  input: TestCategoryInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }
  const row = normalizeCategoryInput(input)
  if (!row.slug || !row.title_ar) return { ok: false, error: 'missing_fields' }

  const { error } = await supabase.from('test_categories').update(row).eq('slug', slug)

  if (error) return { ok: false, error: error.message }

  if (slug !== row.slug) {
    await supabase.from('tests').update({ category: row.slug }).eq('category', slug)
  }

  return { ok: true }
}

export async function deleteTestCategory(
  slug: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }
  await supabase.from('tests').update({ category: null }).eq('category', slug)
  const { error } = await supabase.from('test_categories').delete().eq('slug', slug)
  return error ? { ok: false, error: error.message } : { ok: true }
}
