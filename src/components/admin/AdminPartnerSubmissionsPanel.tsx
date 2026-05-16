import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import { useTests } from '../../hooks/useTests'
import { Button } from '../ui/Button'
import {
  adminUpdateSubmissionStatus,
  adminUploadSubmissionPdf,
  fetchAllPartnerSubmissionsAdmin,
  fetchPartnerLabNamesMap,
  isPartnerPdfExpired,
  partnerSubmissionMatchesSearch,
  type PartnerSubmissionRow,
} from '../../lib/partnerSubmissionsStore'

type AdminMsgs = {
  partnerLabsTitle: string
  partnerLabsLoading: string
  partnerLabsEmpty: string
  partnerLabsLab: string
  partnerLabsPatient: string
  partnerLabsAge: string
  partnerLabsTest: string
  partnerLabsStatus: string
  partnerLabsSent: string
  partnerLabsPending: string
  partnerLabsAccept: string
  partnerLabsInProgress: string
  partnerLabsRejected: string
  partnerLabsDone: string
  partnerLabsSetProgress: string
  partnerLabsReject: string
  partnerLabsRejectPrompt: string
  partnerLabsUploadPdf: string
  partnerLabsUploading: string
  partnerLabsPdfExpires: string
  partnerLabsPdfExpiredNotice: string
  partnerLabsReplacePdf: string
  partnerLabsErr: string
  partnerLabsRefresh: string
  partnerLabsSearchPlaceholder: string
  partnerLabsSearchNoResults: string
}

const statusClass: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-900',
  pending: 'bg-amber-100 text-amber-900',
  in_progress: 'bg-sky-100 text-sky-900',
  rejected: 'bg-red-100 text-red-900',
  done: 'bg-emerald-100 text-emerald-900',
}

