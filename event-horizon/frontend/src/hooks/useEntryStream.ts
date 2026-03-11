import { useEffect } from 'react'

const BASE = 'http://127.0.0.1:57321'

export interface Entry {
  id: number
  ts: number
  lvl: number
  msg: string
  ex?: string
  props?: Record<string, unknown>
  fileIdx: number
}

/**
 * Streams all entries for a fileId from /stream into entriesRef.
 * Calls onDone(count) when the stream ends.
 */
export function useEntryStream(
  fileId: string | null,
  entriesRef: React.MutableRefObject<Entry[]>,
  onDone: (count: number) => void
) {
  useEffect(() => {
    if (!fileId) return

    entriesRef.current = []
    let cancelled = false

    const run = async () => {
      try {
        const res = await fetch(`${BASE}/stream?fileId=${encodeURIComponent(fileId)}`)
        if (!res.body) return

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''

        while (true) {
          const { done, value } = await reader.read()
          if (cancelled) { reader.cancel(); break }
          if (value) {
            buf += decoder.decode(value, { stream: true })
            const lines = buf.split('\n')
            buf = lines.pop() ?? ''
            for (const line of lines) {
              const t = line.trim()
              if (!t) continue
              try {
                const e: Entry = JSON.parse(t)
                entriesRef.current.push(e)
              } catch {}
            }
          }
          if (done) break
        }

        if (!cancelled) {
          onDone(entriesRef.current.length)
        }
      } catch (err) {
        if (!cancelled) console.error('stream error', err)
      }
    }

    run()
    return () => { cancelled = true }
  }, [fileId])
}
