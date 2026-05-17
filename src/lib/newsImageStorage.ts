import { supabase } from './supabase'

export const NEWS_IMAGES_BUCKET = 'news-images'

export function isStoredNewsImage(url: string | null | undefined): boolean {
  if (!url) return false
  return url.includes(`/storage/v1/object/public/${NEWS_IMAGES_BUCKET}/`)
}

export function storagePathFromNewsPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${NEWS_IMAGES_BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length)
}

export async function uploadNewsImage(
  blob: Blob,
  newsId: string,
  mime: string,
  kind: 'cover' | 'gallery',
  imageId?: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'no_supabase' }

  const ext = mime.includes('webp') ? 'webp' : 'jpg'
  const suffix = kind === 'cover' ? 'cover' : `gallery/${imageId ?? crypto.randomUUID()}`
  const path = `news/${newsId}/${suffix}-${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(NEWS_IMAGES_BUCKET).upload(path, blob, {
    contentType: mime,
    cacheControl: '31536000',
    upsert: false,
  })

  if (error) return { ok: false, error: error.message }

  const { data } = supabase.storage.from(NEWS_IMAGES_BUCKET).getPublicUrl(path)
  return { ok: true, url: data.publicUrl }
}

export async function deleteNewsImageByUrl(url: string | null | undefined): Promise<void> {
  if (!supabase || !url || !isStoredNewsImage(url)) return
  const path = storagePathFromNewsPublicUrl(url)
  if (!path) return
  await supabase.storage.from(NEWS_IMAGES_BUCKET).remove([path])
}

export async function blobToLocalNewsImageUrl(
  blob: Blob,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('read_failed'))
    reader.readAsDataURL(blob)
  })

  if (dataUrl.length > 400_000) return { ok: false, error: 'still_too_large' }
  return { ok: true, url: dataUrl }
}
