import { createElement, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Messages } from '../../i18n/messages'
import {
  createNews,
  deleteNews,
  fetchAllNewsAdmin,
  updateNews,
} from '../../lib/newsStore'
import type { NewsInput, NewsRecord } from '../../types/news'
import { Button } from '../ui/Button'
import {
  NewsCoverImageField,
  type NewsCoverImageFieldHandle,
} from './NewsCoverImageField'
import {
  galleryToResolved,
  NewsGalleryField,
  type GalleryDraft,
} from './NewsGalleryField'

type Props = {
  m: Messages['admin']
}

const inputClass =
  'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20'

const Box = ({ className, children }: { className?: string; children?: React.ReactNode }) =>
  createElement('div', { className }, children)

const emptyForm: NewsInput = {
  title_ar: '',
  title_en: '',
  summary_ar: '',
  summary_en: '',
  body_ar: '',
  body_en: '',
  cover_image_url: null,
  published: true,
}

function newsToGallery(items: NewsRecord['images']): GalleryDraft[] {
  return items.map((img) => ({
    localId: img.id,
    id: img.id,
    image_url: img.image_url,
    preview: img.image_url,
    caption_ar: img.caption_ar ?? '',
    caption_en: img.caption_en ?? '',
    sort_order: img.sort_order,
  }))
}

export function AdminNewsPanel({ m }: Props) {
  const [items, setItems] = useState<NewsRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<NewsInput>(emptyForm)
  const [gallery, setGallery] = useState<GalleryDraft[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const coverRef = useRef<NewsCoverImageFieldHandle>(null)

  async function reload() {
    setLoading(true)
    setItems(await fetchAllNewsAdmin())
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [])

  function startEdit(item: NewsRecord) {
    setEditingId(item.id)
    setForm({
      title_ar: item.title_ar,
      title_en: item.title_en,
      summary_ar: item.summary_ar,
      summary_en: item.summary_en,
      body_ar: item.body_ar,
      body_en: item.body_en,
      cover_image_url: item.cover_image_url,
      published: item.published,
    })
    setGallery(newsToGallery(item.images))
    setMessage(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setGallery([])
    setMessage(null)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (
      !form.title_ar.trim() ||
      !form.title_en.trim() ||
      !form.summary_ar.trim() ||
      !form.summary_en.trim() ||
      !form.body_ar.trim() ||
      !form.body_en.trim()
    ) {
      setMessage({ type: 'err', text: m.newsErrRequired })
      return
    }

    setSubmitting(true)
    const targetId = editingId ?? crypto.randomUUID()
    const coverResolved = await coverRef.current?.resolveImageUrl(targetId)
    if (coverResolved && !coverResolved.ok) {
      setSubmitting(false)
      setMessage({ type: 'err', text: m.imageUploadFailed })
      return
    }

    const payload: NewsInput = {
      ...form,
      cover_image_url: coverResolved?.url ?? (form.cover_image_url?.trim() || null),
    }

    const resolvedGallery = galleryToResolved(gallery)
    const previousUrls =
      editingId != null
        ? (items.find((n) => n.id === editingId)?.images.map((i) => i.image_url) ?? [])
        : []

    const result = editingId
      ? await updateNews(editingId, payload, {
          gallery: resolvedGallery,
          previousGalleryUrls: previousUrls,
        })
      : await createNews(payload, { id: targetId, gallery: resolvedGallery })

    setSubmitting(false)
    if (!result.ok) {
      setMessage({ type: 'err', text: m.saveFailed })
      return
    }

    setMessage({ type: 'ok', text: editingId ? m.newsUpdated : m.newsCreated })
    cancelEdit()
    await reload()
  }

  async function onDelete(id: string) {
    if (!window.confirm(m.newsConfirmDelete)) return
    const result = await deleteNews(id)
    if (!result.ok) {
      setMessage({ type: 'err', text: m.saveFailed })
      return
    }
    if (editingId === id) cancelEdit()
    await reload()
  }

  return (
    <Box className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-urgen-navy">
          {editingId ? m.editNews : m.addNews}
        </h2>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <FormRow label={m.titleAr}>
            <input
              value={form.title_ar}
              onChange={(e) => setForm((f) => ({ ...f, title_ar: e.target.value }))}
              className={inputClass}
              dir="rtl"
            />
          </FormRow>
          <FormRow label={m.titleEn}>
            <input
              value={form.title_en}
              onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))}
              className={inputClass}
              dir="ltr"
            />
          </FormRow>
          <FormRow label={m.newsSummaryAr}>
            <textarea
              value={form.summary_ar}
              onChange={(e) => setForm((f) => ({ ...f, summary_ar: e.target.value }))}
              className={`${inputClass} min-h-[72px]`}
              dir="rtl"
            />
          </FormRow>
          <FormRow label={m.newsSummaryEn}>
            <textarea
              value={form.summary_en}
              onChange={(e) => setForm((f) => ({ ...f, summary_en: e.target.value }))}
              className={`${inputClass} min-h-[72px]`}
              dir="ltr"
            />
          </FormRow>
          <FormRow label={m.newsBodyAr}>
            <textarea
              value={form.body_ar}
              onChange={(e) => setForm((f) => ({ ...f, body_ar: e.target.value }))}
              className={`${inputClass} min-h-[140px]`}
              dir="rtl"
            />
          </FormRow>
          <FormRow label={m.newsBodyEn}>
            <textarea
              value={form.body_en}
              onChange={(e) => setForm((f) => ({ ...f, body_en: e.target.value }))}
              className={`${inputClass} min-h-[140px]`}
              dir="ltr"
            />
          </FormRow>
          <NewsCoverImageField
            ref={coverRef}
            m={m}
            newsId={editingId}
            currentUrl={form.cover_image_url}
            disabled={submitting}
          />
          <NewsGalleryField m={m} items={gallery} onChange={setGallery} disabled={submitting} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              className="rounded border-slate-300 text-urgen-purple focus:ring-urgen-purple"
            />
            {m.published}
          </label>
          {message && (
            <p className={message.type === 'ok' ? 'text-sm text-green-700' : 'text-sm text-red-600'}>
              {message.text}
            </p>
          )}
          <Box className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? m.saving : editingId ? m.saveChanges : m.createNews}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={cancelEdit}>
                {m.cancel}
              </Button>
            )}
          </Box>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Box className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-urgen-navy">{m.newsList}</h2>
          <Link to="/news" className="text-sm font-medium text-urgen-purple hover:underline">
            {m.viewNews}
          </Link>
        </Box>
        {loading ? (
          <p className="text-sm text-slate-500">{m.newsLoading}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">{m.noNews}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-start gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4"
              >
                {item.cover_image_url && (
                  <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1 sm:h-24 sm:w-36">
                    <img
                      src={item.cover_image_url}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
                <Box className="min-w-0 flex-1">
                  <p className="font-semibold text-urgen-navy">{item.title_ar}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(item.created_at).toLocaleDateString()}
                    {!item.published && ` · ${m.draft}`}
                    {item.images.length > 0 && ` · ${item.images.length} ${m.newsPhotosCount}`}
                  </p>
                </Box>
                <Box className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => startEdit(item)}
                  >
                    {m.edit}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                    onClick={() => void onDelete(item.id)}
                  >
                    {m.delete}
                  </Button>
                </Box>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Box>
  )
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <Box className="mt-1">{children}</Box>
    </label>
  )
}
