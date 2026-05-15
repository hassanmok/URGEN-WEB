import { useCallback, useEffect, useState } from 'react'
import { fetchPublishedEvents } from '../lib/eventsStore'
import type { EventRecord } from '../types/event'

export function useEvents() {
  const [events, setEvents] = useState<EventRecord[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const data = await fetchPublishedEvents()
    setEvents(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { events, loading, reload }
}
