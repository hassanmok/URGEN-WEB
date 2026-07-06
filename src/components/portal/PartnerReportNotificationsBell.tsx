import { useCallback, useState } from 'react'
import { PortalReportNotifications } from './PortalReportNotifications'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import { useTests } from '../../hooks/useTests'
import {
  fetchPartnerSubmissionsForLab,
  resolvePartnerSubmissionTestTitle,
} from '../../lib/partnerSubmissionsStore'
import {
  fetchSeenPartnerReportIds,
  listUnseenPartnerReadyReports,
  markPartnerReportReadySeen,
  type PortalReportNotificationItem,
} from '../../lib/portalReportNotifications'

type Props = {
  onSelect: (item: PortalReportNotificationItem) => void
}

export function PartnerReportNotificationsBell({ onSelect }: Props) {
  const { locale, messages } = useLocaleContext()
  const m = messages.partnerPortal
  const { tests } = useTests()
  const [items, setItems] = useState<PortalReportNotificationItem[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [listRes, seen] = await Promise.all([
      fetchPartnerSubmissionsForLab(),
      fetchSeenPartnerReportIds(),
    ])
    if (listRes.ok && listRes.rows) {
      setItems(
        listUnseenPartnerReadyReports(listRes.rows, seen, (row) =>
          resolvePartnerSubmissionTestTitle(row, tests, locale),
        ),
      )
    } else {
      setItems([])
    }
    setLoading(false)
  }, [tests, locale])

  async function handleSelect(item: PortalReportNotificationItem) {
    await markPartnerReportReadySeen(item.id)
    setItems((prev) => prev.filter((x) => x.id !== item.id))
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