export function AdminPartnerSubmissionsPanel({ m }: { m: AdminMsgs }) {
  const { locale } = useLocaleContext()
  const { tests } = useTests()
  const [rows, setRows] = useState<PartnerSubmissionRow[]>([])
  const [labNames, setLabNames] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  async function reload() {
    setLoading(true)
    const [list, names] = await Promise.all([
      fetchAllPartnerSubmissionsAdmin(),
      fetchPartnerLabNamesMap(),
    ])
    setLabNames(names)
    if (list.ok && list.rows) setRows(list.rows)
    else setMessage(list.error ?? m.partnerLabsErr)
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const t = tests.find((x) => x.slug === row.test_slug)
      const extras = t ? ([t.title_ar, t.title_en ?? ''].filter(Boolean) as string[]) : []
      const labName = labNames.get(row.partner_user_id)
      const labExtras = labName ? [labName] : []
      return partnerSubmissionMatchesSearch(row, searchQuery, [...extras, ...labExtras])
    })
  }, [rows, searchQuery, tests, labNames])

  async function acceptRequest(id: string) {
    setBusyId(id)
    setMessage(null)
    const res = await adminUpdateSubmissionStatus(id, 'pending')
    setBusyId(null)
    if (!res.ok) setMessage(res.error ?? m.partnerLabsErr)
    else void reload()
  }

  async function setProgress(id: string) {
    setBusyId(id)
    setMessage(null)
    const res = await adminUpdateSubmissionStatus(id, 'in_progress')
    setBusyId(null)
    if (!res.ok) setMessage(res.error ?? m.partnerLabsErr)
    else void reload()
  }

  async function reject(id: string) {
    const reason = window.prompt(m.partnerLabsRejectPrompt)
    if (reason === null) return
    setBusyId(id)
    setMessage(null)
    const res = await adminUpdateSubmissionStatus(id, 'rejected', reason)
    setBusyId(null)
    if (!res.ok) setMessage(res.error ?? m.partnerLabsErr)
    else void reload()
  }

  async function onPdfChange(id: string, e: FormEvent<HTMLInputElement>) {
    const input = e.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    setBusyId(id)
    setMessage(null)
    const res = await adminUploadSubmissionPdf(id, file)
    setBusyId(null)
    if (!res.ok) setMessage(res.error ?? m.partnerLabsErr)
    else void reload()
  }

  function statusLabel(s: string) {
    switch (s) {
      case 'sent':
        return m.partnerLabsSent
      case 'pending':
        return m.partnerLabsPending
      case 'in_progress':
        return m.partnerLabsInProgress
      case 'rejected':
        return m.partnerLabsRejected
      case 'done':
        return m.partnerLabsDone
      default:
        return s
    }
  }

  function ageLabel(row: PartnerSubmissionRow) {
    const v = row.age_value
    if (locale === 'ar') {
      const unit =
        row.age_unit === 'days'
          ? v === 1
            ? 'يوم'
            : 'أيام'
          : row.age_unit === 'months'
            ? v === 1
              ? 'شهر'
              : 'أشهر'
            : v === 1
              ? 'سنة'
              : 'سنوات'
      return `${v} ${unit}`
    }
    const unit =
      row.age_unit === 'days'
        ? v === 1
          ? 'day'
          : 'days'
        : row.age_unit === 'months'
          ? v === 1
            ? 'month'
            : 'months'
          : v === 1
            ? 'year'
            : 'years'
    return `${v} ${unit}`
  }

  function formatPdfTs(iso: string) {
    return new Date(iso).toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en-US')
  }

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-urgen-navy">{m.partnerLabsTitle}</h2>
        <Button type="button" variant="outline" className="text-sm" onClick={() => void reload()}>
          {m.partnerLabsRefresh}
        </Button>
      </div>

      {message && <p className="mt-4 text-sm text-red-600">{message}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">{m.partnerLabsLoading}</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">{m.partnerLabsEmpty}</p>
      ) : (
        <>
          <label className="mt-4 block">
            <span className="sr-only">{m.partnerLabsSearchPlaceholder}</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={m.partnerLabsSearchPlaceholder}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20"
              autoComplete="off"
            />
          </label>
          {filteredRows.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">{m.partnerLabsSearchNoResults}</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {filteredRows.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <p>
                    <span className="font-semibold text-urgen-navy">{m.partnerLabsLab}: </span>
                    {labNames.get(row.partner_user_id) ?? row.partner_user_id.slice(0, 8)}
                  </p>
                  <p>
                    <span className="font-semibold">{m.partnerLabsPatient}: </span>
                    {row.patient_full_name}
                  </p>
                  <p>
                    <span className="font-semibold">{m.partnerLabsAge}: </span>
                    {ageLabel(row)}
                  </p>
                  <p dir="ltr" className="text-start">
                    <span className="font-semibold">{m.partnerLabsTest}: </span>
                    {row.test_slug}
                  </p>
                  {row.rejection_reason && (
                    <p className="text-red-700">{row.rejection_reason}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusClass[row.status] ?? 'bg-slate-100'}`}
                >
                  {m.partnerLabsStatus}: {statusLabel(row.status)}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                {row.status === 'sent' && (
                  <>
                    <Button
                      type="button"
                      className="text-xs"
                      disabled={busyId === row.id}
                      onClick={() => void acceptRequest(row.id)}
                    >
                      {m.partnerLabsAccept}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs text-red-700"
                      disabled={busyId === row.id}
                      onClick={() => void reject(row.id)}
                    >
                      {m.partnerLabsReject}
                    </Button>
                  </>
                )}
                {row.status === 'pending' && (
                  <>
                    <Button
                      type="button"
                      className="text-xs"
                      disabled={busyId === row.id}
                      onClick={() => void setProgress(row.id)}
                    >
                      {m.partnerLabsSetProgress}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs text-red-700"
                      disabled={busyId === row.id}
                      onClick={() => void reject(row.id)}
                    >
                      {m.partnerLabsReject}
                    </Button>
                  </>
                )}
                {row.status === 'in_progress' && (
                  <>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-urgen-purple px-3 py-2 text-xs font-semibold text-white hover:brightness-105 disabled:opacity-50">
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        disabled={busyId === row.id}
                        onChange={(e) => void onPdfChange(row.id, e)}
                      />
                      {busyId === row.id ? m.partnerLabsUploading : m.partnerLabsUploadPdf}
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs text-red-700"
                      disabled={busyId === row.id}
                      onClick={() => void reject(row.id)}
                    >
                      {m.partnerLabsReject}
                    </Button>
                  </>
                )}
                {row.status === 'done' && (
                  <>
                    {(row.pdf_expires_at != null || row.pdf_storage_path) && (
                      <p className="w-full text-xs text-slate-600">
                        {row.pdf_expires_at != null ? (
                          isPartnerPdfExpired(row) ? (
                            <span className="font-semibold text-amber-900">
                              {m.partnerLabsPdfExpiredNotice}:{' '}
                              <span dir="ltr" className="inline-block font-normal tabular-nums">
                                {formatPdfTs(row.pdf_expires_at)}
                              </span>
                            </span>
                          ) : (
                            <>
                              {m.partnerLabsPdfExpires}:{' '}
                              <span dir="ltr" className="inline-block tabular-nums">
                                {formatPdfTs(row.pdf_expires_at)}
                              </span>
                            </>
                          )
                        ) : (
                          row.pdf_storage_path && (
                            <span>
                              {m.partnerLabsPdfExpires}:{' '}
                              <span dir="ltr">—</span>
                            </span>
                          )
                        )}
                      </p>
                    )}
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-urgen-purple px-3 py-2 text-xs font-semibold text-white hover:brightness-105 disabled:opacity-50">
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        disabled={busyId === row.id}
                        onChange={(e) => void onPdfChange(row.id, e)}
                      />
                      {busyId === row.id ? m.partnerLabsUploading : m.partnerLabsReplacePdf}
                    </label>
                  </>
                )}
              </div>
            </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
