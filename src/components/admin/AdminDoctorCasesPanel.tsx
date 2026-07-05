import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import type { Messages } from '../../i18n/messages'
import { Button } from '../ui/Button'
import {
  adminUpdateDoctorCaseStatus,
  adminUploadDoctorCaseResultPdf,
  normalizeDoctorCaseStatus,
  isDoctorResultPdfExpired,
  doctorDiseaseTypeLabel,
  resolveDoctorCaseTestTitle,
  createDoctorCaseFileDownloadUrl,
  regenerateDoctorRequestFormImage,
  buildRequestFormImageContext,
  fetchAllDoctorCaseFilesAdmin,
  fetchAllDoctorCaseTestsAdmin,
  fetchAllDoctorCasesAdmin,
  groupDoctorCaseFilesByCaseId,
  groupDoctorCaseTestsByCaseId,
  splitDoctorCaseFiles,
  type DoctorCaseFileRow,
  type DoctorCaseRow,
  type DoctorCaseTestRow,
  type DoctorResultValue,
} from '../../lib/doctorCasesStore'
import { fetchDoctorUsersAdmin } from '../../lib/doctorUsersAdmin'
import { useTests } from '../../hooks/useTests'
import type { TestRow } from '../../types/database'

type Props = {
  m: Messages['admin']
}

const statusClass: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-900',
  pending: 'bg-amber-100 text-amber-900',
  in_progress: 'bg-sky-100 text-sky-900',
  rejected: 'bg-red-100 text-red-900',
  done: 'bg-emerald-100 text-emerald-900',
}

