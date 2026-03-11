import { useRef, useCallback, useState } from 'react'
import { useVirtualScroll } from '../hooks/useVirtualScroll'
import LogRow from './LogRow'
import type { Entry } from '../hooks/useEntryStream'

const COLLAPSED_BASE = 32
const COLLAPSED_WITH_PROPS = 52  // +props pill row
const EXPANDED_HEIGHT = 280       // initial estimate; refined by ResizeObserver

interface Props {
  entries: Entry[]
  fileName: string
  query: string
  onPropFilter: (key: string, value: string) => void
}

export default function VirtualList({ entries, fileName, query, onPropFilter }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [expandedHeights] = useState<Map<number, number>>(new Map())
  const [expandedIds] = useState<Set<number>>(new Set())

  const getItemHeight = useCallback((i: number): number => {
    const e = entries[i]
    if (!e) return COLLAPSED_BASE
    const eId = e.id
    if (expandedIds.has(eId)) {
      return expandedHeights.get(eId) ?? EXPANDED_HEIGHT
    }
    const hasProps = e.props && Object.keys(e.props).length > 0
    return hasProps ? COLLAPSED_WITH_PROPS : COLLAPSED_BASE
  }, [entries, expandedHeights, expandedIds])

  const { startIndex, endIndex, totalHeight } = useVirtualScroll(
    containerRef,
    entries.length,
    getItemHeight
  )

  // Compute absolute positions for visible items
  let cumHeight = 0
  const positions: number[] = []
  for (let i = 0; i < entries.length; i++) {
    positions.push(cumHeight)
    cumHeight += getItemHeight(i)
  }

  const visibleItems = []
  for (let i = startIndex; i < endIndex; i++) {
    const entry = entries[i]
    if (!entry) continue
    visibleItems.push(
      <div
        key={entry.id}
        className="absolute left-0 right-0"
        style={{ top: positions[i] }}
      >
        <LogRow
          entry={entry}
          fileName={fileName}
          query={query}
          onPropFilter={onPropFilter}
        />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto relative"
    >
      <div className="relative" style={{ height: totalHeight }}>
        {visibleItems}
      </div>
    </div>
  )
}
