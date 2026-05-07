import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useVirtualScroll } from '../hooks/useVirtualScroll'
import LogRow from './LogRow'
import type { Entry } from '../hooks/useEntryStream'

const ROW_BASE = 32 // message only
const ROW_WITH_PROPS = 52 // message + props pill row

interface Props {
  entries: Entry[]
  fileName: string
  query: string
  selectedId?: number
  onSelect: (entry: Entry) => void
  onPropFilter: (key: string, value: string) => void
}

export interface VirtualListHandle {
  scrollToEntry: (id: number) => void
}

const VirtualList = forwardRef<VirtualListHandle, Props>(function VirtualList({
  entries,
  fileName,
  query,
  selectedId,
  onSelect,
  onPropFilter,
}: Props, ref) {
  const containerRef = useRef<HTMLDivElement>(null)

  const getItemHeight = useCallback(
    (i: number): number => {
      const e = entries[i]
      if (!e) return ROW_BASE
      const hasProps = e.props && Object.keys(e.props).length > 0
      return hasProps ? ROW_WITH_PROPS : ROW_BASE
    },
    [entries]
  )

  useImperativeHandle(ref, () => ({
    scrollToEntry: (id: number) => {
      const idx = entries.findIndex((e) => e.id === id)
      if (idx === -1 || !containerRef.current) return
      let top = 0
      for (let i = 0; i < idx; i++) top += getItemHeight(i)
      const rowHeight = getItemHeight(idx)
      const offset = containerRef.current.clientHeight / 2 - rowHeight / 2
      containerRef.current.scrollTo({ top: Math.max(0, top - offset), behavior: 'smooth' })
    },
  }), [entries, getItemHeight])

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
      <div key={entry.id} className="absolute left-0 right-0" style={{ top: positions[i] }}>
        <LogRow
          entry={entry}
          fileName={fileName}
          query={query}
          isSelected={entry.id === selectedId}
          onSelect={onSelect}
          onPropFilter={onPropFilter}
        />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto relative">
      <div className="relative" style={{ height: totalHeight }}>
        {visibleItems}
      </div>
    </div>
  )
})

export default VirtualList
