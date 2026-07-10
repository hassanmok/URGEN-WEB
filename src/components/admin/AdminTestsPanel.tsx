import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Messages } from '../../i18n/messages'
import { getCategoryLabel, sortCategories } from '../../lib/categoryLabels'
import { slugify } from '../../lib/slugify'
import {
  createTestCategory,
  deleteTestCategory,
  fetchTestCategories,
  updateTestCategory,
} from '../../lib/testCategoriesStore'
import {
  createTest,
  deleteTest,
  emptyTestAdminInput,
  fetchAllTestsAdmin,
  testToAdminInput,
  updateTest,
  type TestAdminInput,
} from '../../lib/testsAdminStore'
import { supabase } from '../../lib/supabase'
import type { TestCategoryInput, TestCategoryRecord } from '../../types/testCategory'
import type { LabTest } from '../../types/labTest'
import { Button } from '../ui/Button'
import { useLocaleContext } from '../../i18n/useLocaleContext'

type Props = { m: Messages['admin'] }

const inputClass =
  'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20'

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

const emptyCategoryForm = (): TestCategoryInput => ({
  slug: '',
  title_ar: '',
  title_en: '',
  sort_order: 0,
})

export function AdminTestsPanel({ m }: Props) {
  const { locale } = useLocaleContext()
  const [categories, setCategories] = useState<TestCategoryRecord[]>([])
  const [tests, setTests] = useState<LabTest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [catForm, setCatForm] = useState<TestCategoryInput>(emptyCategoryForm())
  const [editingCatSlug, setEditingCatSlug] = useState<string | null>(null)

  const [testForm, setTestForm] = useState<TestAdminInput>(emptyTestAdminInput())
  const [editingTestId, setEditingTestId] = useState<string | null>(null)

  const sortedCategories = useMemo(() => sortCategories(categories), [categories])

  async function reload() {
    setLoading(true)
    const [cats, tsts] = await Promise.all([fetchTestCategories(), fetchAllTestsAdmin()])
    setCategories(cats)
    setTests(tsts)
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [])

  function showOk(text: string) {
    setMessage({ type: 'ok', text })
  }

  function showErr(text: string) {
    setMessage({ type: 'err', text })
  }

  function resetCategoryForm() {
    setEditingCatSlug(null)
    setCatForm(emptyCategoryForm())
  }

  function resetTestForm() {
    setEditingTestId(null)
    setTestForm(emptyTestAdminInput())
  }

  function startEditCategory(cat: TestCategoryRecord) {
    setEditingCatSlug(cat.slug)
    setCatForm({
      slug: cat.slug,
      title_ar: cat.title_ar,
      title_en: cat.title_en ?? '',
      sort_order: cat.sort_order,
    })
    setMessage(null)
  }

  function startEditTest(test: LabTest) {
    setEditingTestId(test.id)
    setTestForm(testToAdminInput(test))
    setMessage(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function onSubmitCategory(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    const slug = catForm.slug.trim() || slugify(catForm.title_en || catForm.title_ar)
    const payload: TestCategoryInput = { ...catForm, slug }
    if (!payload.slug || !payload.title_ar.trim()) {
      showErr(m.testsErrRequired)
      return
    }
    setSubmitting(true)
    const result = editingCatSlug
      ? await updateTestCategory(editingCatSlug, payload)
      : await createTestCategory(payload)
    setSubmitting(false)
    if (!result.ok) {
      showErr(m.testsErrSave)
      return
    }
    showOk(editingCatSlug ? m.testsCategoryUpdated : m.testsCategoryCreated)
    resetCategoryForm()
    await reload()
  }

  async function onDeleteCategory(slug: string) {
    const count = tests.filter((t) => t.category === slug).length
    const msg = count > 0 ? m.testsCategoryDeleteConfirm.replace('{n}', String(count)) : m.testsDeleteConfirm
    if (!window.confirm(msg)) return
    setSubmitting(true)
    const result = await deleteTestCategory(slug)
    setSubmitting(false)
    if (!result.ok) {
      showErr(m.testsErrSave)
      return
    }
    showOk(m.testsCategoryDeleted)
    if (editingCatSlug === slug) resetCategoryForm()
    await reload()
  }

  async function onSubmitTest(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (!testForm.slug.trim() || !testForm.title_ar.trim() || !testForm.description_ar.trim()) {
      showErr(m.testsErrRequired)
      return
    }
    setSubmitting(true)
    const result = editingTestId
      ? await updateTest(editingTestId, testForm)
      : await createTest(testForm)
    setSubmitting(false)
    if (!result.ok) {
      showErr(result.error?.includes('duplicate') ? m.testsErrDuplicateSlug : m.testsErrSave)
      return
    }
    showOk(editingTestId ? m.testsUpdated : m.testsCreated)
    resetTestForm()
    await reload()
  }

  async function onDeleteTest(id: string) {
    if (!window.confirm(m.testsDeleteConfirm)) return
    setSubmitting(true)
    const result = await deleteTest(id)
    setSubmitting(false)
    if (!result.ok) {
      showErr(m.testsErrSave)
      return
    }
    showOk(m.testsDeleted)
    if (editingTestId === id) resetTestForm()
    await reload()
  }

  const testsByCategory = useMemo(() => {
    const map = new Map<string, LabTest[]>()
    for (const cat of sortedCategories) map.set(cat.slug, [])
    const other: LabTest[] = []
    for (const t of tests) {
      if (t.category && map.has(t.category)) map.get(t.category)!.push(t)
      else other.push(t)
    }
    return { map, other }
  }, [tests, sortedCategories])

  if (!supabase) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        {m.supabaseRequired}
      </section>
    )
  }

  return (
    <div className="space-y-8">
      {message && (
        <p
          className={
            message.type === 'ok' ? 'text-sm text-green-700' : 'text-sm text-red-600'
          }
        >
          {message.text}
        </p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-urgen-navy">{m.testsCategoriesTitle}</h2>
        <p className="mt-1 text-sm text-slate-500">{m.testsCategoriesHint}</p>

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={onSubmitCategory}>
          <FormRow label={m.testsCategorySlug}>
            <input
              value={catForm.slug}
              onChange={(e) => setCatForm((f) => ({ ...f, slug: e.target.value }))}
              className={inputClass}
              dir="ltr"
              placeholder="immunohistochemistry"
            />
          </FormRow>
          <FormRow label={m.testsCategorySort}>
            <input
              type="number"
              value={catForm.sort_order}
              onChange={(e) =>
                setCatForm((f) => ({ ...f, sort_order: Number.parseInt(e.target.value, 10) || 0 }))
              }
              className={inputClass}
            />
          </FormRow>
          <FormRow label={m.testsCategoryTitleAr}>
            <input
              value={catForm.title_ar}
              onChange={(e) => setCatForm((f) => ({ ...f, title_ar: e.target.value }))}
              className={inputClass}
              dir="rtl"
            />
          </FormRow>
          <FormRow label={m.testsCategoryTitleEn}>
            <input
              value={catForm.title_en}
              onChange={(e) => setCatForm((f) => ({ ...f, title_en: e.target.value }))}
              className={inputClass}
              dir="ltr"
              placeholder="Oncology / Somatic"
            />
          </FormRow>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="submit" disabled={submitting}>
              {editingCatSlug ? m.testsCategorySave : m.testsCategoryAdd}
            </Button>
            {editingCatSlug && (
              <Button type="button" variant="ghost" onClick={resetCategoryForm}>
                {m.cancel}
              </Button>
            )}
          </div>
        </form>

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">{m.testsLoading}</p>
        ) : sortedCategories.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">{m.testsCategoriesEmpty}</p>
        ) : (
          <ul className="mt-6 space-y-2">
            {sortedCategories.map((cat) => (
              <li
                key={cat.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-urgen-navy">
                    {getCategoryLabel(cat.slug, locale, categories)}
                  </p>
                  <p className="text-xs text-slate-500" dir="ltr">
                    {cat.slug} · {testsByCategory.map.get(cat.slug)?.length ?? 0}{' '}
                    {m.testsCountLabel}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => startEditCategory(cat)}
                  >
                    {m.edit}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-3 py-1.5 text-xs text-red-600"
                    onClick={() => void onDeleteCategory(cat.slug)}
                  >
                    {m.delete}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-urgen-navy">
            {editingTestId ? m.testsEditTitle : m.testsAddTitle}
          </h2>
          <form className="mt-6 max-h-[70vh] space-y-4 overflow-y-auto pe-1" onSubmit={onSubmitTest}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormRow label={m.testsSlug}>
                <input
                  value={testForm.slug}
                  onChange={(e) => setTestForm((f) => ({ ...f, slug: e.target.value }))}
                  className={inputClass}
                  dir="ltr"
                  required
                />
              </FormRow>
              <FormRow label={m.testsCategory}>
                <select
                  value={testForm.category ?? ''}
                  onChange={(e) =>
                    setTestForm((f) => ({ ...f, category: e.target.value || null }))
                  }
                  className={inputClass}
                >
                  <option value="">{m.testsNoCategory}</option>
                  {sortedCategories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {getCategoryLabel(c.slug, locale, categories)}
                    </option>
                  ))}
                </select>
              </FormRow>
              <FormRow label={m.testsSort}>
                <input
                  type="number"
                  value={testForm.sort_order ?? 0}
                  onChange={(e) =>
                    setTestForm((f) => ({
                      ...f,
                      sort_order: Number.parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className={inputClass}
                />
              </FormRow>
              <FormRow label={m.testsImageUrl}>
                <input
                  value={testForm.image_url ?? ''}
                  onChange={(e) => setTestForm((f) => ({ ...f, image_url: e.target.value }))}
                  className={inputClass}
                  dir="ltr"
                />
              </FormRow>
            </div>

            <fieldset className="space-y-3 rounded-xl border border-slate-100 p-4">
              <legend className="px-1 text-sm font-semibold text-urgen-navy">{m.testsBasicLegend}</legend>
              <FormRow label={m.titleAr}>
                <input
                  value={testForm.title_ar}
                  onChange={(e) => setTestForm((f) => ({ ...f, title_ar: e.target.value }))}
                  className={inputClass}
                  dir="rtl"
                  required
                />
              </FormRow>
              <FormRow label={m.titleEn}>
                <input
                  value={testForm.title_en ?? ''}
                  onChange={(e) => setTestForm((f) => ({ ...f, title_en: e.target.value }))}
                  className={inputClass}
                  dir="ltr"
                />
              </FormRow>
              <FormRow label={m.descAr}>
                <textarea
                  value={testForm.description_ar}
                  onChange={(e) => setTestForm((f) => ({ ...f, description_ar: e.target.value }))}
                  className={`${inputClass} min-h-[72px]`}
                  dir="rtl"
                  required
                />
              </FormRow>
              <FormRow label={m.descEn}>
                <textarea
                  value={testForm.description_en ?? ''}
                  onChange={(e) => setTestForm((f) => ({ ...f, description_en: e.target.value }))}
                  className={`${inputClass} min-h-[72px]`}
                  dir="ltr"
                />
              </FormRow>
            </fieldset>

            <fieldset className="space-y-3 rounded-xl border border-slate-100 p-4">
              <legend className="px-1 text-sm font-semibold text-urgen-navy">{m.testsLabLegend}</legend>
              {(
                [
                  ['clinical_use', m.testsClinicalUse],
                  ['sample', m.testsSample],
                  ['method', m.testsMethod],
                  ['turnaround', m.testsTurnaround],
                  ['price_display', m.testsPrice],
                ] as const
              ).map(([key, legend]) => (
                <div key={key} className="grid gap-3 sm:grid-cols-2">
                  <FormRow label={`${legend} (${m.testsLangAr})`}>
                    <textarea
                      value={(testForm[`${key}_ar` as keyof TestAdminInput] as string) ?? ''}
                      onChange={(e) =>
                        setTestForm((f) => ({ ...f, [`${key}_ar`]: e.target.value }))
                      }
                      className={`${inputClass} min-h-[60px]`}
                      dir="rtl"
                    />
                  </FormRow>
                  <FormRow label={`${legend} (${m.testsLangEn})`}>
                    <textarea
                      value={(testForm[`${key}_en` as keyof TestAdminInput] as string) ?? ''}
                      onChange={(e) =>
                        setTestForm((f) => ({ ...f, [`${key}_en`]: e.target.value }))
                      }
                      className={`${inputClass} min-h-[60px]`}
                      dir="ltr"
                    />
                  </FormRow>
                </div>
              ))}
            </fieldset>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={submitting}>
                {editingTestId ? m.saveChanges : m.testsCreate}
              </Button>
              {editingTestId && (
                <Button type="button" variant="ghost" onClick={resetTestForm}>
                  {m.cancel}
                </Button>
              )}
            </div>
          </form>
        </section>

        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-urgen-navy">{m.testsListTitle}</h2>
          {loading ? (
            <p className="mt-6 text-sm text-slate-500">{m.testsLoading}</p>
          ) : tests.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">{m.testsEmpty}</p>
          ) : (
            <div className="mt-6 max-h-[70vh] space-y-6 overflow-y-auto">
              {sortedCategories.map((cat) => {
                const list = testsByCategory.map.get(cat.slug) ?? []
                if (!list.length) return null
                return (
                  <div key={cat.slug}>
                    <h3 className="text-sm font-bold text-urgen-purple">
                      {getCategoryLabel(cat.slug, locale, categories)}
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {list.map((t) => (
                        <TestListRow
                          key={t.id}
                          test={t}
                          m={m}
                          onEdit={() => startEditTest(t)}
                          onDelete={() => void onDeleteTest(t.id)}
                        />
                      ))}
                    </ul>
                  </div>
                )
              })}
              {testsByCategory.other.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-600">{m.testsNoCategory}</h3>
                  <ul className="mt-2 space-y-2">
                    {testsByCategory.other.map((t) => (
                      <TestListRow
                        key={t.id}
                        test={t}
                        m={m}
                        onEdit={() => startEditTest(t)}
                        onDelete={() => void onDeleteTest(t.id)}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function TestListRow({
  test,
  m,
  onEdit,
  onDelete,
}: {
  test: LabTest
  m: Messages['admin']
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm">
      <div className="min-w-0">
        <p className="font-semibold text-urgen-navy">{test.title_ar}</p>
        <p className="truncate text-xs text-slate-500" dir="ltr">
          {test.slug}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button type="button" variant="outline" className="px-2 py-1 text-xs" onClick={onEdit}>
          {m.edit}
        </Button>
        <Button type="button" variant="ghost" className="px-2 py-1 text-xs text-red-600" onClick={onDelete}>
          {m.delete}
        </Button>
      </div>
    </li>
  )
}
