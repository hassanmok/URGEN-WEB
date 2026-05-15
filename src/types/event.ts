export type EventRecord = {
  id: string
  title_ar: string
  title_en: string
  description_ar: string
  description_en: string
  event_date: string
  location_ar: string | null
  location_en: string | null
  image_url: string | null
  published: boolean
  created_at: string
}

export type EventInput = Omit<EventRecord, 'id' | 'created_at'> & {
  id?: string
}