function formatBytes(n: number | null): string {
  if (n == null || n <= 0) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function testTitleFor(
  test: DoctorCaseTestRow,
  catalog: TestRow[],
  locale: string,
): string {
  return resolveDoctorCaseTestTitle(test, catalog, locale)
}

function caseMatchesSearch(
  row: DoctorCaseRow,
  query: string,
  doctorName: string | undefined,
  caseTests: DoctorCaseTestRow[],
  catalog: TestRow[],
  locale: string,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const testHay = caseTests
    .map((t) => testTitleFor(t, catalog, locale) + ' ' + t.test_slug)
    .join(' ')
  const hay = [
    row.patient_full_name,
    row.diagnosis,
    row.disease_type,
    row.oncology_tumor_type,
    row.oncology_stage,
    row.oncology_treatment,
    doctorName,
    testHay,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(q)
}

function ResultPdfUploadBlock({
  row,
  m,
  busyId,
  onPdf,
  uploadLabel,
}: {
  row: DoctorCaseRow
  m: Messages['admin']
  busyId: string | null
  onPdf: (id: string, file: File, resultValue: DoctorResultValue) => void
  uploadLabel?: string
}) {
  const initial =
    row.result_value === 'positive' || row.result_value === 'negative'
      ? row.result_value
      : ('' as const)
  const [resultValue, setResultValue] = useState<DoctorResultValue | ''>(initial)

  useEffect(() => {
    if (row.result_value === 'positive' || row.result_value === 'negative') {
      setResultValue(row.result_value)
    }
  }, [row.result_value])

  function onFileChange(e: FormEvent<HTMLInputElement>) {
    const input = e.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    if (resultValue !== 'positive' && resultValue !== 'negative') {
      window.alert(m.doctorRequestsResultRequired)
      return
    }
    onPdf(row.id, file, resultValue)
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <fieldset className="flex flex-wrap items-center gap-3">
        <legend className="sr-only">{m.doctorRequestsResultLabel}</legend>
        <span className="text-xs font-semibold text-slate-600">{m.doctorRequestsResultLabel}:</span>
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-urgen-navy">
          <input
            type="radio"
            name={`result-${row.id}`}
            value="positive"
            checked={resultValue === 'positive'}
            disabled={busyId === row.id}
            onChange={() => setResultValue('positive')}
          />
          {m.doctorRequestsResultPositive}
        </label>
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-urgen-navy">
          <input
            type="radio"
            name={`result-${row.id}`}
            value="negative"
            checked={resultValue === 'negative'}
            disabled={busyId === row.id}
            onChange={() => setResultValue('negative')}
          />
          {m.doctorRequestsResultNegative}
        </label>
      </fieldset>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-urgen-purple px-3 py-2 text-xs font-semibold text-white hover:brightness-105 disabled:opacity-50">
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          disabled={busyId === row.id}
          onChange={onFileChange}
        />
        {busyId === row.id ? m.doctorRequestsUploading : (uploadLabel ?? m.doctorRequestsUploadPdf)}
      </label>
    </div>
  )
}

function CaseCard({
  row,
  files,
  caseTests,
  catalogTests,
  doctorName,
  m,
  locale,
  busyId,
  onAccept,
  onProgress,
  onReject,
  onPdf,
  onRefreshFiles,
}: {
  row: DoctorCaseRow
  files: DoctorCaseFileRow[]
  caseTests: DoctorCaseTestRow[]
  catalogTests: TestRow[]
  doctorName: string
  m: Messages['admin']
  locale: string
  busyId: string | null
  onAccept: (id: string) => void
  onProgress: (id: string) => void
  onReject: (id: string) => void
  onPdf: (id: string, file: File, resultValue: DoctorResultValue) => void
  onRefreshFiles: () => void
}) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [regeneratingPdf, setRegeneratingPdf] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  const caseStatus = normalizeDoctorCaseStatus(row.status)

  function statusLabel(s: string) {
    const n = normalizeDoctorCaseStatus(s)
    switch (n) {
      case 'sent':
        return m.doctorRequestsStatusSent
      case 'pending':
        return m.doctorRequestsStatusPending
      case 'in_progress':
        return m.doctorRequestsStatusInProgress
      case 'rejected':
        return m.doctorRequestsStatusRejected
      case 'done':
        return m.doctorRequestsStatusDone
      default:
        return s
    }
  }

  function formatPdfTs(iso: string) {
    return new Date(iso).toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en-US')
  }

  const diseaseLabel = doctorDiseaseTypeLabel(row, {
    oncology: m.doctorRequestsDiseaseOncology,
    reproductive: m.doctorRequestsDiseaseReproductive,
    pediatric: m.doctorRequestsDiseasePediatric,
    other: m.doctorRequestsDiseaseOther,
  })

  const genderLabel =
    row.gender === 'male'
      ? m.doctorRequestsGenderMale
      : row.gender === 'female'
        ? m.doctorRequestsGenderFemale
        : m.doctorRequestsGenderOther

  const ageUnit =
    row.age_unit === 'days'
      ? m.doctorRequestsAgeDays
      : row.age_unit === 'months'
        ? m.doctorRequestsAgeMonths
        : m.doctorRequestsAgeYears

  const dateStr = row.created_at
    ? new Date(row.created_at).toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—'

  async function download(file: DoctorCaseFileRow) {
    setDownloadingId(file.id)
    const res = await createDoctorCaseFileDownloadUrl(file.storage_path)
    setDownloadingId(null)
    if (res.ok && res.url) window.open(res.url, '_blank', 'noopener,noreferrer')
  }

  const { requestForm, attachments } = splitDoctorCaseFiles(files)

  async function regeneratePdf() {
    setRegeneratingPdf(true)
    setPdfError(null)
    const diseaseLabel = doctorDiseaseTypeLabel(row, {
      oncology: m.doctorRequestsDiseaseOncology,
      reproductive: m.doctorRequestsDiseaseReproductive,
      pediatric: m.doctorRequestsDiseasePediatric,
      other: m.doctorRequestsDiseaseOther,
    })
    const testTitles = caseTests.map((t) => testTitleFor(t, catalogTests, locale))
    const res = await regenerateDoctorRequestFormImage(
      row.id,
      row.doctor_user_id,
      row,
      buildRequestFormImageContext(
        locale,
        {
          days: m.doctorRequestsAgeDays,
          months: m.doctorRequestsAgeMonths,
          years: m.doctorRequestsAgeYears,
        },
        testTitles,
        { diseaseTypeLabel: diseaseLabel },
      ),
    )
    setRegeneratingPdf(false)
    if (!res.ok) {
      setPdfError(res.error ?? 'failed')
      return
    }
    onRefreshFiles()
  }

  return (
    <li className="rounded-2xl border-2 border-slate-300 bg-slate-100 p-5 text-sm shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <p className="text-lg font-bold text-urgen-navy">{row.patient_full_name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {m.doctorRequestsColDoctor}: {doctorName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[caseStatus] ?? 'bg-slate-100 text-slate-800'}`}
          >
            {statusLabel(row.status)}
          </span>
          <span className="rounded-full bg-urgen-purple/15 px-3 py-1 text-xs font-semibold text-urgen-purple">
            {diseaseLabel}
          </span>
        </div>
      </div>
      {row.rejection_reason && caseStatus === 'rejected' && (
        <p className="mt-2 text-sm text-red-700">
          <span className="font-semibold">{m.doctorRequestsRejectionReason}: </span>
          {row.rejection_reason}
        </p>
      )}

      <dl className="mt-4 grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold text-slate-500">{m.doctorRequestsColAge}</dt>
          <dd className="font-medium text-urgen-navy">
            {row.age_value} {ageUnit}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-slate-500">{m.doctorRequestsColGender}</dt>
          <dd className="font-medium text-urgen-navy">{genderLabel}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold text-slate-500">{m.doctorRequestsColDiagnosis}</dt>
          <dd className="mt-0.5 leading-relaxed text-urgen-navy">{row.diagnosis}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold text-slate-500">{m.doctorRequestsColTests}</dt>
          <dd className="mt-0.5 text-urgen-navy">
            {caseTests.length === 0 ? (
              <span className="text-slate-500">{m.doctorRequestsNoTests}</span>
            ) : (
              <ul className="list-inside list-disc space-y-0.5">
                {caseTests.map((t) => (
                  <li key={t.id}>{testTitleFor(t, catalogTests, locale)}</li>
                ))}
              </ul>
            )}
          </dd>
        </div>
        {row.disease_type === 'oncology' && (
          <>
            <div>
              <dt className="text-xs font-semibold text-slate-500">{m.doctorRequestsOncologyTumor}</dt>
              <dd className="font-medium text-urgen-navy">{row.oncology_tumor_type}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-500">{m.doctorRequestsOncologyStage}</dt>
              <dd className="font-medium text-urgen-navy">{row.oncology_stage}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold text-slate-500">
                {m.doctorRequestsOncologyTreatment}
              </dt>
              <dd className="font-medium text-urgen-navy">{row.oncology_treatment}</dd>
            </div>
          </>
        )}
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold text-slate-500">{m.doctorRequestsColDate}</dt>
          <dd className="tabular-nums" dir="ltr">
            {dateStr}
          </dd>
        </div>
      </dl>

      {caseStatus === 'sent' && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
          <Button
            type="button"
            className="text-xs"
            disabled={busyId === row.id}
            onClick={() => onAccept(row.id)}
          >
            {m.doctorRequestsAccept}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="text-xs text-red-700"
            disabled={busyId === row.id}
            onClick={() => onReject(row.id)}
          >
            {m.doctorRequestsReject}
          </Button>
        </div>
      )}

      {caseStatus === 'pending' && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
          <Button
            type="button"
            className="text-xs"
            disabled={busyId === row.id}
            onClick={() => onProgress(row.id)}
          >
            {m.doctorRequestsSetProgress}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="text-xs text-red-700"
            disabled={busyId === row.id}
            onClick={() => onReject(row.id)}
          >
            {m.doctorRequestsReject}
          </Button>
        </div>
      )}

      {caseStatus === 'in_progress' && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
          <ResultPdfUploadBlock row={row} m={m} busyId={busyId} onPdf={onPdf} />
          <Button
            type="button"
            variant="outline"
            className="text-xs text-red-700"
            disabled={busyId === row.id}
            onClick={() => onReject(row.id)}
          >
            {m.doctorRequestsReject}
          </Button>
        </div>
      )}

      {caseStatus === 'done' && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
          {row.result_value && (
            <p className="w-full text-xs text-slate-600">
              <span className="font-semibold">{m.doctorRequestsResultLabel}: </span>
              {row.result_value === 'positive'
                ? m.doctorRequestsResultPositive
                : m.doctorRequestsResultNegative}
            </p>
          )}
          {row.pdf_expires_at != null && (
            <p className="w-full text-xs text-slate-600">
              {isDoctorResultPdfExpired(row) ? (
                <span className="font-semibold text-amber-900">
                  {m.doctorRequestsPdfExpiredNotice}:{' '}
                  <span dir="ltr" className="font-normal tabular-nums">
                    {formatPdfTs(row.pdf_expires_at)}
                  </span>
                </span>
              ) : (
                <>
                  {m.doctorRequestsPdfExpires}:{' '}
                  <span dir="ltr" className="tabular-nums">
                    {formatPdfTs(row.pdf_expires_at)}
                  </span>
                </>
              )}
            </p>
          )}
          <ResultPdfUploadBlock
            row={row}
            m={m}
            busyId={busyId}
            onPdf={onPdf}
            uploadLabel={m.doctorRequestsReplacePdf}
          />
        </div>
      )}

      <div className="mt-4 border-t border-slate-200 pt-4">
        <p className="text-xs font-semibold text-slate-600">{m.doctorRequestsRequestForm}</p>
        {requestForm ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-urgen-purple/30 bg-urgen-purple/5 px-3 py-2">
            <span className="truncate font-medium text-urgen-navy">{requestForm.file_name}</span>
            <span className="text-xs text-slate-500">{formatBytes(requestForm.byte_size)}</span>
            <Button
              type="button"
              className="text-xs"
              disabled={downloadingId === requestForm.id}
              onClick={() => void download(requestForm)}
            >
              {downloadingId === requestForm.id
                ? m.doctorRequestsDownloading
                : m.doctorRequestsRequestFormDownload}
            </Button>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-xs text-slate-500">{m.doctorRequestsNoFiles}</p>
            <Button
              type="button"
              variant="outline"
              className="text-xs"
              disabled={regeneratingPdf}
              onClick={() => void regeneratePdf()}
            >
              {regeneratingPdf ? m.doctorRequestsDownloading : m.doctorRequestsGenerateForm}
            </Button>
          </div>
        )}
        {pdfError && <p className="mt-1 text-xs text-red-600">{pdfError}</p>}

        <p className="mt-4 text-xs font-semibold text-slate-600">{m.doctorRequestsAttachments}</p>
        {attachments.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">{m.doctorRequestsNoFiles}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {attachments.map((f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <span className="truncate font-medium text-urgen-navy">{f.file_name}</span>
                <span className="text-xs text-slate-500">{formatBytes(f.byte_size)}</span>
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs"
                  disabled={downloadingId === f.id}
                  onClick={() => void download(f)}
                >
                  {downloadingId === f.id ? m.doctorRequestsDownloading : m.doctorRequestsDownload}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}

