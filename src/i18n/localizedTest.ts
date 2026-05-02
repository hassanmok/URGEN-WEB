import type { TestRow } from '../types/database'
import type { Locale, Messages } from './messages'

export type LocalizedTestCopy = {
  title: string
  description: string
  long: string | null
}

export function getLocalizedTestCopy(test: TestRow, locale: Locale, m: Messages): LocalizedTestCopy {
  if (locale === 'ar') {
    return {
      title: test.title_ar,
      description: test.description_ar,
      long: test.long_description_ar,
    }
  }

  const slug = test.slug as keyof Messages['testsBySlug']
  const en = m.testsBySlug[slug]
  if (en) {
    return {
      title: en.title,
      description: en.description,
      long: en.long ?? test.long_description_ar,
    }
  }

  return {
    title: test.title_ar,
    description: test.description_ar,
    long: test.long_description_ar,
  }
}
