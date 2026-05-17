export type TestCategoryRecord = {
  id: string
  slug: string
  title_ar: string
  title_en: string | null
  sort_order: number
  created_at: string | null
}

export type TestCategoryInput = {
  slug: string
  title_ar: string
  title_en: string
  sort_order: number
}
