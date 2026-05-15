/** أبعاد عرض البطاقة — كافية للشاشات الكبيرة مع ملف صغير */
const MAX_WIDTH = 1200
const MAX_HEIGHT = 675
const TARGET_MAX_BYTES = 280_000
const MIN_QUALITY = 0.52

export type CompressImageError = 'invalid_type' | 'file_too_large' | 'compress_failed' | 'still_too_large'

function fitDimensions(
  width: number,
  height: number,
  maxW: number,
  maxH: number,
): { width: number; height: number } {
  const ratio = Math.min(maxW / width, maxH / height, 1)
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('compress_failed'))),
      type,
      quality,
    )
  })
}

async function encodeCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  const types: { mime: string; quality: number }[] = [
    { mime: 'image/webp', quality: 0.82 },
    { mime: 'image/jpeg', quality: 0.85 },
  ]

  for (const { mime, quality: startQ } of types) {
    let quality = startQ
    while (quality >= MIN_QUALITY) {
      const blob = await canvasToBlob(canvas, mime, quality)
      if (blob.size <= TARGET_MAX_BYTES) return blob
      quality -= 0.08
    }
    const last = await canvasToBlob(canvas, mime, MIN_QUALITY)
    if (last.size <= TARGET_MAX_BYTES) return last
  }

  throw new Error('still_too_large')
}

/**
 * يضغط الصورة في المتصفح قبل الرفع: تصغير الأبعاد + WebP/JPEG بجودة مناسبة.
 * الهدف: ~280KB أو أقل مع مظهر جيد على بطاقات الفعاليات.
 */
export async function compressEventImage(
  file: File,
): Promise<{ blob: Blob; mime: string; width: number; height: number; bytes: number }> {
  if (!file.type.startsWith('image/')) {
    throw new Error('invalid_type')
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error('file_too_large')
  }

  const bitmap = await createImageBitmap(file)
  let { width, height } = fitDimensions(bitmap.width, bitmap.height, MAX_WIDTH, MAX_HEIGHT)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('compress_failed')
  }

  const draw = (w: number, h: number) => {
    canvas.width = w
    canvas.height = h
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(bitmap, 0, 0, w, h)
  }

  draw(width, height)

  let blob: Blob
  try {
    blob = await encodeCanvas(canvas)
  } catch (e) {
    if (e instanceof Error && e.message === 'still_too_large') {
      width = Math.round(width * 0.85)
      height = Math.round(height * 0.85)
      draw(width, height)
      blob = await encodeCanvas(canvas)
    } else {
      bitmap.close()
      throw e
    }
  }

  bitmap.close()

  return {
    blob,
    mime: blob.type,
    width,
    height,
    bytes: blob.size,
  }
}

export function formatImageSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}
