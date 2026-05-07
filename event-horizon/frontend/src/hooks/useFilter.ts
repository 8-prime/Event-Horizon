import { useEffect, useRef, useState } from 'react'

const BASE = 'http://127.0.0.1:57321'

export interface PropFilter {
  key: string
  op: string
  value: string
}

export interface FilterQuery {
  fileId: string
  levels?: number[]
  timeFrom?: number
  timeTo?: number
  propFilters?: PropFilter[]
  queries?: string[]
}

/**
 * Debounced filter hook. Posts FilterQuery to /filter and returns a Set of matching IDs.
 * Returns null while loading (means "show all").
 */
export function useFilter(
  query: FilterQuery | null,
  streamCount: number // changes when stream finishes, triggers re-filter
): Set<number> | null {
  const [filteredIds, setFilteredIds] = useState<Set<number> | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!query) {
      setFilteredIds(null)
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl

      try {
        const res = await fetch(`${BASE}/filter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(query),
          signal: ctrl.signal,
        })

        const ids: number[] = await res.json()
        setFilteredIds(new Set(ids))
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') console.error('filter error', err)
      }
    }, 150)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, streamCount])

  return filteredIds
}
