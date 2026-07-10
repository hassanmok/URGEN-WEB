import { useMemo, useRef, useState, type FormEvent } from 'react'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import { useTests } from '../../hooks/useTests'
import { TestCheckboxPicker } from '../shared/TestCheckboxPicker'
import { Button } from '../ui/Button'
import { OtherTextDialog } from '../ui/OtherTextDialog'
import {
  buildPatientFullName,
  isPatientNameComplete,
  splitPatientFullName,
} from '../../lib/patientName'
import { isCustomOtherTestSlug, newCustomOtherTestSlug } from '../../lib/doctorCasesStore'
import {
  isAllowedPartnerSubmissionFile,
  updatePartnerSubmissionBatch,
  type PartnerAgeUnit,
  type PartnerSubmissionFileRow,
  type PartnerSubmissionGroup,
} from '../../lib/partnerSubmissionsStore'
import type { Messages } from '../../i18n/messages'

const inputClass =
  'mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20'

function initOtherTestTitles(group: PartnerSubmissionGroup): Map<string, string> {
  const map = new Map<string, string>()
  for (const item of group.items) {
    if (isCustomOtherTestSlug(item.test_slug) && item.test_title_override?.trim()) {
      map.set(item.test_slug, item.test_title_override.trim())
    }
  }
  return map
}

type Props = {
  group: PartnerSubmissionGroup
  existingFiles: PartnerSubmissionFileRow[]
  m: Messages['partnerPortal']
  onCancel: () => void
  onSaved: () => void
}

