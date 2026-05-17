import {
  blobToLocalNewsImageUrl,
  deleteNewsImageByUrl,
  isStoredNewsImage,
  uploadNewsImage,
} from './newsImageStorage'
import { supabase } from './supabase'
import type { NewsImageInput, NewsImageRecord, NewsInput, NewsRecord } from '../types/news'

const LOCAL_KEY = 'urgen_news_v1'

const seedNews: NewsRecord[] = [
  {
    id: 'seed-news-1',
    title_ar: 'افتتاح قسم التحليلات الجينية المتقدم',
    title_en: 'Advanced Genetic Testing Wing Now Open',
    summary_ar: 'نعلن عن توسعة مختبر URGEN بأحدث أجهزة التسلسل الجيني.',
    summary_en: 'URGEN Laboratory expands with state-of-the-art sequencing technology.',
    body_ar:
      'يسرّنا الإعلان عن افتتاح قسم جديد مخصص للتحليلات الجينية المتقدمة، بهدف تقديم نتائج أسرع وأدق للمرضى والأطباء في العراق.\n\nيضم القسم فريقاً متخصصاً وبيئة عمل مطابقة لأعلى المعايير الدولية.',
    body_en:
      'We are pleased to announce a new wing dedicated to advanced genetic testing, delivering faster and more accurate results for patients and physicians across Iraq.\n\nThe facility includes a specialized team and workflows aligned with international quality standards.',
    cover_image_url: null,
    published: true,
    created_at: new Date().toISOString(),
    images: [],
  },
]

type NewsRow = {
  id: string
  title_ar: string
  title_en: string
  summary_ar: string
  summary_en: string
  body_ar: string
  body_en: string
  cover_image_url: string | null
  published: boolean
  created_at: string | null
}

export type ResolvedNewsImage = NewsImageInput & {
  pendingBlob?: Blob
  pendingMime?: string
  remove?: boolean
}

function readLocal(): NewsRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(seedNews))
      return [...seedNews]
    }
    const parsed = JSON.parse(raw) as NewsRecord[]
    return Array.isArray(parsed) ? parsed : [...seedNews]
  } catch {
    return [...seedNews]
  }
}

function writeLocal(items: NewsRecord[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items))
}

function sortImages(images: NewsImageRecord[]): NewsImageRecord[] {
  return [...images].sort((a, b) => a.sort_order - b.sort_order)
}

function rowToNews(row: NewsRow, images: NewsImageRecord[] = []): NewsRecord {
  return {
    id: row.id,
    title_ar: row.title_ar,
    title_en: row.title_en,
    summary_ar: row.summary_ar,
    summary_en: row.summary_en,
    body_ar: row.body_ar,
    body_en: row.body_en,
    cover_image_url: row.cover_image_url,
    published: row.published,
    created_at: row.created_at ?? new Date().toISOString(),
    images: sortImages(images),
  }
}

async function fetchImagesByNewsIds(ids: string[]): Promise<Map<string, NewsImageRecord[]>> {
  const map = new Map<string, NewsImageRecord[]>()
  if (!supabase || ids.length === 0) return map

  const { data, error } = await supabase
    .from('news_images')
    .select('id, news_id, image_url, sort_order, caption_ar, caption_en')
    .in('news_id', ids)
    .order('sort_order', { ascending: true })

  if (error || !data) return map

  for (const img of data) {
    const list = map.get(img.news_id) ?? []
    list.push({
      id: img.id,
      news_id: img.news_id,
      image_url: img.image_url,
      sort_order: img.sort_order,
      caption_ar: img.caption_ar,
      caption_en: img.caption_en,
    })
    map.set(img.news_id, list)
  }
  return map
}

