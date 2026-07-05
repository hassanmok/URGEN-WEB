import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { markSubmissionGroupSeen } from '../../lib/adminPartnerSubmissionSeen'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import { useTests } from '../../hooks/useTests'
import { Button } from '../ui/Button'
import {
  adminUpdateSubmissionStatus,
  adminUploadSubmissionPdf,
  fetchAllPartnerSubmissionsAdmin,
  fetchPartnerLabNamesMap,
  filterPartnerSubmissionGroups,
  partnerSubmissionsAdminListErrorMessage,
  isPartnerPdfExpired,
  resolvePartnerSubmissionTestTitle,
  type PartnerSubmissionGroup,
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
  partnerLabsDate: string
  partnerLabsTestsInRequest: string
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
  partnerLabsNoSupabase: string
  partnerLabsNotSignedIn: string
  partnerLabsRpcMissing: string
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

function SubmissionTestRow({
  row,
  m,
  locale,
  testTitle,
  busyId,
  onAccept,
  onProgress,
  onReject,
  onPdf,
}: {
  row: PartnerSubmissionRow
  m: AdminMsgs
  locale: 'ar' | 'en'
  testTitle: string
  busyId: string | null
  onAccept: (id: string) => void
  onProgress: (id: string) => void
  onReject: (id: string) => void
  onPdf: (id: string, e: FormEvent<HTMLInputElement>) => void
}) {
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

  function formatPdfTs(iso: string) {
    return new Date(iso).toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en-US')
  }

  return (
    <li className="rounded-xl border border-slate-300 bg-white p-3 text-sm shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold text-urgen-navy">{testTitle}</p>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusClass[row.status] ?? 'bg-slate-100'}`}
        >
          {statusLabel(row.status)}
        </span>
      </div>
      {row.rejection_reason && row.status === 'rejected' && (
        <p className="mt-2 text-red-700">{row.rejection_reason}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        {row.status === 'sent' && (
          <>
            <Button type="button" className="text-xs" disabled={busyId === row.id} onClick={() => onAccept(row.id)}>
              {m.partnerLabsAccept}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-xs text-red-700"
              disabled={busyId === row.id}
              onClick={() => onReject(row.id)}
            >
              {m.partnerLabsReject}
            </Button>
          </>
        )}
        {row.status === 'pending' && (
          <>
            <Button type="button" className="text-xs" disabled={busyId === row.id} onClick={() => onProgress(row.id)}>
              {m.partnerLabsSetProgress}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-xs text-red-700"
              disabled={busyId === row.id}
              onClick={() => onReject(row.id)}
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
                onChange={(e) => onPdf(row.id, e)}
              />
              {busyId === row.id ? m.partnerLabsUploading : m.partnerLabsUploadPdf}
            </label>
            <Button
              type="button"
              variant="outline"
              className="text-xs text-red-700"
              disabled={busyId === row.id}
              onClick={() => onReject(row.id)}
            >
              {m.partnerLabsReject}
            </Button>
          </>
        )}
        {row.status === 'done' && (
          <>
            {row.pdf_expires_at != null && (
              <p className="w-full text-xs text-slate-600">
                {isPartnerPdfExpired(row) ? (
                  <span className="font-semibold text-amber-900">
                    {m.partnerLabsPdfExpiredNotice}:{' '}
                    <span dir="ltr" className="font-normal tabular-nums">
                      {formatPdfTs(row.pdf_expires_at)}
                    </span>
                  </span>
                ) : (
                  <>
                    {m.partnerLabsPdfExpires}:{' '}
                    <span dir="ltr" className="tabular-nums">
                      {formatPdfTs(row.pdf_expires_at)}
                    </span>
                  </>
                )}
              </p>
            )}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-urgen-purple px-3 py-2 text-xs font-semibold text-white hover:brightness-105 disabled:opacity-50">
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                disabled={busyId === row.id}
                onChange={(e) => onPdf(row.id, e)}
              />
              {busyId === row.id ? m.partnerLabsUploading : m.partnerLabsReplacePdf}
            </label>
          </>
        )}
      </div>
    </li>
  )
}

function GroupCard({
  group,
  m,
  locale,
  labName,
  ageLabel,
  testTitleFor,
  busyId,
  highlighted,
  onOpen,
  onAccept,
  onProgress,
  onReject,
  onPdf,
}: {
  group: PartnerSubmissionGroup
  m: AdminMsgs
  locale: 'ar' | 'en'
  labName: string
  ageLabel: string
  testTitleFor: (row: PartnerSubmissionRow) => string
  busyId: string | null
  highlighted?: boolean
  onOpen: (groupKey: string) => void
  onAccept: (id: string) => void
  onProgress: (id: string) => void
  onReject: (id: string) => void
  onPdf: (id: string, e: FormEvent<HTMLInputElement>) => void
}) {
  const dateStr = group.created_at
    ? new Date(group.created_at).toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—'

  return (
    <li
      id={`submission-group-${group.groupKey}`}
      className={`scroll-mt-24 rounded-2xl border-2 p-5 text-sm shadow-md transition-shadow duration-300 ${
        highlighted
          ? 'border-urgen-purple bg-urgen-purple/10 ring-4 ring-urgen-purple/40 ring-offset-2'
          : 'border-slate-300 bg-slate-100'
      }`}
    >
      <div
        className="cursor-pointer space-y-1 border-b border-slate-200 pb-3"
        onClick={() => onOpen(group.groupKey)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onOpen(group.groupKey)
        }}
        role="button"
        tabIndex={0}
      >
        <p>
          <span className="font-semibold text-urgen-navy">{m.partnerLabsLab}: </span>
          {labName}
        </p>
        <p>
          <span className="font-semibold">{m.partnerLabsPatient}: </span>
          {group.patient_full_name}
        </p>
        <p>
          <span className="font-semibold">{m.partnerLabsAge}: </span>
          {ageLabel}
        </p>
        <p className="text-xs font-medium text-slate-600">
          <span className="font-semibold text-urgen-navy">{m.partnerLabsDate}: </span>
          <span dir="ltr" className="tabular-nums">
            {dateStr}
          </span>
        </p>
        <p className="text-xs text-slate-500">
          {m.partnerLabsTestsInRequest}: {group.items.length}
        </p>
      </div>
      <ul className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
        {group.items.map((row) => (
          <SubmissionTestRow
            key={row.id}
            row={row}
            m={m}
            locale={locale}
            testTitle={testTitleFor(row)}
            busyId={busyId}
            onAccept={onAccept}
            onProgress={onProgress}
            onReject={onReject}
            onPdf={onPdf}
          />
        ))}
      </ul>
    </li>
  )
}

const HIGHLIGHT_MS = 3000

type PanelProps = {
  m: AdminMsgs
  highlightGroupKey?: string | null
  highlightToken?: number
  onHighlightHandled?: () => void
  onSeenChange?: () => void
}

export function AdminPartnerSubmissionsPanel({
  m,
  highlightGroupKey,
  highlightToken = 0,
  onHighlightHandled,
  onSeenChange,
}: PanelProps) {
  const { locale } = useLocaleContext()
  const { tests } = useTests()
  const [rows, setRows] = useState<PartnerSubmissionRow[]>([])
  const [labNames, setLabNames] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null)

  function openGroup(groupKey: string) {
    void markSubmissionGroupSeen(groupKey).then(() => onSeenChange?.())
    setActiveHighlight(null)
  }

  async function reload() {
    setLoading(true)
    setListError(null)
    const [list, names] = await Promise.all([
      fetchAllPartnerSubmissionsAdmin(),
      fetchPartnerLabNamesMap(),
    ])
    setLabNames(names)
    if (list.ok && list.rows) {
      setRows(list.rows)
    } else {
      setRows([])
      setListError(partnerSubmissionsAdminListErrorMessage(list.error, m))
    }
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [])

  function testTitleFor(row: PartnerSubmissionRow) {
    return resolvePartnerSubmissionTestTitle(row, tests, locale)
  }

  const filteredGroups = useMemo(
    () => filterPartnerSubmissionGroups(rows, searchQuery, tests, labNames),
    [rows, searchQuery, tests, labNames],
  )

  useEffect(() => {
    if (!highlightGroupKey || !highlightToken || loading) return

    const inList = filteredGroups.some((g) => g.groupKey === highlightGroupKey)
    if (!inList) return

    setActiveHighlight(highlightGroupKey)
    setSearchQuery('')

    const scrollToTarget = (attempt = 0) => {
      const el = document.getElementById(`submission-group-${highlightGroupKey}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
      if (attempt < 24) {
        window.setTimeout(() => scrollToTarget(attempt + 1), 100)
      }
    }

    const t1 = window.setTimeout(() => scrollToTarget(0), 80)
    const t2 = window.setTimeout(() => {
      void markSubmissionGroupSeen(highlightGroupKey).then(() => {
        onSeenChange?.()
        onHighlightHandled?.()
      })
    }, 400)
    const t3 = window.setTimeout(() => setActiveHighlight(null), HIGHLIGHT_MS)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [highlightGroupKey, highlightToken, loading, filteredGroups, onHighlightHandled, onSeenChange])

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
      ) : listError ? (
        <p className="mt-6 text-sm leading-relaxed text-red-600">{listError}</p>
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
          {filteredGroups.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">{m.partnerLabsSearchNoResults}</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {filteredGroups.map((group) => (
                <GroupCard
                  key={group.groupKey}
                  group={group}
                  m={m}
                  locale={locale}
                  labName={labNames.get(group.partner_user_id) ?? group.partner_user_id.slice(0, 8)}
                  ageLabel={ageLabel({
                    age_value: group.age_value,
                    age_unit: group.age_unit,
                  } as PartnerSubmissionRow)}
                  testTitleFor={testTitleFor}
                  busyId={busyId}
                  highlighted={activeHighlight === group.groupKey}
                  onOpen={openGroup}
                  onAccept={(id) => void acceptRequest(id)}
                  onProgress={(id) => void setProgress(id)}
                  onReject={(id) => void reject(id)}
                  onPdf={(id, e) => void onPdfChange(id, e)}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
