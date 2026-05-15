import type { TestCategoryId } from '../types/labTest'

const categoryGradients: Record<TestCategoryId, string> = {
  oncology_somatic: 'from-urgen-navy via-[#3949ab] to-urgen-purple',
  hereditary_cancer: 'from-[#4a148c] via-urgen-purple to-urgen-magenta',
  reproductive: 'from-[#01579b] via-[#5c6bc0] to-urgen-purple',
  nipt: 'from-[#0d47a1] via-urgen-sky to-[#4fc3f7]',
  pediatric_newborn: 'from-urgen-purple via-[#8e24aa] to-[#ec407a]',
}

const fallbackGradients = [
  'from-urgen-navy via-urgen-purple to-urgen-magenta',
  'from-[#0D47A1] via-[#7b1fa2] to-[#d81b60]',
  'from-[#1a237e] via-[#03a9f4] to-[#7b1fa2]',
  'from-[#4a148c] via-urgen-purple to-urgen-sky',
] as const

export function getTestGradientClass(test: {
  slug: string
  category?: string | null
}): string {
  if (test.category && test.category in categoryGradients) {
    return `bg-gradient-to-br ${categoryGradients[test.category as TestCategoryId]}`
  }

  let hash = 0
  for (let i = 0; i < test.slug.length; i++) {
    hash = (hash + test.slug.charCodeAt(i)) % fallbackGradients.length
  }

  return `bg-gradient-to-br ${fallbackGradients[hash]!}`
}
