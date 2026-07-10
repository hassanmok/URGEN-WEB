import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import type { Messages } from '../../i18n/messages'
import { markDoctorCaseSeen, fetchSeenDoctorCaseIds } from '../../lib/adminDoctorCaseSeen'
import {
  buildAdminNotificationItems,
  countUnseenAdminNotifications,
  type AdminNotificationItem,
  type AdminUnseenCounts,
} from '../../lib/adminNotifications'
import {
  fetchSeenSubmissionGroupKeys,
  getAdminSubmissionNotificationGroups,
  markSubmissionGroupSeen,
} from '../../lib/adminPartnerSubmissionSeen'
import { fetchAllDoctorCasesAdmin } from '../../lib/doctorCasesStore'
import { fetchDoctorUsersAdmin } from '../../lib/doctorUsersAdmin'
import {
  fetchAllPartnerSubmissionsAdmin,
  fetchPartnerLabNamesMap,
} from '../../lib/partnerSubmissionsStore'
import { supabase } from '../../lib/supabase'

type Props = {
  m: Messages['admin']
  onOpenPartnerGroup: (groupKey: string) => void
  onOpenDoctorCase: (caseId: string) => void
  onUnseenCountChange?: (counts: AdminUnseenCounts) => void
  refreshToken?: number
}

/** عرض الشاشة الذي يُستخدم فيه نمط القائمة الثابت (portal) بدل المنسدلة العادية */
export const ADMIN_NOTIFICATION_OVERLAY_MQ = '(max-width: 901px)'

type OverlayMenuLayout = {
  top: number
  left: number
  width: number
  maxHeight: number
}

function useOverlayMenuLayout(open: boolean, anchorRef: React.RefObject<HTMLElement | null>) {
  const [layout, setLayout] = useState<OverlayMenuLayout | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      setLayout(null)
      return
    }

    const mq = window.matchMedia(ADMIN_NOTIFICATION_OVERLAY_MQ)

    function update() {
      if (!mq.matches || !anchorRef.current) {
        setLayout(null)
        return
      }
      const rect = anchorRef.current.getBoundingClientRect()
      const margin = 16
      const width = Math.min(window.innerWidth - margin * 2, 352)
      const left = Math.max(margin, Math.min(rect.left, window.innerWidth - margin - width))
      const top = rect.bottom + 8
      const maxHeight = Math.min(360, window.innerHeight - top - margin)
      setLayout({ top, left, width, maxHeight: Math.max(120, maxHeight) })
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, anchorRef])

  return layout
}

