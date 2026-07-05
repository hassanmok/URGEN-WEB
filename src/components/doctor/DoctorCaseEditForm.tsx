import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import { useTests } from '../../hooks/useTests'
import { TestCheckboxPicker } from '../shared/TestCheckboxPicker'
import { Button } from '../ui/Button'
import { isPatientNameComplete } from '../../lib/patientName'
import { testDisplayTitle } from '../../lib/testCatalog'
import {
  buildRequestFormImageContext,
  doctorDiseaseTypeLabel,
  fetchDoctorCaseFiles,
  isAllowedDoctorCaseFile,
  isCustomOtherTestSlug,
  isDoctorRequestFormFile,
  newCustomOtherTestSlug,
  splitDoctorCaseFiles,
  updateDoctorCase,
  type DoctorAgeUnit,
  type DoctorCaseFileRow,
  type DoctorCaseRow,
  type DoctorCaseTestRow,
  type DoctorDiseaseType,
  type DoctorGender,
} from '../../lib/doctorCasesStore'
import { OtherTextDialog } from '../ui/OtherTextDialog'
import type { Messages } from '../../i18n/messages'

function initOtherTestTitles(caseTests: DoctorCaseTestRow[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const t of caseTests) {
    if (isCustomOtherTestSlug(t.test_slug) && t.test_title_override?.trim()) {
      map.set(t.test_slug, t.test_title_override.trim())
    }
  }
  return map
}

const inputClass =
  'mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20'

type Props = {
  row: DoctorCaseRow
  caseTests: DoctorCaseTestRow[]
  m: Messages['doctorPortal']
  onCancel: () => void
  onSaved: () => void
}

