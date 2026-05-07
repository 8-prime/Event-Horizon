import { memo } from 'react'
import LevelBadge from './LevelBadge'
import PropPill from './PropPill'
import { formatTs } from '../lib/clef'
import type { Entry } from '../hooks/useEntryStream'

const MAX_INLINE_PROPS = 5

interface Props {
  entry: Entry
  fileName: string
  queries: string[]
  isSelected: boolean
  onSelect: (entry: Entry) => void
  onPropFilter: (key: string, value: string) => void
}

function highlight(text: string, queries: string[]): React.ReactNode {
  const active = queries.filter(Boolean)
  if (!active.length) return text

  const lower = text.toLowerCase()
  const ranges: [number, number][] = []

  for (const q of active) {
    const lq = q.toLowerCase()
    let i = 0
    while (true) {
      const pos = lower.indexOf(lq, i)
      if (pos === -1) break
      ranges.push([pos, pos + q.length])
      i = pos + 1
    }
  }

  if (!ranges.length) return text

  ranges.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const [s, e] of ranges) {
    if (merged.length && s <= merged[merged.length - 1][1])
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e)
    else merged.push([s, e])
  }

  const parts: React.ReactNode[] = []
  let pos = 0
  for (const [s, e] of merged) {
    if (pos < s) parts.push(text.slice(pos, s))
    parts.push(
      <mark key={s} className="bg-[#854d0e] text-amber-100 rounded-[2px]">
        {text.slice(s, e)}
      </mark>
    )
    pos = e
  }
  if (pos < text.length) parts.push(text.slice(pos))
  return <>{parts}</>
}

function LogRow({ entry, fileName, queries, isSelected, onSelect, onPropFilter }: Props) {
  const props = entry.props ?? {}
  const propEntries = Object.entries(props)
  const inlineProps = propEntries.slice(0, MAX_INLINE_PROPS)
  const extraCount = propEntries.length - MAX_INLINE_PROPS

  return (
    <div
      className={`flex items-start px-3 border-b border-[#0d0d0d] cursor-pointer ${
        isSelected ? 'bg-[#0d1520]' : 'bg-transparent hover:bg-[#0d0d0d]'
      }`}
      onClick={() => onSelect(entry)}
    >
      {/* Left col: timestamp + level badge — fixed width, aligned with first row */}
      <div className="flex items-center gap-2 h-8 shrink-0">
        <span className="w-[170px] shrink-0 text-[11px] text-[#737c8a] tabular-nums whitespace-nowrap">
          {formatTs(entry.ts)}
        </span>
        <LevelBadge level={entry.lvl} />
      </div>

      {/* Right col: message row + optional props row, naturally aligned */}
      <div className="flex-1 min-w-0 ml-2">
        <div className="flex items-center gap-2 h-8">
          <span className="flex-1 text-[13px] text-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">
            {highlight(entry.msg, queries)}
          </span>
          <span className="text-[11px] text-[#737c8a] shrink-0 whitespace-nowrap">{fileName}</span>
        </div>

        {inlineProps.length > 0 && (
          <div className="flex items-center gap-1 py-px pb-1 flex-nowrap overflow-hidden">
            {inlineProps.map(([k, v]) => (
              <PropPill key={k} propKey={k} value={String(v)} onFilter={onPropFilter} />
            ))}
            {extraCount > 0 && (
              <span className="text-[11px] text-gray-600 shrink-0">+{extraCount}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(LogRow)
