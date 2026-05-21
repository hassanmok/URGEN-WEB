import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import { useTests } from '../../hooks/useTests'
import { Button } from '../ui/Button'
import { isPatientNameComplete } from '../../lib/patientName'
import {
  fetchDoctorCaseFiles,
  isAllowedDoctorCaseFile,
  updateDoctorCase,
  type DoctorAgeUnit,
  type DoctorCaseFileRow,
  type DoctorCaseRow,
  type DoctorCaseTestRow,
  type DoctorDiseaseType,
  type DoctorGender,
} from '../../lib/doctorCasesStore'
import type { Messages } from '../../i18n/messages'

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
  const [tumorType, setTumorType] = useState(row.oncology_tumor_type ?? '')
  const [stage, setStage] = useState(row.oncology_stage ?? '')
  const [treatment, setTreatment] = useState(row.oncology_treatment ?? '')
  const [selectedTests, setSelectedTests] = useState<Set<string>>(
    () => new Set(caseTests.map((t) => t.test_slug)),
  )
  const [existingFiles, setExistingFiles] = useState<DoctorCaseFileRow[]>([])
  const [removeFileIds, setRemoveFileIds] = useState<Set<string>>(new Set())
  const [newFiles, setNewFiles] = useState<File[]>([])
  const newFilesRef = useRef<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const sortedTests = useMemo(
    () =>
      [...tests].sort((a, b) =>
        locale === 'ar'
          ? a.title_ar.localeCompare(b.title_ar, 'ar')
          : (a.title_en ?? a.title_ar).localeCompare(b.title_en ?? b.title_ar, 'en'),
      ),
    [tests, locale],
  )

  useEffect(() => {
    void fetchDoctorCaseFiles(row.id).then((res) => {
      if (res.ok && res.rows) setExistingFiles(res.rows)
    })
  }, [row.id])

  function toggleTest(slug: string) {
    setSelectedTests((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
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

    if (selectedTests.size === 0) {
      setMsg({ ok: false, text: m.selectAtLeastOneTest })
      return
    }

    setBusy(true)
    const res = await updateDoctorCase(row.id, {
      patientName: parts,
      age_value: age,
      age_unit: ageUnit,
      gender,
      diagnosis,
      disease_type: diseaseType,
      oncology_tumor_type: diseaseType === 'oncology' ? tumorType : undefined,
      oncology_stage: diseaseType === 'oncology' ? stage : undefined,
      oncology_treatment: diseaseType === 'oncology' ? treatment : undefined,
      test_slugs: [...selectedTests],
      newFiles: newFilesRef.current,
      removeFileIds: [...removeFileIds],
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

  const visibleExisting = existingFiles.filter((f) => !removeFileIds.has(f.id))

  return (
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
            ] as const
          ).map(([val, label]) => (
            <label key={val} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name={`diseaseType-${row.id}`}
                value={val}
                checked={diseaseType === val}
                onChange={() => setDiseaseType(val)}
              />
              {label}
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

      <fieldset className="mt-4 block">
        <legend className="text-sm font-semibold text-urgen-navy">{m.testSelect}</legend>
        <p className="mt-1 text-xs text-slate-500">{m.testSelectHint}</p>
        <div className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
          {loadingTests ? (
            <p className="text-sm text-slate-500">{m.loadingTests}</p>
          ) : (
            sortedTests.map((t) => (
              <label
                key={t.slug}
                className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  className="mt-1 rounded border-slate-300 text-urgen-purple focus:ring-urgen-purple"
                  checked={selectedTests.has(t.slug)}
                  onChange={() => toggleTest(t.slug)}
                />
                <span className="text-sm text-slate-800">
                  {locale === 'ar' ? t.title_ar : (t.title_en ?? t.title_ar)}
                </span>
              </label>
            ))
          )}
        </div>
      </fieldset>

      <div className="mt-4">
        <p className="text-sm font-semibold text-urgen-navy">{m.attachFiles}</p>
        {visibleExisting.length > 0 && (
          <ul className="mt-2 space-y-1">
            {existingFiles.map((f) => {
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
  )
}