async function fetchNewsRows(admin: boolean): Promise<NewsRecord[]> {
  if (!supabase) {
    const list = readLocal()
    return admin
      ? list.sort((a, b) => b.created_at.localeCompare(a.created_at))
      : list.filter((n) => n.published).sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  let query = supabase.from('news').select('*').order('created_at', { ascending: false })
  if (!admin) query = query.eq('published', true)

  const { data, error } = await query
  if (error || !data) return []

  const rows = data as NewsRow[]
  const imageMap = await fetchImagesByNewsIds(rows.map((r) => r.id))
  return rows.map((row) => rowToNews(row, imageMap.get(row.id) ?? []))
}

export async function fetchPublishedNews(): Promise<NewsRecord[]> {
  return fetchNewsRows(false)
}

export async function fetchNewsById(id: string, admin = false): Promise<NewsRecord | null> {
  if (!supabase) {
    const hit = readLocal().find((n) => n.id === id)
    if (!hit) return null
    if (!admin && !hit.published) return null
    return hit
  }

  let query = supabase.from('news').select('*').eq('id', id)
  if (!admin) query = query.eq('published', true)

  const { data, error } = await query.maybeSingle()
  if (error || !data) return null

  const row = data as NewsRow
  const imageMap = await fetchImagesByNewsIds([row.id])
  return rowToNews(row, imageMap.get(row.id) ?? [])
}

export async function fetchAllNewsAdmin(): Promise<NewsRecord[]> {
  return fetchNewsRows(true)
}

async function uploadPendingImage(
  newsId: string,
  blob: Blob,
  mime: string,
  kind: 'cover' | 'gallery',
  imageId?: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (supabase) return uploadNewsImage(blob, newsId, mime, kind, imageId)
  return blobToLocalNewsImageUrl(blob)
}

export async function syncNewsGalleryImages(
  newsId: string,
  images: ResolvedNewsImage[],
  previousUrls: string[],
): Promise<{ ok: boolean; error?: string }> {
  const keptUrls = new Set<string>()
  const rows: NewsImageRecord[] = []

  for (let i = 0; i < images.length; i++) {
    const img = images[i]!
    if (img.remove) continue

    let url = img.image_url?.trim() || null
    if (img.pendingBlob) {
      const uploaded = await uploadPendingImage(
        newsId,
        img.pendingBlob,
        img.pendingMime ?? 'image/webp',
        'gallery',
        img.id,
      )
      if (!uploaded.ok) return { ok: false, error: uploaded.error }
      url = uploaded.url
      if (img.image_url && isStoredNewsImage(img.image_url) && img.image_url !== url) {
        await deleteNewsImageByUrl(img.image_url)
      }
    }

    if (!url) continue
    keptUrls.add(url)

    const record: NewsImageRecord = {
      id: img.id ?? crypto.randomUUID(),
      news_id: newsId,
      image_url: url,
      sort_order: img.sort_order ?? i,
      caption_ar: img.caption_ar?.trim() || null,
      caption_en: img.caption_en?.trim() || null,
    }
    rows.push(record)
  }

  for (const oldUrl of previousUrls) {
    if (!keptUrls.has(oldUrl) && isStoredNewsImage(oldUrl)) {
      await deleteNewsImageByUrl(oldUrl)
    }
  }

  if (!supabase) {
    const all = readLocal()
    const idx = all.findIndex((n) => n.id === newsId)
    if (idx === -1) return { ok: false, error: 'not_found' }
    all[idx] = { ...all[idx]!, images: sortImages(rows) }
    writeLocal(all)
    return { ok: true }
  }

  await supabase.from('news_images').delete().eq('news_id', newsId)
  if (rows.length > 0) {
    const { error } = await supabase.from('news_images').insert(
      rows.map((r) => ({
        id: r.id,
        news_id: newsId,
        image_url: r.image_url,
        sort_order: r.sort_order,
        caption_ar: r.caption_ar,
        caption_en: r.caption_en,
      })),
    )
    if (error) return { ok: false, error: error.message }
  }

  return { ok: true }
}

export async function createNews(
  input: NewsInput,
  options: { id?: string; gallery?: ResolvedNewsImage[] },
): Promise<{ ok: boolean; error?: string }> {
  const newId = options.id ?? crypto.randomUUID()
  const gallery = options.gallery ?? []

  if (!supabase) {
    const record: NewsRecord = {
      id: newId,
      title_ar: input.title_ar.trim(),
      title_en: input.title_en.trim(),
      summary_ar: input.summary_ar.trim(),
      summary_en: input.summary_en.trim(),
      body_ar: input.body_ar.trim(),
      body_en: input.body_en.trim(),
      cover_image_url: input.cover_image_url?.trim() || null,
      published: input.published,
      created_at: new Date().toISOString(),
      images: [],
    }
    writeLocal([record, ...readLocal()])
    const synced = await syncNewsGalleryImages(newId, gallery, [])
    return synced.ok ? { ok: true } : { ok: false, error: synced.error }
  }

  const { error } = await supabase.from('news').insert({
    id: newId,
    title_ar: input.title_ar.trim(),
    title_en: input.title_en.trim(),
    summary_ar: input.summary_ar.trim(),
    summary_en: input.summary_en.trim(),
    body_ar: input.body_ar.trim(),
    body_en: input.body_en.trim(),
    cover_image_url: input.cover_image_url?.trim() || null,
    published: input.published,
  })

  if (error) return { ok: false, error: error.message }

  const synced = await syncNewsGalleryImages(newId, gallery, [])
  return synced.ok ? { ok: true } : { ok: false, error: synced.error }
}

export async function updateNews(
  id: string,
  input: NewsInput,
  options?: { gallery?: ResolvedNewsImage[]; previousGalleryUrls?: string[] },
): Promise<{ ok: boolean; error?: string }> {
  const gallery = options?.gallery
  const previousGalleryUrls = options?.previousGalleryUrls ?? []

  if (!supabase) {
    const all = readLocal()
    const idx = all.findIndex((n) => n.id === id)
    if (idx === -1) return { ok: false, error: 'not_found' }
    all[idx] = {
      ...all[idx]!,
      title_ar: input.title_ar.trim(),
      title_en: input.title_en.trim(),
      summary_ar: input.summary_ar.trim(),
      summary_en: input.summary_en.trim(),
      body_ar: input.body_ar.trim(),
      body_en: input.body_en.trim(),
      cover_image_url: input.cover_image_url?.trim() || null,
      published: input.published,
    }
    writeLocal(all)
    if (gallery) {
      const synced = await syncNewsGalleryImages(id, gallery, previousGalleryUrls)
      return synced.ok ? { ok: true } : { ok: false, error: synced.error }
    }
    return { ok: true }
  }

  const { error } = await supabase
    .from('news')
    .update({
      title_ar: input.title_ar.trim(),
      title_en: input.title_en.trim(),
      summary_ar: input.summary_ar.trim(),
      summary_en: input.summary_en.trim(),
      body_ar: input.body_ar.trim(),
      body_en: input.body_en.trim(),
      cover_image_url: input.cover_image_url?.trim() || null,
      published: input.published,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  if (gallery) {
    const synced = await syncNewsGalleryImages(id, gallery, previousGalleryUrls)
    return synced.ok ? { ok: true } : { ok: false, error: synced.error }
  }

  return { ok: true }
}

export async function deleteNews(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) {
    writeLocal(readLocal().filter((n) => n.id !== id))
    return { ok: true }
  }

  const { data: item } = await supabase
    .from('news')
    .select('cover_image_url')
    .eq('id', id)
    .maybeSingle()

  const { data: imgs } = await supabase.from('news_images').select('image_url').eq('news_id', id)

  const { error } = await supabase.from('news').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  await deleteNewsImageByUrl(item?.cover_image_url ?? null)
  for (const img of imgs ?? []) {
    await deleteNewsImageByUrl(img.image_url)
  }

  return { ok: true }
}
