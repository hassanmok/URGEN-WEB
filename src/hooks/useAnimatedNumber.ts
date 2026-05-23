import { useEffect, useState } from 'react'

/** Count-up animation for dashboard numbers. */
export function useAnimatedNumber(
  target: number,
  options?: { duration?: number; enabled?: boolean; decimals?: number },
): number {
  const duration = options?.duration ?? 900
  const enabled = options?.enabled ?? true
  const decimals = options?.decimals ?? 0

  const [value, setValue] = useState(enabled ? 0 : target)

  useEffect(() => {
    if (!enabled) {
      setValue(target)
      return
    }

    const start = performance.now()
    const from = 0

    function frame(now: number) {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      const next = from + (target - from) * eased
      const factor = 10 ** decimals
      setValue(Math.round(next * factor) / factor)
      if (t < 1) requestAnimationFrame(frame)
      else setValue(target)
    }

    const id = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(id)
  }, [target, duration, enabled, decimals])

  return value
}
