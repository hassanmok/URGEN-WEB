export type NewsImageRecord = {
  id: string
  news_id: string
  image_url: string
  sort_order: number
  caption_ar: string | null
  caption_en: string | null
}

export type NewsRecord = {
  id: string
  title_ar: string
  title_en: string
  summary_ar: string
  summary_en: string
  body_ar: string
  body_en: string
  cover_image_url: string | null
  published: boolean
  created_at: string
  images: NewsImageRecord[]
}

export type NewsInput = {
  title_ar: string
  title_en: string
  summary_ar: string
  summary_en: string
  body_ar: string
  body_en: string
  cover_image_url: string | null
  published: boolean
}

export type NewsImageInput = {
  id?: string
  image_url: string | null
  sort_order: number
  caption_ar?: string | null
  caption_en?: string | null
}
