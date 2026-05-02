export type PricingTierDef = {
  id: 'basic' | 'advanced' | 'comprehensive'
  priceIqd: number
  highlighted?: boolean
}

/** Resolved tier row for rendering (merged from defs + i18n). */
export type PricingTier = PricingTierDef & {
  name: string
  description: string
  features: string[]
}
