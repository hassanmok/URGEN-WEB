import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import type { Messages } from '../../i18n/messages'
import { getUnseenSubmissionGroups } from '../../lib/adminPartnerSubmissionSeen'
import {
  fetchAllPartnerSubmissionsAdmin,
  fetchPartnerLabNamesMap,
  type PartnerSubmissionGroup,
} from '../../lib/partnerSubmissionsStore'
import { supabase } from '../../lib/supabase'

type Props = {
  m: Messages['admin']
  onOpenGroup: (groupKey: string) => void
  onUnseenCountChange?: (count: number) => void
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
  onOpenGroup,
  onUnseenCountChange,
  refreshToken = 0,
}: Props) {
  const { locale } = useLocaleContext()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [unseen, setUnseen] = useState<PartnerSubmissionGroup[]>([])
  const [labNames, setLabNames] = useState<Map<string, string>>(new Map())
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const overlayLayout = useOverlayMenuLayout(open, buttonRef)
  const useOverlayMenu = overlayLayout !== null

  const refresh = useCallback(async () => {
    if (!supabase) {
      setUnseen([])
      onUnseenCountChange?.(0)
      return
    }
    setLoading(true)
    const [list, names] = await Promise.all([
      fetchAllPartnerSubmissionsAdmin(),
      fetchPartnerLabNamesMap(),
    ])
    setLabNames(names)
    if (list.ok && list.rows) {
      const next = await getUnseenSubmissionGroups(list.rows)
      setUnseen(next)
      onUnseenCountChange?.(next.length)
    } else {
      setUnseen([])
      onUnseenCountChange?.(0)
    }
    setLoading(false)
  }, [onUnseenCountChange])

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

  const count = unseen.length

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  function handlePick(groupKey: string) {
    onOpenGroup(groupKey)
    setUnseen((prev) => {
      const next = prev.filter((g) => g.groupKey !== groupKey)
      onUnseenCountChange?.(next.length)
      return next
    })
    setOpen(false)
  }

  const menuContent = (
    <>
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-bold text-urgen-navy">{m.notificationsTitle}</p>
        {count > 0 && (
          <p className="mt-0.5 text-xs text-slate-500">
            {m.notificationsCount.replace('{n}', String(count))}
          </p>
        )}
      </div>
      <ul
        className="overflow-y-auto overscroll-contain"
        style={{ maxHeight: overlayLayout ? overlayLayout.maxHeight - 56 : 320 }}
      >
        {loading && unseen.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-slate-500">{m.notificationsLoading}</li>
        ) : unseen.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-slate-500">{m.notificationsEmpty}</li>
        ) : (
          unseen.map((group) => {
            const lab = labNames.get(group.partner_user_id) ?? group.partner_user_id.slice(0, 8)
            return (
              <li key={group.groupKey}>
                <button
                  type="button"
                  role="menuitem"
                  className="w-full border-b border-slate-50 px-4 py-3 text-start transition hover:bg-urgen-purple/5"
                  onClick={() => handlePick(group.groupKey)}
                >
                  <p className="font-semibold text-urgen-navy">{group.patient_full_name}</p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {m.notificationsLab}: {lab}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {m.notificationsTests.replace('{n}', String(group.items.length))}
                    {' · '}
                    <span dir="ltr" className="tabular-nums">
                      {formatDate(group.created_at)}
                    </span>
                  </p>
                </button>
              </li>
            )
          })
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
        {count > 0 && (
          <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
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
