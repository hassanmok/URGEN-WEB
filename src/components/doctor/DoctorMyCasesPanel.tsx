import { useEffect, useMemo, useState } from 'react'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import { useTests } from '../../hooks/useTests'
import { Button } from '../ui/Button'
import {
  attachDoctorRequestFormImage,
  buildRequestFormImageContext,
  createDoctorCaseFileDownloadUrl,
  createDoctorResultPdfDownloadUrl,
  doctorCaseMatchesPatientSearch,
  doctorDiseaseTypeLabel,
  fetchDoctorCaseFiles,
  fetchDoctorCaseTestsForCaseIds,
  fetchDoctorCases,
  groupDoctorCaseTestsByCaseId,
  isDoctorResultPdfExpired,
  normalizeDoctorCaseStatus,
  resolveDoctorCaseTestTitle,
  splitDoctorCaseFiles,
  type DoctorCaseFileRow,
  type DoctorCaseRow,
  type DoctorCaseTestRow,
} from '../../lib/doctorCasesStore'
import { DoctorCaseEditForm } from './DoctorCaseEditForm'
import type { Messages } from '../../i18n/messages'

type Props = {
  m: Messages['doctorPortal']
}

const caseStatusClass: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-900 ring-blue-300/80',
  pending: 'bg-amber-100 text-amber-900 ring-amber-300/80',
  in_progress: 'bg-sky-100 text-sky-900 ring-sky-300/80',
  rejected: 'bg-red-100 text-red-900 ring-red-300/80',
  done: 'bg-emerald-100 text-emerald-900 ring-emerald-300/80',
}

