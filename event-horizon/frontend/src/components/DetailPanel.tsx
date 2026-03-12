import { formatTs } from '../lib/clef'
import LevelBadge from './LevelBadge'
import type { Entry } from '../hooks/useEntryStream'

interface Props {
  entry: Entry
  position: 'right' | 'bottom'
  onClose: () => void
  onTogglePosition: () => void
}

export default function DetailPanel({ entry, position, onClose, onTogglePosition }: Props) {
  const propEntries = Object.entries(entry.props ?? {})
  const tsStr = formatTs(entry.ts)

  const panelClass =
    position === 'right'
      ? 'w-[380px] shrink-0 flex flex-col border-l border-[#111] bg-[#060606]'
      : 'h-[280px] shrink-0 flex flex-col border-t border-[#111] bg-[#060606]'

  return (
    <div className={panelClass}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 h-9 border-b border-[#111] shrink-0">
        <LevelBadge level={entry.lvl} />
        <span className="text-[11px] text-[#737c8a] tabular-nums">{tsStr}</span>
        <div className="flex-1" />
        <button
          onClick={onTogglePosition}
          className="text-gray-600 hover:text-gray-400 cursor-pointer bg-transparent border-none p-1 flex items-center"
          title={position === 'right' ? 'Move to bottom' : 'Move to right'}
        >
          {position === 'right' ? (
            // Switch to bottom: show horizontal split icon
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="1" y="1" width="12" height="5" rx="1" opacity="0.35" />
              <rect x="1" y="8" width="12" height="5" rx="1" />
            </svg>
          ) : (
            // Switch to right: show vertical split icon
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="1" y="1" width="5" height="12" rx="1" opacity="0.35" />
              <rect x="8" y="1" width="5" height="12" rx="1" />
            </svg>
          )}
        </button>
        <button
          onClick={onClose}
          className="text-gray-600 hover:text-gray-400 cursor-pointer bg-transparent border-none text-base leading-none p-1"
          aria-label="Close panel"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-4 text-[12px]">
        {/* Message */}
        <div>
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-600 mb-1.5">
            Message
          </div>
          <div className="text-gray-200 text-[13px] leading-relaxed">{entry.msg}</div>
        </div>

        {/* Properties */}
        {propEntries.length > 0 && (
          <div>
            <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-600 mb-1.5">
              Properties
            </div>
            <div className="flex flex-col gap-0.5">
              {propEntries.map(([k, v]) => (
                <div key={k} className="flex gap-2 text-[11px]">
                  <span className="text-gray-600 shrink-0 w-[120px] truncate">{k}</span>
                  <span className="text-gray-300 break-all">
                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exception */}
        {entry.ex && (
          <div>
            <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-600 mb-1.5">
              Exception
            </div>
            <pre className="m-0 text-red-400 text-[11px] whitespace-pre-wrap break-all bg-[#0d0d0d] p-2 rounded-[3px]">
              {entry.ex}
            </pre>
          </div>
        )}

        {/* Raw */}
        <div>
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-600 mb-1.5">
            Raw
          </div>
          <pre className="m-0 text-gray-500 text-[11px] whitespace-pre-wrap break-all bg-[#0d0d0d] p-2 rounded-[3px]">
            {JSON.stringify(entry, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