export function PartnerSubmissionEditForm({
  group,
  existingFiles,
  m,
  onCancel,
  onSaved,
}: Props) {
  const { locale } = useLocaleContext()
  const { tests, loading: loadingTests } = useTests()

  const initialNames = splitPatientFullName(group.patient_full_name)
  const [name1, setName1] = useState(initialNames[0])
  const [name2, setName2] = useState(initialNames[1])
  const [name3, setName3] = useState(initialNames[2])
  const [name4, setName4] = useState(initialNames[3])
  const [ageValue, setAgeValue] = useState(String(group.age_value))
  const [ageUnit, setAgeUnit] = useState<PartnerAgeUnit>(group.age_unit as PartnerAgeUnit)
  const [selectedTests, setSelectedTests] = useState<Set<string>>(
    () => new Set(group.items.map((item) => item.test_slug)),
  )
  const [otherTestTitles, setOtherTestTitles] = useState<Map<string, string>>(() =>
    initOtherTestTitles(group),
  )
  const [testOtherDialogOpen, setTestOtherDialogOpen] = useState(false)
  const [keptFiles, setKeptFiles] = useState<PartnerSubmissionFileRow[]>(existingFiles)
  const [newFiles, setNewFiles] = useState<File[]>([])
  const newFilesRef = useRef<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const testPickerLabels = useMemo(
    () => ({
      legend: m.testSelect,
      hint: m.testSelectHint,
      loading: m.loadingTests,
      empty: m.testPlaceholder,
      searchPlaceholder: m.testSearchPlaceholder,
      searchNoResults: m.testSearchNoResults,
      otherOption: m.testOtherOption,
    }),
    [m],
  )

  function syncNewFiles(next: File[]) {
    newFilesRef.current = next
    setNewFiles(next)
  }

  function addNewFiles(list: FileList | null) {
    if (!list?.length) return
    const accepted: File[] = []
    for (const file of Array.from(list)) {
      if (!isAllowedPartnerSubmissionFile(file)) {
        setMsg({ ok: false, text: m.invalidFileType })
        continue
      }
      if (file.size > 20 * 1024 * 1024) {
        setMsg({ ok: false, text: m.fileTooLarge })
        continue
      }
      accepted.push(file)
    }
    if (accepted.length) syncNewFiles([...newFilesRef.current, ...accepted])
  }

  function toggleTest(slug: string) {
    setSelectedTests((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) {
        next.delete(slug)
        if (isCustomOtherTestSlug(slug)) {
          setOtherTestTitles((map) => {
            const copy = new Map(map)
            copy.delete(slug)
            return copy
          })
        }
      } else {
        next.add(slug)
      }
      return next
    })
  }

  function addOtherTest(title: string) {
    const slug = newCustomOtherTestSlug()
    setOtherTestTitles((map) => new Map(map).set(slug, title))
    setSelectedTests((prev) => new Set(prev).add(slug))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMsg(null)

    const parts = [name1, name2, name3, name4] as const
    if (!isPatientNameComplete(parts)) {
      setMsg({ ok: false, text: m.patientNameRequired })
      return
    }

    const age = Number.parseInt(ageValue, 10)
    if (!Number.isFinite(age) || age <= 0) {
      setMsg({ ok: false, text: m.ageInvalid })
      return
    }

    if (selectedTests.size === 0) {
      setMsg({ ok: false, text: m.selectAtLeastOneTest })
      return
    }

    const removeFileIds = existingFiles
      .filter((f) => !keptFiles.some((k) => k.id === f.id))
      .map((f) => f.id)

    setBusy(true)
    const res = await updatePartnerSubmissionBatch({
      existingItems: group.items,
      patient_full_name: buildPatientFullName(parts),
      age_value: age,
      age_unit: ageUnit,
      test_slugs: [...selectedTests],
      other_test_titles: Object.fromEntries(otherTestTitles.entries()),
      newFiles: newFilesRef.current,
      removeFileIds,
    })
    setBusy(false)

    if (!res.ok) {
      const errMap: Record<string, string> = {
        not_editable: m.cannotEditAccepted,
        no_tests: m.selectAtLeastOneTest,
        invalid_file_type: m.invalidFileType,
        file_too_large: m.fileTooLarge,
      }
      setMsg({ ok: false, text: errMap[res.error ?? ''] ?? m.updateErr })
      return
    }

    setMsg({ ok: true, text: m.updateOk })
    onSaved()
  }

  return (
    <>
      <form className="rounded-xl border border-urgen-purple/30 bg-white p-4 shadow-sm" onSubmit={onSubmit}>
        <h3 className="font-bold text-urgen-navy">{m.editRequestTitle}</h3>
        <p className="mt-1 text-xs text-slate-600">{m.editRequestHint}</p>

        <fieldset className="mt-4 block">
          <legend className="text-sm font-semibold text-urgen-navy">{m.patientName}</legend>
          <p className="mt-1 text-xs text-slate-500">{m.patientNameHint}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(
              [
                [m.patientNamePart1, name1, setName1],
                [m.patientNamePart2, name2, setName2],
                [m.patientNamePart3, name3, setName3],
                [m.patientNamePart4, name4, setName4],
              ] as const
            ).map(([label, value, setValue]) => (
              <label key={label} className="block text-sm text-slate-700">
                {label}
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className={inputClass}
                  required
                />
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-urgen-navy">
            {m.ageValue}
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={ageValue}
              onChange={(e) => setAgeValue(e.target.value)}
              className={inputClass}
              required
            />
          </label>
          <label className="block text-sm font-semibold text-urgen-navy">
            {m.ageUnit}
            <select
              value={ageUnit}
              onChange={(e) => setAgeUnit(e.target.value as PartnerAgeUnit)}
              className={inputClass}
            >
              <option value="days">{m.ageUnitDays}</option>
              <option value="months">{m.ageUnitMonths}</option>
              <option value="years">{m.ageUnitYears}</option>
            </select>
          </label>
        </div>

        <TestCheckboxPicker
          tests={tests}
          loading={loadingTests}
          selectedTests={selectedTests}
          onToggle={toggleTest}
          locale={locale}
          labels={testPickerLabels}
          otherTests={otherTestTitles}
          onRequestAddOther={() => setTestOtherDialogOpen(true)}
          className="mt-4"
        />

        <div className="mt-4">
          <p className="text-sm font-semibold text-urgen-navy">{m.attachFiles}</p>
          <p className="mt-1 text-xs text-slate-500">{m.attachFilesHint}</p>

          {keptFiles.length > 0 && (
            <ul className="mt-3 space-y-1">
              {keptFiles.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{f.file_name}</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600"
                    onClick={() => setKeptFiles((prev) => prev.filter((x) => x.id !== f.id))}
                  >
                    {m.removeFile}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(e) => {
              addNewFiles(e.target.files)
              e.currentTarget.value = ''
            }}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="text-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              {m.attachFilesPick}
            </Button>
            {newFiles.length > 0 && (
              <span className="text-sm font-medium text-emerald-800">
                {m.filesSelected.replace('{n}', String(newFiles.length))}
              </span>
            )}
          </div>
          {newFiles.length > 0 && (
            <ul className="mt-3 space-y-1">
              {newFiles.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600"
                    onClick={() =>
                      syncNewFiles(newFilesRef.current.filter((_, idx) => idx !== i))
                    }
                  >
                    {m.removeFile}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {msg && (
          <p className={`mt-4 text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="submit" disabled={busy}>
            {busy ? m.savingEdit : m.saveEdit}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            {m.cancelEdit}
          </Button>
        </div>
      </form>

      <OtherTextDialog
        open={testOtherDialogOpen}
        title={m.testOtherDialogTitle}
        placeholder={m.testOtherPlaceholder}
        confirmLabel={m.otherDone}
        onConfirm={addOtherTest}
        onClose={() => setTestOtherDialogOpen(false)}
      />
    </>
  )
}
