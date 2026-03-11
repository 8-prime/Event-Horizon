import { useState } from 'react'
import { LEVEL_CONFIG, LEVELS } from '../lib/clef'
import AutoInput from './AutoInput'
import type { PropFilter } from '../hooks/useFilter'

interface FileInfo {
  fileId: string
  name: string
  total: number
  visible: boolean
}

interface Props {
  files: FileInfo[]
  levelCounts: number[]       // count per level index 0-5
  activeLevels: Set<number>
  onToggleLevel: (lvl: number) => void
  timeFrom?: number
  timeTo?: number
  onTimeChange: (from?: number, to?: number) => void
  propFilters: PropFilter[]
  onAddPropFilter: (pf: PropFilter) => void
  onRemovePropFilter: (idx: number) => void
  propKeysSuggestions: string[]
  propValueSuggestions: (key: string) => string[]
  filteredCount: number
  totalCount: number
  onToggleFile: (fileId: string) => void
  onCloseFile: (fileId: string) => void
}

const TIME_PRESETS = [
  { label: '15m', ms: 15 * 60 * 1000 },
  { label: '1h',  ms: 60 * 60 * 1000 },
  { label: '6h',  ms: 6 * 60 * 60 * 1000 },
  { label: '12h', ms: 12 * 60 * 60 * 1000 },
  { label: '24h', ms: 24 * 60 * 60 * 1000 },
]

