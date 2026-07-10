import { useCallback, useState } from 'react'
import { PortalReportNotifications } from './PortalReportNotifications'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import { useTests } from '../../hooks/useTests'
import {
  fetchDoctorCaseTestsForCaseIds,
  fetchDoctorCases,
  resolveDoctorCaseTestTitle,
} from '../../lib/doctorCasesStore'
import {
  fetchSeenDoctorReportIds,
  listDoctorReadyReports,
  markDoctorReportReadySeen,
  type PortalReportNotificationItem,
} from '../../lib/portalReportNotifications'

type Props = {
  onSelect: (item: PortalReportNotificationItem) => void
}

export function DoctorReportNotificationsBell({ onSelect }: Props) {
  const { locale, messages } = useLocaleContext()
  const m = messages.doctorPortal
  const { tests } = useTests()
  const [items, setItems] = useState<PortalReportNotificationItem[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [casesRes, seen] = await Promise.all([fetchDoctorCases(), fetchSeenDoctorReportIds()])
    if (casesRes.ok && casesRes.rows) {
      const caseIds = casesRes.rows.map((c) => c.id)
      const testsRes = await fetchDoctorCaseTestsForCaseIds(caseIds)
      const testsByCase = new Map<string, { test_slug: string; test_title_override: string | null }[]>()
      for (const t of testsRes.rows ?? []) {
        const list = testsByCase.get(t.case_id) ?? []
        list.push(t)
        testsByCase.set(t.case_id, list)
      }

      setItems(
        listDoctorReadyReports(casesRes.rows, seen, (row) => {
          const caseTests = testsByCase.get(row.id) ?? []
          if (caseTests.length === 0) return '—'
          if (caseTests.length === 1) {
            return resolveDoctorCaseTestTitle(caseTests[0], tests, locale)
          }
          const first = resolveDoctorCaseTestTitle(caseTests[0], tests, locale)
          return `${first} +${caseTests.length - 1}`
        }),
      )
    } else {
      setItems([])
    }
    setLoading(false)
  }, [tests, locale])

  async function handleSelect(item: PortalReportNotificationItem) {
    await markDoctorReportReadySeen(item.id)
    setItems((prev) =>
      prev.map((x) =>
        x.id === item.id ? { ...x, seen: true, unread: false } : x,
      ),
    )
    onSelect(item)
  }

  return (
    <PortalReportNotifications
      labels={{
        notificationsTitle: m.reportNotificationsTitle,
        notificationsCount: m.reportNotificationsCount,
        notificationsEmpty: m.reportNotificationsEmpty,
        notificationsLoading: m.reportNotificationsLoading,
        notificationsReady: m.reportNotificationsReady,
        notificationsClose: m.reportNotificationsClose,
      }}
      items={items}
      loading={loading}
      onRefresh={refresh}
      onSelect={(item) => void handleSelect(item)}
    />
  )
}
