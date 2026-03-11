import { useState, memo } from 'react'
import LevelBadge from './LevelBadge'
import PropPill from './PropPill'
import { formatTs } from '../lib/clef'
import type { Entry } from '../hooks/useEntryStream'

const MAX_INLINE_PROPS = 6

interface Props {
  entry: Entry
  fileName: string
  query: string
  onPropFilter: (key: string, value: string) => void
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[#854d0e] text-amber-100 rounded-[2px]">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function LogRow({ entry, fileName, query, onPropFilter }: Props) {
  const [expanded, setExpanded] = useState(false)
  const props = entry.props ?? {}
  const propEntries = Object.entries(props)

  const toggle = () => setExpanded(v => !v)

  const inlineProps = propEntries.slice(0, MAX_INLINE_PROPS)
  const extraCount = propEntries.length - MAX_INLINE_PROPS

  const tsStr = formatTs(entry.ts)

  return (
    <div
      className={`border-b border-[#0d0d0d] cursor-pointer ${expanded ? 'bg-[#111]' : 'bg-transparent hover:bg-[#0d0d0d]'}`}
      onClick={toggle}
    >
      {/* Collapsed row */}
      <div className="flex items-center gap-2 px-3 h-8 overflow-hidden">
        <span className="w-[170px] shrink-0 text-[11px] text-[#737c8a] tabular-nums whitespace-nowrap">
          {tsStr}
        </span>
        <LevelBadge level={entry.lvl} />
        <span className="flex-1 text-[13px] text-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">
          {highlight(entry.msg, query)}
        </span>
        <span className="text-[11px] text-[#737c8a] shrink-0 whitespace-nowrap">
          {fileName}
        </span>
      </div>

      {/* Inline props row (collapsed only) */}
      {!expanded && inlineProps.length > 0 && (
        <div className="flex items-center gap-1 pt-0.5 px-3 pb-1 pl-[206px] flex-nowrap overflow-hidden">
          {inlineProps.map(([k, v]) => (
            <PropPill
              key={k}
              propKey={k}
              value={String(v)}
              onFilter={(key, val) => { onPropFilter(key, val) }}
            />
          ))}
          {extraCount > 0 && (
            <span className="text-[11px] text-gray-600 shrink-0">
              +{extraCount} more
            </span>
          )}
        </div>
      )}

      {/* Expanded view */}
      {expanded && (
        <div
          className="mx-3 mb-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-[4px] py-2.5 px-3 text-[12px]"
          onClick={e => e.stopPropagation()}
        >
          {propEntries.length > 0 && (
            <section className="mb-2">
              <div className="text-gray-600 text-[11px] font-semibold mb-1.5 tracking-[0.08em] uppercase">
                Properties
              </div>
              <div className="flex flex-wrap gap-1">
                {propEntries.map(([k, v]) => (
                  <PropPill
                    key={k}
                    propKey={k}
                    value={typeof v === 'object' ? JSON.stringify(v) : String(v)}
                    onFilter={onPropFilter}
                  />
                ))}
              </div>
            </section>
          )}

          {entry.ex && (
            <section className="mb-2">
              <div className="text-gray-600 text-[11px] font-semibold mb-1.5 tracking-[0.08em] uppercase">
                Exception
              </div>
              <pre className="m-0 text-red-400 text-[11px] whitespace-pre-wrap break-all bg-[#0d0d0d] p-2 rounded-[3px]">
                {entry.ex}
              </pre>
            </section>
          )}

          <section>
            <div className="text-gray-600 text-[11px] font-semibold mb-1.5 tracking-[0.08em] uppercase">
              Raw
            </div>
            <pre className="m-0 text-gray-500 text-[11px] whitespace-pre-wrap break-all bg-[#0d0d0d] p-2 rounded-[3px]">
              {JSON.stringify(entry, null, 2)}
            </pre>
          </section>
        </div>
      )}
    </div>
  )
}

export default memo(LogRow)
