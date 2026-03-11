import { useEffect, useRef, useState } from 'react'
import type { Entry } from './useEntryStream'

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
  query?: string
}

/**
 * Debounced filter hook. Posts FilterQuery to /filter and returns matching entries.
 * Returns null while loading (means "show all").
 */
export function useFilter(
  query: FilterQuery | null,
  streamCount: number  // changes when stream finishes, triggers re-filter
): Entry[] | null {
  const [filtered, setFiltered] = useState<Entry[] | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!query) {
      setFiltered(null)
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

        if (!res.body) return

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''
        const results: Entry[] = []

        while (true) {
          const { done, value } = await reader.read()
          if (value) {
            buf += decoder.decode(value, { stream: true })
            const lines = buf.split('\n')
            buf = lines.pop() ?? ''
            for (const line of lines) {
              const t = line.trim()
              if (!t) continue
              try { results.push(JSON.parse(t)) } catch {}
            }
          }
          if (done) break
        }

        setFiltered(results)
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') console.error('filter error', err)
      }
    }, 150)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, streamCount])

  return filtered
}
