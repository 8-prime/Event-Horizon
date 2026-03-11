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
  style?: React.CSSProperties
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#854d0e', color: '#fef3c7', borderRadius: '2px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function LogRow({ entry, fileName, query, onPropFilter, style }: Props) {
  const [expanded, setExpanded] = useState(false)
  const props = entry.props ?? {}
  const propEntries = Object.entries(props)

  const toggle = () => setExpanded(v => !v)

  const inlineProps = propEntries.slice(0, MAX_INLINE_PROPS)
  const extraCount = propEntries.length - MAX_INLINE_PROPS

  const tsStr = formatTs(entry.ts)

  return (
    <div
      style={{
        background: expanded ? '#111' : 'transparent',
        borderBottom: '1px solid #0d0d0d',
        cursor: 'pointer',
        ...style,
      }}
      onClick={toggle}
      onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = '#0d0d0d' }}
      onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = 'transparent' }}
    >
      {/* Collapsed row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 12px',
        height: '32px',
        overflow: 'hidden',
      }}>
        <span style={{
          width: '170px',
          flexShrink: 0,
          fontSize: '12px',
          color: '#737c8a',
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}>
          {tsStr}
        </span>
        <LevelBadge level={entry.lvl} />
        <span style={{
          flex: 1,
          fontSize: '13px',
          color: '#d1d5db',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {highlight(entry.msg, query)}
        </span>
        <span style={{
          fontSize: '11px',
          color: '#737c8a',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          {fileName}
        </span>
      </div>

      {/* Inline props row (collapsed only) */}
      {!expanded && inlineProps.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 12px 4px',
          paddingLeft: '206px', // aligns under message (170+8+badge+8)
          flexWrap: 'nowrap',
          overflow: 'hidden',
        }}>
          {inlineProps.map(([k, v]) => (
            <PropPill
              key={k}
              propKey={k}
              value={String(v)}
              onFilter={(key, val) => { onPropFilter(key, val) }}
            />
          ))}
          {extraCount > 0 && (
            <span style={{ fontSize: '11px', color: '#4b5563', flexShrink: 0 }}>
              +{extraCount} more
            </span>
          )}
        </div>
      )}

      {/* Expanded view */}
      {expanded && (
        <div style={{
          margin: '0 12px 8px',
          background: '#0a0a0a',
          border: '1px solid #1a1a1a',
          borderRadius: '4px',
          padding: '10px 12px',
          fontSize: '12px',
        }}
          onClick={e => e.stopPropagation()}
        >
          {propEntries.length > 0 && (
            <section style={{ marginBottom: '8px' }}>
              <div style={{ color: '#4b5563', fontSize: '11px', fontWeight: 600, marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Properties
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
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
            <section style={{ marginBottom: '8px' }}>
              <div style={{ color: '#4b5563', fontSize: '11px', fontWeight: 600, marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Exception
              </div>
              <pre style={{
                margin: 0,
                color: '#f87171',
                fontSize: '11px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                background: '#0d0d0d',
                padding: '8px',
                borderRadius: '3px',
              }}>
                {entry.ex}
              </pre>
            </section>
          )}

          <section>
            <div style={{ color: '#4b5563', fontSize: '11px', fontWeight: 600, marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Raw
            </div>
            <pre style={{
              margin: 0,
              color: '#6b7280',
              fontSize: '11px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              background: '#0d0d0d',
              padding: '8px',
              borderRadius: '3px',
            }}>
              {JSON.stringify(entry, null, 2)}
            </pre>
          </section>
        </div>
      )}
    </div>
  )
}

export default memo(LogRow)
