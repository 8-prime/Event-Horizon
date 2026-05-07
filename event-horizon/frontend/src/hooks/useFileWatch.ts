import { useEffect } from 'react'
import type { Entry } from './useEntryStream'
import type { FilterQuery } from './useFilter'

const BASE = 'http://127.0.0.1:57321'

/**
 * Opens an SSE connection to /watch/events?fileId=x.
 * New entries are appended to entriesRef and, if they pass the current filter,
 * onNewEntry is called so the UI can append them.
 */
export function useFileWatch(
  fileId: string | null,
  entriesRef: React.MutableRefObject<Entry[]>,
  currentQuery: FilterQuery | null,
  onNewEntry: (e: Entry) => void
) {
  useEffect(() => {
    if (!fileId) return

    const es = new EventSource(`${BASE}/watch/events?fileId=${encodeURIComponent(fileId)}`)

    es.onmessage = (event) => {
      try {
        const entry: Entry = JSON.parse(event.data)
        entriesRef.current.push(entry)

        if (passesFilter(entry, currentQuery)) {
          onNewEntry(entry)
        }
      } catch {}
    }

    es.onerror = () => {
      // SSE will auto-reconnect; nothing to do
    }

    return () => es.close()
  }, [fileId])
}

function passesFilter(e: Entry, q: FilterQuery | null): boolean {
  if (!q) return true

  if (q.levels && q.levels.length > 0 && !q.levels.includes(e.lvl)) return false
  if (q.timeFrom && e.ts < q.timeFrom) return false
  if (q.timeTo && e.ts > q.timeTo) return false
  if (q.queries && q.queries.length > 0 && !q.queries.some((s) => e.msg.toLowerCase().includes(s.toLowerCase()))) return false

  if (q.propFilters) {
    for (const pf of q.propFilters) {
      const val = e.props?.[pf.key]
      if (pf.op === 'exists' && val === undefined) return false
      if (pf.op === '=' && String(val) !== pf.value) return false
      if (pf.op === '!=' && String(val) === pf.value) return false
      if (
        pf.op === 'contains' &&
        !String(val ?? '')
          .toLowerCase()
          .includes(pf.value.toLowerCase())
      )
        return false
    }
  }

  return true
}
