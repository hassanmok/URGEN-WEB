import { useEffect, useState } from 'react'
import { fallbackTests } from '../data/tests'
import { supabase } from '../lib/supabase'
import type { TestRow } from '../types/database'

function mapFallback(): TestRow[] {
  return fallbackTests.map((t, i) => ({
    ...t,
    id: `local-${i}`,
    created_at: null,
  }))
}

export function useTests() {
  const [tests, setTests] = useState<TestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!supabase) {
        setTests(mapFallback())
        setUsingFallback(true)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: qErr } = await supabase
        .from('tests')
        .select('*')
        .order('sort_order', { ascending: true })

      if (cancelled) return

      if (qErr) {
        setError(qErr.message)
        setTests(mapFallback())
        setUsingFallback(true)
      } else if (!data?.length) {
        setTests(mapFallback())
        setUsingFallback(true)
      } else {
        setTests(data as TestRow[])
        setUsingFallback(false)
      }

      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { tests, loading, error, usingFallback }
}

export function useTestBySlug(slug: string | undefined) {
  const { tests, loading, error, usingFallback } = useTests()
  const test = slug ? tests.find((t) => t.slug === slug) : undefined
  return { test, loading, error, usingFallback }
}
