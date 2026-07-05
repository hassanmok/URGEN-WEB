import { useMemo, useState, type FormEvent } from 'react'
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
  updatePartnerSubmissionBatch,
  type PartnerAgeUnit,
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
  m: Messages['partnerPortal']
  onCancel: () => void
  onSaved: () => void
}

export function PartnerSubmissionEditForm({ group, m, onCancel, onSaved }: Props) {
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

    setBusy(true)
    const res = await updatePartnerSubmissionBatch({
      existingItems: group.items,
      patient_full_name: buildPatientFullName(parts),
      age_value: age,
      age_unit: ageUnit,
      test_slugs: [...selectedTests],
      other_test_titles: Object.fromEntries(otherTestTitles.entries()),
    })
    setBusy(false)

    if (!res.ok) {
      const errMap: Record<string, string> = {
        not_editable: m.cannotEditAccepted,
        no_tests: m.selectAtLeastOneTest,
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
