import { useCallback, useEffect, useState } from 'react'
import { fetchPublishedNews } from '../lib/newsStore'
import type { NewsRecord } from '../types/news'

export function useNews() {
  const [news, setNews] = useState<NewsRecord[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const data = await fetchPublishedNews()
    setNews(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { news, loading, reload }
}
