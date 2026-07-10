import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocaleContext } from '../../i18n/useLocaleContext'
import type { PortalReportNotificationItem } from '../../lib/portalReportNotifications'

export type PortalReportNotificationLabels = {
  notificationsTitle: string
  notificationsCount: string
  notificationsEmpty: string
  notificationsLoading: string
  notificationsReady: string
  notificationsClose: string
}

type Props = {
  labels: PortalReportNotificationLabels
  items: PortalReportNotificationItem[]
  loading: boolean
  onRefresh: () => void | Promise<void>
  onSelect: (item: PortalReportNotificationItem) => void
  refreshIntervalMs?: number
}

const OVERLAY_MQ = '(max-width: 901px)'

type OverlayLayout = { top: number; left: number; width: number; maxHeight: number }

function useOverlayLayout(open: boolean, anchorRef: React.RefObject<HTMLElement | null>) {
  const [layout, setLayout] = useState<OverlayLayout | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      setLayout(null)
      return
    }
    const mq = window.matchMedia(OVERLAY_MQ)

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

export function PortalReportNotifications({
  labels: m,
  items,
  loading,
  onRefresh,
  onSelect,
  refreshIntervalMs = 45_000,
}: Props) {
  const { locale } = useLocaleContext()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const overlayLayout = useOverlayLayout(open, buttonRef)
  const useOverlay = overlayLayout !== null

  const refresh = useCallback(() => void onRefresh(), [onRefresh])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(refresh, refreshIntervalMs)
    return () => window.clearInterval(id)
  }, [refresh, refreshIntervalMs])

  useEffect(() => {
    if (!open || useOverlay) return
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open, useOverlay])

  const unseenCount = items.filter((item) => item.unread).length

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  function handlePick(item: PortalReportNotificationItem) {
    onSelect(item)
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
            <li key={item.id}>
              <button
                type="button"
                role="menuitem"
                className={`w-full border-b border-slate-50 px-4 py-3 text-start transition hover:bg-urgen-purple/5 ${
                  item.seen ? 'opacity-70' : ''
                }`}
                onClick={() => handlePick(item)}
              >
                <p className={`text-urgen-navy ${item.unread ? 'font-semibold' : 'font-medium'}`}>
                  {item.patientName}
                </p>
                <p className="mt-0.5 text-xs text-emerald-800">{m.notificationsReady}</p>
                <p className="mt-1 text-xs text-slate-600">{item.label}</p>
                <p className="mt-1 text-xs text-slate-500">
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

      {open && !useOverlay && (
        <div
          ref={panelRef}
          role="menu"
          className="absolute end-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
        >
          {menuContent}
        </div>
      )}

      {open &&
        useOverlay &&
        overlayLayout &&
        createPortal(
          <div className="fixed inset-0 z-[200]" role="presentation">
            <button
              type="button"
              className="absolute inset-0 bg-black/25"
              aria-label={m.notificationsClose}
              onClick={() => setOpen(false)}
            />
            <div
              role="menu"
              className="absolute overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
              style={{
                top: overlayLayout.top,
                left: overlayLayout.left,
                width: overlayLayout.width,
                maxHeight: overlayLayout.maxHeight,
              }}
            >
              {menuContent}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