function nsToDatetimeLocal(ns: number): string {
  const d = new Date(ns / 1_000_000)
  const pad = (n: number, len = 2) => String(n).padStart(len, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function datetimeLocalToNs(s: string): number {
  return new Date(s).getTime() * 1_000_000
}

export default function Sidebar(props: Props) {
  const {
    files, levelCounts, activeLevels, onToggleLevel,
    timeFrom, timeTo, onTimeChange,
    propFilters, onAddPropFilter, onRemovePropFilter,
    propKeysSuggestions, propValueSuggestions,
    filteredCount, totalCount,
    onToggleFile, onCloseFile,
  } = props

  const [newPfKey, setNewPfKey] = useState('')
  const [newPfOp, setNewPfOp] = useState('=')
  const [newPfVal, setNewPfVal] = useState('')

  const handleAddProp = () => {
    if (!newPfKey) return
    onAddPropFilter({ key: newPfKey, op: newPfOp, value: newPfVal })
    setNewPfKey('')
    setNewPfVal('')
  }

  const handlePreset = (ms: number) => {
    const now = Date.now()
    onTimeChange((now - ms) * 1_000_000, now * 1_000_000)
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#4b5563',
    marginBottom: '8px',
  }

  return (
    <div style={{
      width: '252px',
      flexShrink: 0,
      background: '#060606',
      borderRight: '1px solid #111',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>
      {/* LEVEL */}
      <section style={{ padding: '12px', borderBottom: '1px solid #111' }}>
        <div style={sectionLabel}>Level</div>
        {LEVELS.map((name, idx) => {
          const cfg = LEVEL_CONFIG[name]
          const count = levelCounts[idx] ?? 0
          const active = activeLevels.size === 0 || activeLevels.has(idx)
          return (
            <div
              key={name}
              onClick={() => onToggleLevel(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 6px',
                borderRadius: '3px',
                cursor: 'pointer',
                opacity: active ? 1 : 0.35,
                userSelect: 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#0d0d0d'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{
                width: '8px', height: '8px',
                borderRadius: '50%',
                background: cfg.color,
                flexShrink: 0,
              }} />
              <span style={{ flex: 1, fontSize: '12px', color: '#d1d5db' }}>{cfg.label}</span>
              <span style={{ fontSize: '11px', color: '#4b5563' }}>{count}</span>
            </div>
          )
        })}
      </section>

      {/* TIME RANGE */}
      <section style={{ padding: '12px', borderBottom: '1px solid #111' }}>
        <div style={sectionLabel}>Time Range</div>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {TIME_PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => handlePreset(p.ms)}
              style={{
                background: '#111',
                border: '1px solid #2a2a2a',
                borderRadius: '3px',
                color: '#9ca3af',
                fontSize: '11px',
                padding: '2px 7px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {p.label}
            </button>
          ))}
          {(timeFrom || timeTo) && (
            <button
              onClick={() => onTimeChange(undefined, undefined)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#4b5563',
                fontSize: '11px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: '2px 4px',
              }}
            >
              Clear
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <input
            type="datetime-local"
            value={timeFrom ? nsToDatetimeLocal(timeFrom) : ''}
            onChange={e => onTimeChange(e.target.value ? datetimeLocalToNs(e.target.value) : undefined, timeTo)}
            placeholder="From"
            style={{
              background: '#0d0d0d',
              border: '1px solid #2a2a2a',
              borderRadius: '4px',
              color: '#d1d5db',
              fontSize: '11px',
              padding: '4px 6px',
              fontFamily: 'inherit',
              colorScheme: 'dark',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          <input
            type="datetime-local"
            value={timeTo ? nsToDatetimeLocal(timeTo) : ''}
            onChange={e => onTimeChange(timeFrom, e.target.value ? datetimeLocalToNs(e.target.value) : undefined)}
            placeholder="To"
            style={{
              background: '#0d0d0d',
              border: '1px solid #2a2a2a',
              borderRadius: '4px',
              color: '#d1d5db',
              fontSize: '11px',
              padding: '4px 6px',
              fontFamily: 'inherit',
              colorScheme: 'dark',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </section>

      {/* PROPERTY FILTERS */}
      <section style={{ padding: '12px', borderBottom: '1px solid #111' }}>
        <div style={sectionLabel}>Property Filters</div>

        {propFilters.map((pf, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pf.key} {pf.op} {pf.value}
            </span>
            <button
              onClick={() => onRemovePropFilter(i)}
              style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: '14px', padding: '0 2px', fontFamily: 'inherit' }}
            >×</button>
          </div>
        ))}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
          <AutoInput
            value={newPfKey}
            onChange={setNewPfKey}
            suggestions={propKeysSuggestions}
            placeholder="Property key"
          />
          <select
            value={newPfOp}
            onChange={e => setNewPfOp(e.target.value)}
            style={{
              background: '#0d0d0d',
              border: '1px solid #2a2a2a',
              borderRadius: '4px',
              color: '#d1d5db',
              fontSize: '12px',
              padding: '4px 6px',
              fontFamily: 'inherit',
              colorScheme: 'dark',
            }}
          >
            <option value="=">=</option>
            <option value="!=">!=</option>
            <option value="contains">contains</option>
            <option value="!contains">!contains</option>
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
            <option value="exists">exists</option>
          </select>
          {newPfOp !== 'exists' && (
            <AutoInput
              value={newPfVal}
              onChange={setNewPfVal}
              suggestions={propValueSuggestions(newPfKey)}
              placeholder="Value"
            />
          )}
          <button
            onClick={handleAddProp}
            style={{
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '4px',
              color: '#9ca3af',
              fontSize: '12px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
            }}
          >
            + Add filter
          </button>
        </div>

        {propKeysSuggestions.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <div style={{ fontSize: '10px', color: '#374151', marginBottom: '4px' }}>Known keys</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
              {propKeysSuggestions.slice(0, 20).map(k => (
                <span
                  key={k}
                  onClick={() => setNewPfKey(k)}
                  style={{
                    fontSize: '10px',
                    color: '#6b7280',
                    background: '#111',
                    border: '1px solid #1a1a1a',
                    borderRadius: '3px',
                    padding: '1px 5px',
                    cursor: 'pointer',
                  }}
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* FILES */}
      <section style={{ padding: '12px', flex: 1 }}>
        <div style={sectionLabel}>Files</div>
        {files.map(fi => (
          <div key={fi.fileId} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 6px',
            borderRadius: '3px',
            marginBottom: '2px',
          }}>
            <span
              onClick={() => onToggleFile(fi.fileId)}
              style={{
                flex: 1,
                fontSize: '12px',
                color: fi.visible ? '#d1d5db' : '#4b5563',
                cursor: 'pointer',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={fi.name}
            >
              {fi.name}
            </span>
            <span style={{ fontSize: '11px', color: '#374151', flexShrink: 0 }}>{fi.total}</span>
            <button
              onClick={() => onCloseFile(fi.fileId)}
              style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', fontSize: '14px', padding: '0', fontFamily: 'inherit' }}
            >×</button>
          </div>
        ))}
      </section>

      {/* Entry count footer */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid #111',
        fontSize: '11px',
        color: '#4b5563',
        textAlign: 'right',
        flexShrink: 0,
      }}>
        {filteredCount.toLocaleString()} / {totalCount.toLocaleString()} entries
      </div>
    </div>
  )
}
