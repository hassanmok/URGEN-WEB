import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react'
import { compressEventImage, formatImageSize } from '../../lib/compressEventImage'
import {
  blobToLocalNewsImageUrl,
  deleteNewsImageByUrl,
  isStoredNewsImage,
  uploadNewsImage,
} from '../../lib/newsImageStorage'
import { supabase } from '../../lib/supabase'
import type { Messages } from '../../i18n/messages'

export type NewsCoverImageFieldHandle = {
  resolveImageUrl: (
    forNewsId: string,
  ) => Promise<{ ok: true; url: string | null } | { ok: false; error: string }>
}

type Props = {
  m: Messages['admin']
  newsId: string | null
  currentUrl: string | null
  disabled?: boolean
}

export const NewsCoverImageField = forwardRef<NewsCoverImageFieldHandle, Props>(
  function NewsCoverImageField({ m, newsId, currentUrl, disabled }, ref) {
    const inputId = useId()
    const inputRef = useRef<HTMLInputElement>(null)
    const [preview, setPreview] = useState<string | null>(currentUrl)
    const [pendingBlob, setPendingBlob] = useState<Blob | null>(null)
    const [pendingMime] = useState('image/webp')
    const [meta, setMeta] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const storedUrlRef = useRef(currentUrl)
    const pendingBlobRef = useRef<Blob | null>(null)
    const pendingMimeRef = useRef('image/webp')
    const removeOnSaveRef = useRef(false)

    useEffect(() => {
      storedUrlRef.current = currentUrl
      setPreview(currentUrl)
      pendingBlobRef.current = null
      setPendingBlob(null)
      removeOnSaveRef.current = false
      setMeta(null)
      setError(null)
    }, [currentUrl, newsId])

    useEffect(() => {
      pendingBlobRef.current = pendingBlob
    }, [pendingBlob])
    useEffect(() => {
      pendingMimeRef.current = pendingMime
    }, [pendingMime])

    useEffect(() => {
      return () => {
        if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
      }
    }, [preview])

    useImperativeHandle(ref, () => ({
      async resolveImageUrl(forNewsId: string) {
        const blob = pendingBlobRef.current
        const remove = removeOnSaveRef.current

        if (remove && !blob) {
          if (storedUrlRef.current && isStoredNewsImage(storedUrlRef.current)) {
            await deleteNewsImageByUrl(storedUrlRef.current)
          }
          return { ok: true, url: null }
        }

        if (!blob) return { ok: true, url: storedUrlRef.current }

        if (storedUrlRef.current && isStoredNewsImage(storedUrlRef.current)) {
          await deleteNewsImageByUrl(storedUrlRef.current)
        }

        if (supabase) {
          const uploaded = await uploadNewsImage(blob, forNewsId, pendingMimeRef.current, 'cover')
          if (!uploaded.ok) return { ok: false, error: uploaded.error }
          return { ok: true, url: uploaded.url }
        }

        const local = await blobToLocalNewsImageUrl(blob)
        if (!local.ok) return { ok: false, error: local.error }
        return { ok: true, url: local.url }
      },
    }))

    async function onPickFile(file: File | null) {
      if (!file) return
      setError(null)
      setBusy(true)
      removeOnSaveRef.current = false

      try {
        const compressed = await compressEventImage(file)
        if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
        setPreview(URL.createObjectURL(compressed.blob))
        pendingBlobRef.current = compressed.blob
        setPendingBlob(compressed.blob)
        pendingMimeRef.current = compressed.mime
        setMeta(
          `${compressed.width}×${compressed.height} · ${formatImageSize(compressed.bytes)} · ${compressed.mime.includes('webp') ? 'WebP' : 'JPEG'}`,
        )
      } catch (e) {
        const code = e instanceof Error ? e.message : ''
        if (code === 'invalid_type') setError(m.imageInvalidType)
        else if (code === 'file_too_large' || code === 'still_too_large') setError(m.imageTooLarge)
        else setError(m.imageCompressFailed)
      } finally {
        setBusy(false)
      }
    }

    function markRemove() {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
      setPreview(null)
      pendingBlobRef.current = null
      setPendingBlob(null)
      setMeta(null)
      removeOnSaveRef.current = true
      if (inputRef.current) inputRef.current.value = ''
    }

    return (
      <div className="space-y-2">
        <span className="text-sm font-medium text-slate-700">{m.newsCoverImage}</span>
        {preview ? (
          <div className="flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
            <img src={preview} alt="" className="max-h-full max-w-full object-contain" />
          </div>
        ) : (
          <div className="flex aspect-[16/10] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
            {m.imageNoPreview}
          </div>
        )}
        {meta && (
          <p className="text-xs text-slate-500">
            {m.imageOptimized} {meta}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <label
            htmlFor={inputId}
            className={`inline-flex cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-urgen-navy hover:bg-slate-50 ${disabled || busy ? 'pointer-events-none opacity-50' : ''}`}
          >
            {busy ? m.imageCompressing : preview ? m.imageReplace : m.imagePick}
          </label>
          {preview && (
            <button
              type="button"
              disabled={disabled || busy}
              onClick={markRemove}
              className="rounded-xl px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {m.imageRemove}
            </button>
          )}
        </div>
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
  },
)


