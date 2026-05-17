import { useEffect, useState } from 'react'
import { fetchTestCategories } from '../lib/testCategoriesStore'
import type { TestCategoryRecord } from '../types/testCategory'

export function useTestCategories() {
  const [categories, setCategories] = useState<TestCategoryRecord[]>([])
  const [loading, setLoading] = useState(true)

  async function reload() {
    setLoading(true)
    setCategories(await fetchTestCategories())
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [])

  return { categories, loading, reload }
}
