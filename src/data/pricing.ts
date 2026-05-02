import type { PricingTierDef } from '../types/pricing'

/** Numeric/static tier data — localized names live in `src/i18n/messages.ts`. */
export const pricingTierDefs: PricingTierDef[] = [
  {
    id: 'basic',
    priceIqd: 150_000,
  },
  {
    id: 'advanced',
    priceIqd: 250_000,
    highlighted: true,
  },
  {
    id: 'comprehensive',
    priceIqd: 350_000,
  },
]