export function DoctorCaseEditForm({ row, caseTests, m, onCancel, onSaved }: Props) {
  const { locale } = useLocaleContext()
  const { tests, loading: loadingTests } = useTests()

  const [name1, setName1] = useState(row.patient_name1)
  const [name2, setName2] = useState(row.patient_name2)
  const [name3, setName3] = useState(row.patient_name3)
  const [name4, setName4] = useState(row.patient_name4)
  const [ageValue, setAgeValue] = useState(String(row.age_value))
  const [ageUnit, setAgeUnit] = useState<DoctorAgeUnit>(row.age_unit as DoctorAgeUnit)
  const [gender, setGender] = useState<DoctorGender>(row.gender as DoctorGender)
  const [diagnosis, setDiagnosis] = useState(row.diagnosis)
  const [diseaseType, setDiseaseType] = useState<DoctorDiseaseType>(row.disease_type as DoctorDiseaseType)
  const [diseaseTypeOther, setDiseaseTypeOther] = useState(row.disease_type_other ?? '')
  const [diseaseOtherDialogOpen, setDiseaseOtherDialogOpen] = useState(false)
  const [tumorType, setTumorType] = useState(row.oncology_tumor_type ?? '')
  const [stage, setStage] = useState(row.oncology_stage ?? '')
  const [treatment, setTreatment] = useState(row.oncology_treatment ?? '')
  const [selectedTests, setSelectedTests] = useState<Set<string>>(
    () => new Set(caseTests.map((t) => t.test_slug)),
  )
  const [otherTestTitles, setOtherTestTitles] = useState<Map<string, string>>(() =>
    initOtherTestTitles(caseTests),
  )
  const [testOtherDialogOpen, setTestOtherDialogOpen] = useState(false)
  const [existingFiles, setExistingFiles] = useState<DoctorCaseFileRow[]>([])
  const [removeFileIds, setRemoveFileIds] = useState<Set<string>>(new Set())
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

  useEffect(() => {
    void fetchDoctorCaseFiles(row.id).then((res) => {
      if (res.ok && res.rows) setExistingFiles(res.rows)
    })
  }, [row.id])

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

  function syncNewFiles(next: File[]) {
    newFilesRef.current = next
    setNewFiles(next)
  }

  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files
    if (!list?.length) return
    const accepted: File[] = []
    for (const file of Array.from(list)) {
      if (isAllowedDoctorCaseFile(file)) accepted.push(file)
    }
    if (accepted.length) syncNewFiles([...newFilesRef.current, ...accepted])
    e.target.value = ''
  }

  function toggleRemoveFile(id: string) {
    setRemoveFileIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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

    if (!diagnosis.trim()) {
      setMsg({ ok: false, text: m.diagnosisRequired })
      return
    }

    if (diseaseType === 'oncology') {
      if (!tumorType.trim() || !stage.trim() || !treatment.trim()) {
        setMsg({ ok: false, text: m.oncologyFieldsRequired })
        return
      }
    }

    if (diseaseType === 'other' && !diseaseTypeOther.trim()) {
      setMsg({ ok: false, text: m.diseaseOtherRequired })
      return
    }

    if (selectedTests.size === 0) {
      setMsg({ ok: false, text: m.selectAtLeastOneTest })
      return
    }

    const allTestTitles = [
      ...[...selectedTests]
        .filter((slug) => !isCustomOtherTestSlug(slug))
        .map((slug) => {
          const t = tests.find((x) => x.slug === slug)
          return t ? testDisplayTitle(t, locale) : slug
        }),
      ...[...selectedTests]
        .filter((slug) => isCustomOtherTestSlug(slug))
        .map((slug) => otherTestTitles.get(slug) ?? slug),
    ]
    const diseaseLabel = doctorDiseaseTypeLabel(
      { disease_type: diseaseType, disease_type_other: diseaseTypeOther },
      {
        oncology: m.diseaseOncology,
        reproductive: m.diseaseReproductive,
        pediatric: m.diseasePediatric,
        other: m.diseaseOther,
      },
    )
    const oncologyDetails =
      diseaseType === 'oncology'
        ? [m.oncologyTumorType, tumorType, m.oncologyStage, stage, m.oncologyTreatment, treatment]
            .filter(Boolean)
            .join(' ')
        : undefined

    setBusy(true)
    const res = await updateDoctorCase(row.id, {
      patientName: parts,
      age_value: age,
      age_unit: ageUnit,
      gender,
      diagnosis,
      disease_type: diseaseType,
      disease_type_other: diseaseType === 'other' ? diseaseTypeOther : null,
      oncology_tumor_type: diseaseType === 'oncology' ? tumorType : undefined,
      oncology_stage: diseaseType === 'oncology' ? stage : undefined,
      oncology_treatment: diseaseType === 'oncology' ? treatment : undefined,
      test_slugs: [...selectedTests],
      other_test_titles: Object.fromEntries(otherTestTitles.entries()),
      newFiles: newFilesRef.current,
      removeFileIds: [...removeFileIds].filter((id) => {
        const f = existingFiles.find((x) => x.id === id)
        return f ? !isDoctorRequestFormFile(f) : true
      }),
      requestFormContext: buildRequestFormImageContext(
        locale,
        { days: m.ageUnitDays, months: m.ageUnitMonths, years: m.ageUnitYears },
        allTestTitles,
        { diseaseTypeLabel: diseaseLabel, oncologyDetails },
      ),
    })
    setBusy(false)

    if (!res.ok) {
      const errMap: Record<string, string> = {
        not_editable: m.cannotEditAccepted,
        no_tests: m.selectAtLeastOneTest,
        invalid_file_type: m.fileTypeErr,
        file_too_large: m.fileSizeErr,
        not_signed_in: m.notDoctor,
      }
      setMsg({ ok: false, text: errMap[res.error ?? ''] ?? m.updateErr })
      return
    }

    setMsg({ ok: true, text: m.updateOk })
    onSaved()
  }

  const { requestForm, attachments: existingAttachments } = splitDoctorCaseFiles(existingFiles)
  const visibleExisting = existingAttachments.filter((f) => !removeFileIds.has(f.id))

  return (
    <>
    <form
      className="rounded-2xl border-2 border-urgen-purple/30 bg-urgen-purple/5 p-5 shadow-sm"
      onSubmit={(e) => void onSubmit(e)}
    >
      <h3 className="font-bold text-urgen-navy">{m.editCaseTitle}</h3>
      <p className="mt-1 text-xs text-slate-600">{m.editCaseHint}</p>

      <fieldset className="mt-4 space-y-3">
        <legend className="text-sm font-semibold text-urgen-navy">{m.patientName}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              [m.patientNamePart1, name1, setName1],
              [m.patientNamePart2, name2, setName2],
              [m.patientNamePart3, name3, setName3],
              [m.patientNamePart4, name4, setName4],
            ] as const
          ).map(([label, val, set]) => (
            <label key={label} className="block text-sm font-medium text-slate-700">
              {label}
              <input
                type="text"
                value={val}
                onChange={(e) => set(e.target.value)}
                className={inputClass}
                required
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-semibold text-urgen-navy">
          {m.ageValue}
          <input
            type="number"
            min={1}
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
            onChange={(e) => setAgeUnit(e.target.value as DoctorAgeUnit)}
            className={inputClass}
          >
            <option value="days">{m.ageUnitDays}</option>
            <option value="months">{m.ageUnitMonths}</option>
            <option value="years">{m.ageUnitYears}</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-urgen-navy">
          {m.gender}
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as DoctorGender)}
            className={inputClass}
          >
            <option value="male">{m.genderMale}</option>
            <option value="female">{m.genderFemale}</option>
            <option value="other">{m.genderOther}</option>
          </select>
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-urgen-navy">
        {m.diagnosis}
        <textarea
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          className={`${inputClass} min-h-[80px]`}
          required
        />
      </label>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-urgen-navy">{m.diseaseType}</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {(
            [
              ['oncology', m.diseaseOncology],
              ['reproductive', m.diseaseReproductive],
              ['pediatric', m.diseasePediatric],
              ['other', m.diseaseOther],
            ] as const
          ).map(([val, label]) => (
            <label key={val} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name={`diseaseType-${row.id}`}
                value={val}
                checked={diseaseType === val}
                onChange={() => {
                  if (val === 'other') setDiseaseOtherDialogOpen(true)
                  else {
                    setDiseaseType(val)
                    setDiseaseTypeOther('')
                  }
                }}
              />
              {val === 'other' && diseaseType === 'other' && diseaseTypeOther
                ? `${label}: ${diseaseTypeOther}`
                : label}
            </label>
          ))}
        </div>
      </fieldset>

      {diseaseType === 'oncology' && (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-semibold text-urgen-navy">
            {m.oncologyTumorType}
            <input
              type="text"
              value={tumorType}
              onChange={(e) => setTumorType(e.target.value)}
              className={inputClass}
              required
            />
          </label>
          <label className="block text-sm font-semibold text-urgen-navy">
            {m.oncologyStage}
            <input
              type="text"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className={inputClass}
              required
            />
          </label>
          <label className="block text-sm font-semibold text-urgen-navy">
            {m.oncologyTreatment}
            <input
              type="text"
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              className={inputClass}
              required
            />
          </label>
        </div>
      )}

      <TestCheckboxPicker
        className="mt-4"
        tests={tests}
        loading={loadingTests}
        selectedTests={selectedTests}
        onToggle={toggleTest}
        locale={locale}
        labels={testPickerLabels}
        otherTests={otherTestTitles}
        onRequestAddOther={() => setTestOtherDialogOpen(true)}
      />

      {requestForm && (
        <p className="mt-4 text-xs text-slate-600">
          {m.requestFormPdf}: {m.requestFormPdfDownload} —{' '}
          <span className="font-medium">{requestForm.file_name}</span>
        </p>
      )}

      <div className="mt-4">
        <p className="text-sm font-semibold text-urgen-navy">{m.attachFiles}</p>
        {visibleExisting.length > 0 && (
          <ul className="mt-2 space-y-1">
            {visibleExisting.map((f) => {
              const marked = removeFileIds.has(f.id)
              return (
                <li
                  key={f.id}
                  className={`flex items-center justify-between gap-2 text-sm ${marked ? 'opacity-50 line-through' : ''}`}
                >
                  <span className="truncate">{f.file_name}</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600"
                    onClick={() => toggleRemoveFile(f.id)}
                  >
                    {marked ? m.undoRemoveFile : m.removeFile}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          className="sr-only"
          onChange={onFilesChange}
        />
        <div className="mt-3 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="text-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            {m.attachFilesPick}
          </Button>
          {newFiles.length > 0 && (
            <span className="text-sm text-emerald-800">
              {m.filesSelected.replace('{n}', String(newFiles.length))}
            </span>
          )}
        </div>
      </div>

      {msg && (
        <p className={`mt-4 text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? m.savingEdit : m.saveEdit}
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
          {m.cancelEdit}
        </Button>
      </div>
    </form>

    <OtherTextDialog
      open={diseaseOtherDialogOpen}
      title={m.diseaseOtherDialogTitle}
      placeholder={m.diseaseOtherPlaceholder}
      confirmLabel={m.otherDone}
      cancelLabel={m.cancelEdit}
      initialValue={diseaseTypeOther}
      onConfirm={(text) => {
        setDiseaseType('other')
        setDiseaseTypeOther(text)
      }}
      onClose={() => setDiseaseOtherDialogOpen(false)}
    />

    <OtherTextDialog
      open={testOtherDialogOpen}
      title={m.testOtherDialogTitle}
      placeholder={m.testOtherPlaceholder}
      confirmLabel={m.otherDone}
      cancelLabel={m.cancelEdit}
      onConfirm={addOtherTest}
      onClose={() => setTestOtherDialogOpen(false)}
    />
  </>
  )
}
