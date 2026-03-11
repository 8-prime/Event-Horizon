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

  const sectionLabelClass = 'text-[10px] font-bold tracking-[0.1em] uppercase text-gray-600 mb-2'

  return (
    <div className="w-[252px] shrink-0 bg-[#060606] border-r border-[#111] flex flex-col overflow-y-auto overflow-x-hidden">
      {/* LEVEL */}
      <section className="p-3 border-b border-[#111]">
        <div className={sectionLabelClass}>Level</div>
        {LEVELS.map((name, idx) => {
          const cfg = LEVEL_CONFIG[name]
          const count = levelCounts[idx] ?? 0
          const active = activeLevels.size === 0 || activeLevels.has(idx)
          return (
            <div
              key={name}
              onClick={() => onToggleLevel(idx)}
              className={`flex items-center gap-2 py-1 px-1.5 rounded-[3px] cursor-pointer select-none hover:bg-[#0d0d0d] ${active ? 'opacity-100' : 'opacity-[0.35]'}`}
            >
              <span
                className="size-2 rounded-full shrink-0"
                style={{ background: cfg.color }}
              />
              <span className="flex-1 text-xs text-gray-300">{cfg.label}</span>
              <span className="text-[11px] text-gray-600">{count}</span>
            </div>
          )
        })}
      </section>

      {/* TIME RANGE */}
      <section className="p-3 border-b border-[#111]">
        <div className={sectionLabelClass}>Time Range</div>
        <div className="flex gap-1 mb-2 flex-wrap">
          {TIME_PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => handlePreset(p.ms)}
              className="bg-[#111] border border-[#2a2a2a] rounded-[3px] text-gray-400 text-[11px] px-[7px] py-0.5 cursor-pointer font-[inherit]"
            >
              {p.label}
            </button>
          ))}
          {(timeFrom || timeTo) && (
            <button
              onClick={() => onTimeChange(undefined, undefined)}
              className="bg-transparent border-none text-gray-600 text-[11px] cursor-pointer font-[inherit] px-1 py-0.5"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <input
            type="datetime-local"
            value={timeFrom ? nsToDatetimeLocal(timeFrom) : ''}
            onChange={e => onTimeChange(e.target.value ? datetimeLocalToNs(e.target.value) : undefined, timeTo)}
            placeholder="From"
            className="bg-[#0d0d0d] border border-[#2a2a2a] rounded text-gray-300 text-[11px] px-1.5 py-1 font-[inherit] [color-scheme:dark] w-full"
          />
          <input
            type="datetime-local"
            value={timeTo ? nsToDatetimeLocal(timeTo) : ''}
            onChange={e => onTimeChange(timeFrom, e.target.value ? datetimeLocalToNs(e.target.value) : undefined)}
            placeholder="To"
            className="bg-[#0d0d0d] border border-[#2a2a2a] rounded text-gray-300 text-[11px] px-1.5 py-1 font-[inherit] [color-scheme:dark] w-full"
          />
        </div>
      </section>

      {/* PROPERTY FILTERS */}
      <section className="p-3 border-b border-[#111]">
        <div className={sectionLabelClass}>Property Filters</div>

        {propFilters.map((pf, i) => (
          <div key={i} className="flex items-center gap-1 mb-1">
            <span className="text-[11px] text-gray-400 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
              {pf.key} {pf.op} {pf.value}
            </span>
            <button
              onClick={() => onRemovePropFilter(i)}
              className="bg-transparent border-none text-gray-600 cursor-pointer text-sm px-0.5 font-[inherit]"
            >×</button>
          </div>
        ))}

        <div className="flex flex-col gap-1 mt-1">
          <AutoInput
            value={newPfKey}
            onChange={setNewPfKey}
            suggestions={propKeysSuggestions}
            placeholder="Property key"
          />
          <select
            value={newPfOp}
            onChange={e => setNewPfOp(e.target.value)}
            className="bg-[#0d0d0d] border border-[#2a2a2a] rounded text-gray-300 text-xs px-1.5 py-1 font-[inherit] [color-scheme:dark]"
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
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded text-gray-400 text-xs px-2 py-1 cursor-pointer font-[inherit] text-left"
          >
            + Add filter
          </button>
        </div>

        {propKeysSuggestions.length > 0 && (
          <div className="mt-2.5">
            <div className="text-[10px] text-gray-700 mb-1">Known keys</div>
            <div className="flex flex-wrap gap-[3px]">
              {propKeysSuggestions.slice(0, 20).map(k => (
                <span
                  key={k}
                  onClick={() => setNewPfKey(k)}
                  className="text-[10px] text-gray-500 bg-[#111] border border-[#1a1a1a] rounded-[3px] px-[5px] py-px cursor-pointer"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* FILES */}
      <section className="p-3 flex-1">
        <div className={sectionLabelClass}>Files</div>
        {files.map(fi => (
          <div key={fi.fileId} className="flex items-center gap-1.5 py-1 px-1.5 rounded-[3px] mb-0.5">
            <span
              onClick={() => onToggleFile(fi.fileId)}
              className={`flex-1 text-xs cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap ${fi.visible ? 'text-gray-300' : 'text-gray-600'}`}
              title={fi.name}
            >
              {fi.name}
            </span>
            <span className="text-[11px] text-gray-700 shrink-0">{fi.total}</span>
            <button
              onClick={() => onCloseFile(fi.fileId)}
              className="bg-transparent border-none text-gray-700 cursor-pointer text-sm p-0 font-[inherit]"
            >×</button>
          </div>
        ))}
      </section>

      {/* Entry count footer */}
      <div className="px-3 py-2 border-t border-[#111] text-[11px] text-gray-600 text-right shrink-0">
        {filteredCount.toLocaleString()} / {totalCount.toLocaleString()} entries
      </div>
    </div>
  )
}
