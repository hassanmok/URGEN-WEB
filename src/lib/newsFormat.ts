import type { Locale } from '../i18n/messages'
import type { NewsRecord } from '../types/news'

export function formatNewsDateShort(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-IQ' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatNewsDateLong(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-IQ' : 'en-GB', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function pickNewsLocalized(item: NewsRecord, locale: Locale) {
  const isAr = locale === 'ar'
  return {
    title: isAr ? item.title_ar : item.title_en,
    summary: isAr ? item.summary_ar : item.summary_en,
    body: isAr ? item.body_ar : item.body_en,
    imageCaption: (img: NewsRecord['images'][number]) =>
      (isAr ? img.caption_ar ?? img.caption_en : img.caption_en ?? img.caption_ar) ?? '',
  }
}

export type NewsCarouselSlide = {
  src: string
  alt: string
  caption?: string
}

/** صورة الغلاف فقط (من حقل cover في الإدارة). */
export function getNewsCoverUrl(item: NewsRecord): string | null {
  const url = item.cover_image_url?.trim()
  return url || null
}

/** للقائمة: الغلاف أو أول صورة معرض إن لم يُحدَّد غلاف. */
export function getNewsListThumbUrl(item: NewsRecord): string | null {
  return getNewsCoverUrl(item) ?? item.images[0]?.image_url ?? null
}

/** معرض الصور داخل الخبر (بدون صورة الغلاف). */
export function newsGallerySlides(item: NewsRecord, locale: Locale): NewsCarouselSlide[] {
  const { title, imageCaption } = pickNewsLocalized(item, locale)
  const cover = getNewsCoverUrl(item)

  return item.images
    .filter((img) => img.image_url !== cover)
    .map((img) => {
      const cap = imageCaption(img)
      return {
        src: img.image_url,
        alt: cap || title,
        caption: cap || undefined,
      }
    })
}

/** كل صور الخبر للسلايدر: الغلاف أولاً ثم صور المعرض (بدون تكرار). */
export function newsAllSlides(item: NewsRecord, locale: Locale): NewsCarouselSlide[] {
  const { title, imageCaption } = pickNewsLocalized(item, locale)
  const slides: NewsCarouselSlide[] = []
  const seen = new Set<string>()

  const cover = getNewsCoverUrl(item)
  if (cover) {
    seen.add(cover)
    slides.push({ src: cover, alt: title })
  }

  for (const img of item.images) {
    if (seen.has(img.image_url)) continue
    seen.add(img.image_url)
    const cap = imageCaption(img)
    slides.push({
      src: img.image_url,
      alt: cap || title,
      caption: cap || undefined,
    })
  }

  return slides
}
