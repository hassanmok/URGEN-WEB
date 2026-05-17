import { useId, useRef, useState } from 'react'
import { compressEventImage } from '../../lib/compressEventImage'
import type { Messages } from '../../i18n/messages'

export type GalleryDraft = {
  localId: string
  id?: string
  image_url: string | null
  preview: string | null
  pendingBlob?: Blob
  pendingMime?: string
  caption_ar: string
  caption_en: string
  sort_order: number
  remove?: boolean
}

type Props = {
  m: Messages['admin']
  items: GalleryDraft[]
  onChange: (items: GalleryDraft[]) => void
  disabled?: boolean
}

export function NewsGalleryField({ m, items, onChange, disabled }: Props) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onPickFile(file: File | null) {
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      const compressed = await compressEventImage(file)
      const preview = URL.createObjectURL(compressed.blob)
      onChange([
        ...items,
        {
          localId: crypto.randomUUID(),
          image_url: null,
          preview,
          pendingBlob: compressed.blob,
          pendingMime: compressed.mime,
          caption_ar: '',
          caption_en: '',
          sort_order: items.length,
        },
      ])
    } catch (e) {
      const code = e instanceof Error ? e.message : ''
      if (code === 'invalid_type') setError(m.imageInvalidType)
      else if (code === 'file_too_large' || code === 'still_too_large') setError(m.imageTooLarge)
      else setError(m.imageCompressFailed)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function updateItem(localId: string, patch: Partial<GalleryDraft>) {
    onChange(items.map((it) => (it.localId === localId ? { ...it, ...patch } : it)))
  }

  function removeItem(localId: string) {
    const target = items.find((it) => it.localId === localId)
    if (target?.preview?.startsWith('blob:')) URL.revokeObjectURL(target.preview)
    onChange(
      items
        .map((it) => (it.localId === localId ? { ...it, remove: true } : it))
        .filter((it) => !(it.remove && !it.id && !it.pendingBlob)),
    )
  }

  const visible = items.filter((it) => !it.remove)

  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-slate-700">{m.newsGalleryImages}</span>
      <p className="text-xs text-slate-500">{m.newsGalleryHint}</p>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
          {m.newsGalleryEmpty}
        </p>
      ) : (
        <ul className="space-y-4">
          {visible.map((item, index) => (
            <li
              key={item.localId}
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-3"
            >
              {item.preview && (
                <div className="mb-3 flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <img
                    src={item.preview}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block text-xs">
                  <span className="font-medium text-slate-600">{m.newsCaptionAr}</span>
                  <input
                    type="text"
                    value={item.caption_ar}
                    onChange={(e) => updateItem(item.localId, { caption_ar: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    dir="rtl"
                    disabled={disabled}
                  />
                </label>
                <label className="block text-xs">
                  <span className="font-medium text-slate-600">{m.newsCaptionEn}</span>
                  <input
                    type="text"
                    value={item.caption_en}
                    onChange={(e) => updateItem(item.localId, { caption_en: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    dir="ltr"
                    disabled={disabled}
                  />
                </label>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500">
                  {m.newsImageOrder}: {index + 1}
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeItem(item.localId)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  {m.imageRemove}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label
        htmlFor={inputId}
        className={`inline-flex cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-urgen-navy hover:bg-slate-50 ${disabled || busy ? 'pointer-events-none opacity-50' : ''}`}
      >
        {busy ? m.imageCompressing : m.newsAddGalleryImage}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        disabled={disabled || busy}
        onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

export function galleryToResolved(items: GalleryDraft[]) {
  return items
    .filter((it) => !it.remove)
    .map((it, index) => ({
      id: it.id,
      image_url: it.image_url,
      sort_order: index,
      caption_ar: it.caption_ar || null,
      caption_en: it.caption_en || null,
      pendingBlob: it.pendingBlob,
      pendingMime: it.pendingMime,
      remove: it.remove,
    }))
}

