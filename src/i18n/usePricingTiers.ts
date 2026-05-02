import { useMemo } from 'react'
import { pricingTierDefs } from '../data/pricing'
import type { PricingTier } from '../types/pricing'
import { useLocaleContext } from './useLocaleContext'

export function usePricingTiers(): PricingTier[] {
  const { messages: m } = useLocaleContext()

  return useMemo(
    () =>
      pricingTierDefs.map((def) => {
        const t = m.pricing.tiers[def.id]
        return {
          ...def,
          name: t.name,
          description: t.description,
          features: [...t.features],
        }
      }),
    [m],
  )
}
