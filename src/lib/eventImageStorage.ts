import { supabase } from './supabase'

export const EVENT_IMAGES_BUCKET = 'event-images'

const LOCAL_MAX_DATA_URL = 400_000

export function isStoredEventImage(url: string | null | undefined): boolean {
  if (!url) return false
  return url.includes(`/storage/v1/object/public/${EVENT_IMAGES_BUCKET}/`)
}

export function storagePathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${EVENT_IMAGES_BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length)
}

export async function uploadEventImage(
  blob: Blob,
  eventId: string,
  mime: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!supabase) {
    return { ok: false, error: 'no_supabase' }
  }

  const ext = mime.includes('webp') ? 'webp' : 'jpg'
  const path = `events/${eventId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(EVENT_IMAGES_BUCKET).upload(path, blob, {
    contentType: mime,
    cacheControl: '31536000',
    upsert: false,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  const { data } = supabase.storage.from(EVENT_IMAGES_BUCKET).getPublicUrl(path)
  return { ok: true, url: data.publicUrl }
}

export async function deleteEventImageByUrl(url: string | null | undefined): Promise<void> {
  if (!supabase || !url || !isStoredEventImage(url)) return
  const path = storagePathFromPublicUrl(url)
  if (!path) return
  await supabase.storage.from(EVENT_IMAGES_BUCKET).remove([path])
}

/** وضع محلي بدون Supabase: حفظ مضغوط كـ Data URL (محدود بحجم التخزين) */
export async function blobToLocalImageUrl(blob: Blob): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('read_failed'))
    reader.readAsDataURL(blob)
  })

  if (dataUrl.length > LOCAL_MAX_DATA_URL) {
    return { ok: false, error: 'still_too_large' }
  }

  return { ok: true, url: dataUrl }
}
