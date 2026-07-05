import { useEffect, useState } from 'react'
import { Button } from './Button'

type Props = {
  open: boolean
  title: string
  placeholder?: string
  confirmLabel: string
  cancelLabel?: string
  initialValue?: string
  onConfirm: (value: string) => void
  onClose: () => void
}

export function OtherTextDialog({
  open,
  title,
  placeholder,
  confirmLabel,
  cancelLabel,
  initialValue = '',
  onConfirm,
  onClose,
}: Props) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    if (open) setValue(initialValue)
  }, [open, initialValue])

  if (!open) return null

  function submit() {
    const trimmed = value.trim()
    if (!trimmed) return
    onConfirm(trimmed)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="other-text-dialog-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 id="other-text-dialog-title" className="text-lg font-bold text-urgen-navy">
          {title}
        </h3>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20"
          autoFocus
        />
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {cancelLabel && (
            <Button type="button" variant="outline" onClick={onClose}>
              {cancelLabel}
            </Button>
          )}
          <Button type="button" onClick={submit} disabled={!value.trim()}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