export function DoctorMyCasesPanel({ m }: Props) {
  const { locale } = useLocaleContext()
  const { tests } = useTests()
  const [cases, setCases] = useState<DoctorCaseRow[]>([])
  const [testsByCase, setTestsByCase] = useState<Map<string, DoctorCaseTestRow[]>>(new Map())
  const [loadingCases, setLoadingCases] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  async function loadCases() {
    setLoadingCases(true)
    const res = await fetchDoctorCases()
    if (res.ok && res.rows) {
      setCases(res.rows)
      const testRes = await fetchDoctorCaseTestsForCaseIds(res.rows.map((r) => r.id))
      if (testRes.ok && testRes.rows) {
        setTestsByCase(groupDoctorCaseTestsByCaseId(testRes.rows))
      } else {
        setTestsByCase(new Map())
      }
    }
    setLoadingCases(false)
  }

  useEffect(() => {
    void loadCases()
  }, [])

  const diseaseLabels = {
    oncology: m.diseaseOncology,
    reproductive: m.diseaseReproductive,
    pediatric: m.diseasePediatric,
    other: m.diseaseOther,
  }

  const filteredCases = useMemo(() => {
    return cases.filter((row) =>
      doctorCaseMatchesPatientSearch(
        row,
        searchQuery,
        testsByCase.get(row.id) ?? [],
        tests,
        locale,
      ),
    )
  }, [cases, searchQuery, testsByCase, tests, locale])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-urgen-navy">{m.myCasesTitle}</h2>
        <button
          type="button"
          className="text-sm font-semibold text-urgen-purple"
          onClick={() => void loadCases()}
        >
          {m.refresh}
        </button>
      </div>

      <label className="mt-4 block">
        <span className="sr-only">{m.searchPatientsPlaceholder}</span>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={m.searchPatientsPlaceholder}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20"
          autoComplete="off"
        />
      </label>

      {loadingCases ? (
        <p className="mt-4 text-sm text-slate-500">{m.casesLoading}</p>
      ) : cases.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{m.casesEmpty}</p>
      ) : filteredCases.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{m.searchPatientsNoResults}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {filteredCases.map((c) => (
            <CaseCard
              key={c.id}
              row={c}
              m={m}
              locale={locale}
              caseTests={testsByCase.get(c.id) ?? []}
              catalogTests={tests}
              diseaseLabels={diseaseLabels}
              onUpdated={() => void loadCases()}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function CaseCard({
  row,
  m,
  locale,
  caseTests,
  catalogTests,
  diseaseLabels,
  onUpdated,
}: {
  row: DoctorCaseRow
  m: Messages['doctorPortal']
  locale: string
  caseTests: DoctorCaseTestRow[]
  catalogTests: Parameters<typeof resolveDoctorCaseTestTitle>[1]
  diseaseLabels: {
    oncology: string
    reproductive: string
    pediatric: string
    other: string
  }
  onUpdated: () => void
}) {
  const [files, setFiles] = useState<DoctorCaseFileRow[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [resultPdfBusy, setResultPdfBusy] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const status = normalizeDoctorCaseStatus(row.status)
  const canEdit = status === 'sent'
  const resultExpired = isDoctorResultPdfExpired(row)
  const resultPdfReady = status === 'done' && row.pdf_storage_path && !resultExpired
  const diseaseLabel = doctorDiseaseTypeLabel(row, diseaseLabels)

  function statusLabel(s: ReturnType<typeof normalizeDoctorCaseStatus>) {
    switch (s) {
      case 'sent':
        return m.caseStatusSent
      case 'pending':
        return m.caseStatusPending
      case 'in_progress':
        return m.caseStatusInProgress
      case 'rejected':
        return m.caseStatusRejected
      case 'done':
        return m.caseStatusDone
      default:
        return s
    }
  }

  async function downloadResultPdf(storagePath: string) {
    setResultPdfBusy(true)
    const res = await createDoctorResultPdfDownloadUrl(storagePath)
    setResultPdfBusy(false)
    if (res.ok && res.url) window.open(res.url, '_blank', 'noopener,noreferrer')
  }

  async function reloadFiles() {
    const res = await fetchDoctorCaseFiles(row.id)
    if (res.ok && res.rows) setFiles(res.rows)
    return res
  }

  async function ensureRequestFormPdf() {
    const testTitles = caseTests.map((t) =>
      resolveDoctorCaseTestTitle(t, catalogTests, locale),
    )
    if (testTitles.length === 0) return
    setPdfBusy(true)
    const imgRes = await attachDoctorRequestFormImage(
      row.id,
      row.doctor_user_id,
      row,
      buildRequestFormImageContext(
        locale,
        { days: m.ageUnitDays, months: m.ageUnitMonths, years: m.ageUnitYears },
        testTitles,
        { diseaseTypeLabel: diseaseLabel },
      ),
    )
    if (imgRes.ok) await reloadFiles()
    setPdfBusy(false)
  }

  useEffect(() => {
    if (!expanded) return
    let cancelled = false
    void (async () => {
      setFilesLoading(true)
      const res = await reloadFiles()
      if (cancelled) return
      setFilesLoading(false)
      if (!res.ok || !res.rows) return
      const { requestForm: form } = splitDoctorCaseFiles(res.rows)
      if (!form) await ensureRequestFormPdf()
    })()
    return () => {
      cancelled = true
    }
  }, [expanded, row.id, row.updated_at])

  const { requestForm, attachments } = splitDoctorCaseFiles(files)

  const genderLabel =
    row.gender === 'male'
      ? m.genderMale
      : row.gender === 'female'
        ? m.genderFemale
        : m.genderOther

  const submittedAt = row.created_at
    ? new Date(row.created_at).toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—'

  if (editing && canEdit) {
    return (
      <li>
        <DoctorCaseEditForm
          row={row}
          caseTests={caseTests}
          m={m}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false)
            onUpdated()
          }}
        />
      </li>
    )
  }

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <button type="button" className="w-full text-start" onClick={() => setExpanded((v) => !v)}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="font-bold text-urgen-navy">{row.patient_full_name}</p>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${caseStatusClass[status] ?? 'bg-slate-100 text-slate-800'}`}
          >
            {statusLabel(status)}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {diseaseLabel} · {genderLabel}
        </p>
        {caseTests.length > 0 && (
          <p className="mt-1 text-xs text-slate-600">
            {m.testsInRequest}:{' '}
            {caseTests
              .map((t) => resolveDoctorCaseTestTitle(t, catalogTests, locale))
              .join(' · ')}
          </p>
        )}
        <p className="mt-1 text-xs text-slate-500">
          {m.caseDateSubmitted}:{' '}
          <span dir="ltr" className="tabular-nums">
            {submittedAt}
          </span>
        </p>
      </button>
      {status === 'rejected' && row.rejection_reason && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          <span className="font-semibold">{m.rejectionReason}: </span>
          {row.rejection_reason}
        </p>
      )}
      {status === 'done' && row.result_value && (
        <p className="mt-3 text-sm">
          <span className="font-semibold text-urgen-navy">{m.colResult}: </span>
          <span
            className={
              row.result_value === 'positive'
                ? 'font-semibold text-emerald-700'
                : 'font-semibold text-slate-700'
            }
          >
            {row.result_value === 'positive' ? m.resultPositive : m.resultNegative}
          </span>
        </p>
      )}
      {status === 'sent' && (
        <p className="mt-3 text-xs text-slate-500">{m.resultPdfAwaitAcceptance}</p>
      )}
      {!resultPdfReady && status !== 'done' && status !== 'sent' && status !== 'rejected' && (
        <p className="mt-3 text-xs text-slate-500">{m.resultPdfLocked}</p>
      )}
      {status === 'done' && row.pdf_storage_path && row.pdf_expires_at && (
        <p
          className={`mt-3 text-xs font-medium ${resultExpired ? 'text-amber-900' : 'text-emerald-800'}`}
        >
          {resultExpired ? m.resultPdfExpiredAt : m.resultPdfValidUntil}
          {': '}
          <span dir="ltr" className="inline-block font-normal tabular-nums">
            {new Date(row.pdf_expires_at).toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en-US')}
          </span>
        </p>
      )}
      {status === 'done' && resultExpired && (
        <p className="mt-2 text-xs text-slate-600">{m.resultPdfExpired}</p>
      )}
      {resultPdfReady && (
        <div className="mt-3">
          <Button
            type="button"
            className="text-sm"
            disabled={resultPdfBusy}
            onClick={() => void downloadResultPdf(row.pdf_storage_path!)}
          >
            {resultPdfBusy ? '…' : m.resultPdfDownload}
          </Button>
        </div>
      )}
      {canEdit && (
        <div className="mt-3">
          <Button type="button" variant="outline" className="text-sm" onClick={() => setEditing(true)}>
            {m.editCase}
          </Button>
        </div>
      )}
      {expanded && (
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
          <p>
            <span className="font-semibold">{m.diagnosis}: </span>
            {row.diagnosis}
          </p>
          {row.disease_type === 'oncology' && (
            <>
              <p>
                <span className="font-semibold">{m.oncologyTumorType}: </span>
                {row.oncology_tumor_type}
              </p>
              <p>
                <span className="font-semibold">{m.oncologyStage}: </span>
                {row.oncology_stage}
              </p>
              <p>
                <span className="font-semibold">{m.oncologyTreatment}: </span>
                {row.oncology_treatment}
              </p>
            </>
          )}
          {row.disease_type === 'other' && row.disease_type_other && (
            <p>
              <span className="font-semibold">{m.diseaseType}: </span>
              {row.disease_type_other}
            </p>
          )}
          <div className="mt-3 rounded-lg border border-urgen-purple/25 bg-urgen-purple/5 px-3 py-2">
            <p className="text-xs font-semibold text-urgen-navy">{m.requestFormPdf}</p>
            {filesLoading || pdfBusy ? (
              <p className="mt-1 text-xs text-slate-500">{m.requestFormPdfGenerating}</p>
            ) : requestForm ? (
              <button
                type="button"
                className="mt-1 text-sm font-semibold text-urgen-purple"
                onClick={() => void downloadFile(requestForm)}
              >
                {m.requestFormPdfDownload}
              </button>
            ) : (
              <button
                type="button"
                className="mt-1 text-sm font-semibold text-urgen-purple"
                onClick={() => void ensureRequestFormPdf()}
              >
                {m.requestFormPdfRetry}
              </button>
            )}
          </div>
          {attachments.length > 0 && (
            <ul className="mt-2 space-y-1">
              {attachments.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    className="text-sm font-semibold text-urgen-purple"
                    onClick={() => void downloadFile(f)}
                  >
                    {f.file_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  )
}

async function downloadFile(file: DoctorCaseFileRow) {
  const res = await createDoctorCaseFileDownloadUrl(file.storage_path)
  if (res.ok && res.url) window.open(res.url, '_blank', 'noopener,noreferrer')
}