export function AdminPartnerSubmissionNotifications({
  m,
  onOpenPartnerGroup,
  onOpenDoctorCase,
  onUnseenCountChange,
  refreshToken = 0,
}: Props) {
  const { locale } = useLocaleContext()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<AdminNotificationItem[]>([])
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const overlayLayout = useOverlayMenuLayout(open, buttonRef)
  const useOverlayMenu = overlayLayout !== null

  const refresh = useCallback(async () => {
    if (!supabase) {
      setItems([])
      onUnseenCountChange?.({ partner: 0, doctor: 0, total: 0 })
      return
    }
    setLoading(true)
    const [partnerList, labNames, partnerSeen, doctorList, doctorsList, doctorSeen] =
      await Promise.all([
        fetchAllPartnerSubmissionsAdmin(),
        fetchPartnerLabNamesMap(),
        fetchSeenSubmissionGroupKeys(),
        fetchAllDoctorCasesAdmin(),
        fetchDoctorUsersAdmin(),
        fetchSeenDoctorCaseIds(),
      ])

    const doctorNames = new Map<string, string>()
    if (doctorsList.ok && doctorsList.rows) {
      for (const d of doctorsList.rows) {
        doctorNames.set(d.user_id, d.display_name)
      }
    }

    const partnerGroups =
      partnerList.ok && partnerList.rows
        ? getAdminSubmissionNotificationGroups(partnerList.rows)
        : []
    const doctorCases = doctorList.ok && doctorList.rows ? doctorList.rows : []

    const nextItems = buildAdminNotificationItems({
      partnerGroups,
      partnerSeenKeys: partnerSeen,
      labNames,
      doctorCases,
      doctorSeenIds: doctorSeen,
      doctorNames,
      labels: {
        partnerTests: (n) => m.notificationsTests.replace('{n}', String(n)),
        doctorDiagnosis: '—',
      },
    })

    setItems(nextItems)
    onUnseenCountChange?.(
      countUnseenAdminNotifications({
        partnerGroups,
        partnerSeenKeys: partnerSeen,
        doctorCases,
        doctorSeenIds: doctorSeen,
      }),
    )
    setLoading(false)
  }, [m.notificationsTests, onUnseenCountChange])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void refresh(), 45_000)
    return () => window.clearInterval(id)
  }, [refresh, refreshToken])

  useEffect(() => {
    if (!open || useOverlayMenu) return
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open, useOverlayMenu])

  const unseenCount = items.filter((item) => !item.seen).length

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  function handlePick(item: AdminNotificationItem) {
    if (item.kind === 'partner') {
      onOpenPartnerGroup(item.targetId)
      void markSubmissionGroupSeen(item.targetId).then(() => void refresh())
    } else {
      onOpenDoctorCase(item.targetId)
      void markDoctorCaseSeen(item.targetId).then(() => void refresh())
    }
    setItems((prev) =>
      prev.map((x) => (x.key === item.key ? { ...x, seen: true } : x)),
    )
    setOpen(false)
  }

  const menuContent = (
    <>
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-bold text-urgen-navy">{m.notificationsTitle}</p>
        {unseenCount > 0 && (
          <p className="mt-0.5 text-xs text-slate-500">
            {m.notificationsCount.replace('{n}', String(unseenCount))}
          </p>
        )}
      </div>
      <ul
        className="overflow-y-auto overscroll-contain"
        style={{ maxHeight: overlayLayout ? overlayLayout.maxHeight - 56 : 320 }}
      >
        {loading && items.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-slate-500">{m.notificationsLoading}</li>
        ) : items.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-slate-500">{m.notificationsEmpty}</li>
        ) : (
          items.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                role="menuitem"
                className={`w-full border-b border-slate-50 px-4 py-3 text-start transition hover:bg-urgen-purple/5 ${
                  item.seen ? 'opacity-70' : ''
                }`}
                onClick={() => handlePick(item)}
              >
                <p className={`text-urgen-navy ${item.seen ? 'font-medium' : 'font-semibold'}`}>
                  {item.patientName}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {item.kind === 'partner' ? m.notificationsSourcePartner : m.notificationsSourceDoctor}
                  : {item.sourceName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.detail}
                  {' · '}
                  <span dir="ltr" className="tabular-nums">
                    {formatDate(item.at)}
                  </span>
                </p>
              </button>
            </li>
          ))
        )}
      </ul>
    </>
  )

  if (!supabase) return null

  return (
    <div ref={panelRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          if (!open) void refresh()
        }}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-urgen-navy transition hover:bg-slate-50"
        aria-label={m.notificationsTitle}
        aria-expanded={open}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unseenCount > 0 && (
          <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unseenCount > 99 ? '99+' : unseenCount}
          </span>
        )}
      </button>

      {open && overlayLayout && typeof document !== 'undefined'
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-[200] bg-slate-900/30"
                aria-label={m.notificationsClose}
                onClick={() => setOpen(false)}
              />
              <div
                ref={menuRef}
                className="fixed z-[201] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                role="menu"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                style={{
                  top: overlayLayout.top,
                  left: overlayLayout.left,
                  width: overlayLayout.width,
                  maxHeight: overlayLayout.maxHeight,
                }}
              >
                {menuContent}
              </div>
            </>,
            document.body,
          )
        : null}

      {open && !overlayLayout && (
        <div
          className="absolute end-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
          role="menu"
        >
          {menuContent}
        </div>
      )}
    </div>
  )
}