export function AdminDoctorCasesPanel({ m }: Props) {
  const { locale } = useLocaleContext()
  const { tests: catalogTests } = useTests()
  const [rows, setRows] = useState<DoctorCaseRow[]>([])
  const [filesByCase, setFilesByCase] = useState<Map<string, DoctorCaseFileRow[]>>(new Map())
  const [testsByCase, setTestsByCase] = useState<Map<string, DoctorCaseTestRow[]>>(new Map())
  const [doctorNames, setDoctorNames] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function acceptCase(id: string) {
    setBusyId(id)
    setActionError(null)
    const res = await adminUpdateDoctorCaseStatus(id, 'pending')
    setBusyId(null)
    if (!res.ok) {
      const errMap: Record<string, string> = {
        not_signed_in: m.doctorRequestsNotSignedIn,
        update_blocked: m.doctorRequestsUpdateBlocked,
        rpc_missing: m.doctorRequestsRpcMissing,
        edge_not_deployed: m.doctorRequestsEdgeNotDeployed,
        forbidden: m.doctorRequestsForbidden,
        unauthorized: m.doctorRequestsNotSignedIn,
        status_migration_required: m.doctorRequestsStatusMigration,
      }
      setActionError(errMap[res.error ?? ''] ?? res.error ?? m.doctorRequestsActionErr)
    }
    else void reload()
  }

  async function setProgress(id: string) {
    setBusyId(id)
    setActionError(null)
    const res = await adminUpdateDoctorCaseStatus(id, 'in_progress')
    setBusyId(null)
    if (!res.ok) {
      const errMap: Record<string, string> = {
        not_signed_in: m.doctorRequestsNotSignedIn,
        update_blocked: m.doctorRequestsUpdateBlocked,
        rpc_missing: m.doctorRequestsRpcMissing,
        edge_not_deployed: m.doctorRequestsEdgeNotDeployed,
        forbidden: m.doctorRequestsForbidden,
        unauthorized: m.doctorRequestsNotSignedIn,
        status_migration_required: m.doctorRequestsStatusMigration,
      }
      setActionError(errMap[res.error ?? ''] ?? res.error ?? m.doctorRequestsActionErr)
    } else void reload()
  }

  async function onPdfChange(id: string, file: File, resultValue: DoctorResultValue) {
    setBusyId(id)
    setActionError(null)
    const res = await adminUploadDoctorCaseResultPdf(id, file, resultValue)
    setBusyId(null)
    if (!res.ok) {
      const errMap: Record<string, string> = {
        result_required: m.doctorRequestsResultRequired,
      }
      setActionError(errMap[res.error ?? ''] ?? res.error ?? m.doctorRequestsActionErr)
    } else void reload()
  }

  async function rejectCase(id: string) {
    const reason = window.prompt(m.doctorRequestsRejectPrompt)
    if (reason === null) return
    setBusyId(id)
    setActionError(null)
    const res = await adminUpdateDoctorCaseStatus(id, 'rejected', reason)
    setBusyId(null)
    if (!res.ok) {
      const errMap: Record<string, string> = {
        not_signed_in: m.doctorRequestsNotSignedIn,
        update_blocked: m.doctorRequestsUpdateBlocked,
        rpc_missing: m.doctorRequestsRpcMissing,
        edge_not_deployed: m.doctorRequestsEdgeNotDeployed,
        forbidden: m.doctorRequestsForbidden,
        unauthorized: m.doctorRequestsNotSignedIn,
        status_migration_required: m.doctorRequestsStatusMigration,
      }
      setActionError(errMap[res.error ?? ''] ?? res.error ?? m.doctorRequestsActionErr)
    }
    else void reload()
  }

  async function reload() {
    setLoading(true)
    setListError(null)
    const [casesRes, filesRes, testsRes, doctorsRes] = await Promise.all([
      fetchAllDoctorCasesAdmin(),
      fetchAllDoctorCaseFilesAdmin(),
      fetchAllDoctorCaseTestsAdmin(),
      fetchDoctorUsersAdmin(),
    ])

    const names = new Map<string, string>()
    if (doctorsRes.ok && doctorsRes.rows) {
      for (const d of doctorsRes.rows) {
        names.set(d.user_id, d.display_name)
      }
    }
    setDoctorNames(names)

    if (casesRes.ok && casesRes.rows) {
      setRows(casesRes.rows)
      if (filesRes.ok && filesRes.rows) {
        setFilesByCase(groupDoctorCaseFilesByCaseId(filesRes.rows))
      } else {
        setFilesByCase(new Map())
      }
      if (testsRes.ok && testsRes.rows) {
        setTestsByCase(groupDoctorCaseTestsByCaseId(testsRes.rows))
      } else {
        setTestsByCase(new Map())
      }
    } else {
      setRows([])
      setFilesByCase(new Map())
      setTestsByCase(new Map())
      const err = casesRes.error ?? filesRes.error
      if (err === 'not_signed_in') setListError(m.doctorRequestsNotSignedIn)
      else setListError(err ?? m.doctorRequestsLoadErr)
    }
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [])

  const filtered = useMemo(() => {
    return rows.filter((row) =>
      caseMatchesSearch(
        row,
        searchQuery,
        doctorNames.get(row.doctor_user_id),
        testsByCase.get(row.id) ?? [],
        catalogTests,
        locale,
      ),
    )
  }, [rows, searchQuery, doctorNames, testsByCase, catalogTests, locale])

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-urgen-navy">{m.doctorRequestsTitle}</h2>
        <Button type="button" variant="outline" className="text-sm" onClick={() => void reload()}>
          {m.doctorRequestsRefresh}
        </Button>
      </div>
      <p className="mt-2 text-sm text-slate-600">{m.doctorRequestsIntro}</p>
      {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">{m.doctorRequestsLoading}</p>
      ) : listError ? (
        <p className="mt-6 text-sm text-red-600">{listError}</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">{m.doctorRequestsEmpty}</p>
      ) : (
        <>
          <label className="mt-4 block">
            <span className="sr-only">{m.doctorRequestsSearchPlaceholder}</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={m.doctorRequestsSearchPlaceholder}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20"
              autoComplete="off"
            />
          </label>
          {filtered.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">{m.doctorRequestsSearchNoResults}</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {filtered.map((row) => (
                <CaseCard
                  key={row.id}
                  row={row}
                  files={filesByCase.get(row.id) ?? []}
                  caseTests={testsByCase.get(row.id) ?? []}
                  catalogTests={catalogTests}
                  doctorName={doctorNames.get(row.doctor_user_id) ?? row.doctor_user_id.slice(0, 8)}
                  m={m}
                  locale={locale}
                  busyId={busyId}
                  onAccept={(id) => void acceptCase(id)}
                  onProgress={(id) => void setProgress(id)}
                  onReject={(id) => void rejectCase(id)}
                  onPdf={(id, file, resultValue) => void onPdfChange(id, file, resultValue)}
                  onRefreshFiles={() => void reload()}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
