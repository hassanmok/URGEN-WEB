import { deleteEventImageByUrl } from './eventImageStorage'
import { supabase } from './supabase'
import type { EventInput, EventRecord } from '../types/event'

const LOCAL_KEY = 'urgen_events_v1'

const seedEvents: EventRecord[] = [
  {
    id: 'seed-1',
    title_ar: 'يوم التوعية بالفحص الوراثي',
    title_en: 'Genetic Screening Awareness Day',
    description_ar:
      'فعالية مجانية للتعريف بأهمية الفحوص الوراثية وكيفية اختيار التحليل المناسب لعائلتك.',
    description_en:
      'A free session on the importance of genetic testing and how to choose the right analysis for your family.',
    event_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    location_ar: 'مختبر URGEN — بغداد',
    location_en: 'URGEN Laboratory — Baghdad',
    image_url: null,
    published: true,
    created_at: new Date().toISOString(),
  },
]

function readLocal(): EventRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(seedEvents))
      return [...seedEvents]
    }
    const parsed = JSON.parse(raw) as EventRecord[]
    return Array.isArray(parsed) ? parsed : [...seedEvents]
  } catch {
    return [...seedEvents]
  }
}

function writeLocal(events: EventRecord[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(events))
}

function rowToEvent(row: {
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
  created_at: string | null
}): EventRecord {
  return {
    id: row.id,
    title_ar: row.title_ar,
    title_en: row.title_en,
    description_ar: row.description_ar,
    description_en: row.description_en,
    event_date: row.event_date,
    location_ar: row.location_ar,
    location_en: row.location_en,
    image_url: row.image_url,
    published: row.published,
    created_at: row.created_at ?? new Date().toISOString(),
  }
}

export async function fetchPublishedEvents(): Promise<EventRecord[]> {
  if (!supabase) {
    return readLocal()
      .filter((e) => e.published)
      .sort((a, b) => b.event_date.localeCompare(a.event_date))
  }
  const all = await fetchAllEventsAdmin()
  return all.filter((e) => e.published).sort((a, b) => b.event_date.localeCompare(a.event_date))
}

export async function fetchAllEventsAdmin(): Promise<EventRecord[]> {
  if (!supabase) {
    return readLocal().sort((a, b) => b.event_date.localeCompare(a.event_date))
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false })

  if (error || !data) {
    return []
  }

  return data.map(rowToEvent)
}

export async function createEvent(
  input: EventInput,
  options?: { id?: string },
): Promise<{ ok: boolean; error?: string }> {
  const newId = options?.id ?? crypto.randomUUID()

  if (!supabase) {
    const events = readLocal()
    const record: EventRecord = {
      id: newId,
      title_ar: input.title_ar.trim(),
      title_en: input.title_en.trim(),
      description_ar: input.description_ar.trim(),
      description_en: input.description_en.trim(),
      event_date: input.event_date,
      location_ar: input.location_ar?.trim() || null,
      location_en: input.location_en?.trim() || null,
      image_url: input.image_url?.trim() || null,
      published: input.published,
      created_at: new Date().toISOString(),
    }
    writeLocal([record, ...events])
    return { ok: true }
  }

  const { error } = await supabase.from('events').insert({
    id: newId,
    title_ar: input.title_ar.trim(),
    title_en: input.title_en.trim(),
    description_ar: input.description_ar.trim(),
    description_en: input.description_en.trim(),
    event_date: input.event_date,
    location_ar: input.location_ar?.trim() || null,
    location_en: input.location_en?.trim() || null,
    image_url: input.image_url?.trim() || null,
    published: input.published,
  })

  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function updateEvent(
  id: string,
  input: EventInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) {
    const events = readLocal()
    const idx = events.findIndex((e) => e.id === id)
    if (idx === -1) return { ok: false, error: 'not_found' }
    events[idx] = {
      ...events[idx]!,
      title_ar: input.title_ar.trim(),
      title_en: input.title_en.trim(),
      description_ar: input.description_ar.trim(),
      description_en: input.description_en.trim(),
      event_date: input.event_date,
      location_ar: input.location_ar?.trim() || null,
      location_en: input.location_en?.trim() || null,
      image_url: input.image_url?.trim() || null,
      published: input.published,
    }
    writeLocal(events)
    return { ok: true }
  }

  const { error } = await supabase
    .from('events')
    .update({
      title_ar: input.title_ar.trim(),
      title_en: input.title_en.trim(),
      description_ar: input.description_ar.trim(),
      description_en: input.description_en.trim(),
      event_date: input.event_date,
      location_ar: input.location_ar?.trim() || null,
      location_en: input.location_en?.trim() || null,
      image_url: input.image_url?.trim() || null,
      published: input.published,
    })
    .eq('id', id)

  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function deleteEvent(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) {
    writeLocal(readLocal().filter((e) => e.id !== id))
    return { ok: true }
  }

  const { data: row } = await supabase.from('events').select('image_url').eq('id', id).maybeSingle()
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  await deleteEventImageByUrl(row?.image_url ?? null)
  return { ok: true }
}
