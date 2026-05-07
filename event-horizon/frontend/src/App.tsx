import { useRef, useState, useCallback } from 'react'
import { OpenFileDialog, LoadFile, CloseFile } from '../wailsjs/go/main/App'
import { useEntryStream, type Entry } from './hooks/useEntryStream'
import { useFilter, type FilterQuery, type PropFilter } from './hooks/useFilter'
import { useFileWatch } from './hooks/useFileWatch'
import VirtualList, { type VirtualListHandle } from './components/VirtualList'
import Sidebar from './components/Sidebar'
import FilterBar from './components/FilterBar'
import DetailPanel from './components/DetailPanel'
import { LEVELS } from './lib/clef'

interface FileInfo {
  fileId: string
  name: string
  total: number
  propKeys: string[]
  visible: boolean
}

export default function App() {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [streamCount, setStreamCount] = useState(0)
  const [activeLevels, setActiveLevels] = useState<Set<number>>(new Set())
  const [timeFrom, setTimeFrom] = useState<number | undefined>()
  const [timeTo, setTimeTo] = useState<number | undefined>()
  const [propFilters, setPropFilters] = useState<PropFilter[]>([])
  const [searchQueries, setSearchQueries] = useState<string[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [liveTail, setLiveTail] = useState<Entry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
  const [panelPosition, setPanelPosition] = useState<'right' | 'bottom'>(
    () => (localStorage.getItem('panelPosition') as 'right' | 'bottom') ?? 'right'
  )

  const entriesRef = useRef<Entry[]>([])
  const virtualListRef = useRef<VirtualListHandle>(null)
  const activeFile = files.find((f) => f.fileId === activeFileId)

  const activeQueries = [...searchQueries, searchInput].filter(Boolean)

  const filterQuery: FilterQuery | null = activeFileId
    ? {
        fileId: activeFileId,
        levels: activeLevels.size > 0 ? Array.from(activeLevels) : undefined,
        timeFrom,
        timeTo,
        propFilters: propFilters.length > 0 ? propFilters : undefined,
        queries: activeQueries.length > 0 ? activeQueries : undefined,
      }
    : null

  const hasFilters =
    activeLevels.size > 0 ||
    timeFrom ||
    timeTo ||
    propFilters.length > 0 ||
    activeQueries.length > 0

  useEntryStream(activeFileId, entriesRef, () => {
    setStreamCount((c) => c + 1)
    setLiveTail([])
  })

  const filtered = useFilter(hasFilters ? filterQuery : null, streamCount)

  useFileWatch(activeFileId, entriesRef, hasFilters ? filterQuery : null, (e) => {
    setLiveTail((prev) => [...prev, e])
  })

  const displayedEntries: Entry[] = (() => {
    if (hasFilters && filtered !== null)
      return [...entriesRef.current, ...liveTail].filter((e) => filtered.has(e.id))
    return [...entriesRef.current, ...liveTail]
  })()

  const levelCounts = LEVELS.map((_, idx) => entriesRef.current.filter((e) => e.lvl === idx).length)

  const openFiles = async () => {
    const paths = await OpenFileDialog()
    if (!paths || paths.length === 0) return
    for (const path of paths) {
      const meta = await LoadFile(path)
      setFiles((prev) => {
        if (prev.some((f) => f.fileId === meta.fileId)) return prev
        return [
          ...prev,
          {
            fileId: meta.fileId,
            name: meta.name,
            total: meta.totalEntries,
            propKeys: meta.propKeys ?? [],
            visible: true,
          },
        ]
      })
      setActiveFileId(meta.fileId)
      setSelectedEntry(null)
    }
  }

  const handleCloseFile = (fileId: string) => {
    CloseFile(fileId)
    setFiles((prev) => prev.filter((f) => f.fileId !== fileId))
    if (activeFileId === fileId) {
      setActiveFileId(null)
      setSelectedEntry(null)
      entriesRef.current = []
    }
  }

  const handleToggleLevel = (lvl: number) => {
    setActiveLevels((prev) => {
      const next = new Set(prev)
      if (next.has(lvl)) next.delete(lvl)
      else next.add(lvl)
      return next
    })
  }

  const handlePropFilter = useCallback((key: string, value: string) => {
    setPropFilters((prev) => {
      if (prev.some((p) => p.key === key && p.op === '=' && p.value === value)) return prev
      return [...prev, { key, op: '=', value }]
    })
  }, [])

  const handleSelect = useCallback((entry: Entry) => {
    setSelectedEntry((prev) => (prev?.id === entry.id ? null : entry))
  }, [])

  const handleScrollToSelected = useCallback(() => {
    if (selectedEntry) virtualListRef.current?.scrollToEntry(selectedEntry.id)
  }, [selectedEntry])

  const handleTogglePanelPosition = () => {
    const next = panelPosition === 'right' ? 'bottom' : 'right'
    setPanelPosition(next)
    localStorage.setItem('panelPosition', next)
  }

  const propValueSuggestions = useCallback(
    (key: string) => {
      if (!activeFileId || !key) return []
      if (!activeFile?.propKeys.includes(key)) return []
      const vals = entriesRef.current
        .map((e) => e.props?.[key])
        .filter((v): v is unknown => v !== undefined)
        .map(String)
      return Array.from(new Set(vals)).slice(0, 20)
    },
    [activeFileId, activeFile]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
      .map((f) => (f as any).path as string)
      .filter(Boolean)
    for (const path of droppedFiles) {
      if (!path) continue
      const meta = await LoadFile(path)
      setFiles((prev) => {
        if (prev.some((f) => f.fileId === meta.fileId)) return prev
        return [
          ...prev,
          {
            fileId: meta.fileId,
            name: meta.name,
            total: meta.totalEntries,
            propKeys: meta.propKeys ?? [],
            visible: true,
          },
        ]
      })
      setActiveFileId(meta.fileId)
      setSelectedEntry(null)
    }
  }

  const totalCount = entriesRef.current.length + liveTail.length
  const filteredCount = displayedEntries.length

  return (
    <div className="flex flex-col h-screen bg-[#080808] overflow-hidden">
      {/* Header */}
      <header className="h-12 bg-[#050505] border-b border-[#111] flex items-center shrink-0">
        {/* Left section — matches sidebar width */}
        <div className="w-[252px] shrink-0 flex items-center gap-2 px-4">
          <img src="/appicon.png" alt="" className="w-5 h-5 object-contain" />
          <span className="font-bold text-sm text-gray-200 tracking-[0.05em] whitespace-nowrap">
            Event Horizon
          </span>
        </div>

        {/* Right section — aligns with main content */}
        <div className="flex-1 flex items-center gap-3 pr-4 overflow-hidden">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchInput.trim()) {
                setSearchQueries((prev) => [...prev, searchInput.trim()])
                setSearchInput('')
              }
            }}
            placeholder="Search messages… (Enter to pin)"
            className="w-[320px] shrink-0 bg-[#0d0d0d] border border-[#1f1f1f] rounded-md text-gray-300 text-[13px] px-3 py-[5px] outline-none font-[inherit]"
          />

          <div className="flex-1" />

          {files.map((fi) => (
            <button
              key={fi.fileId}
              onClick={() => {
                setActiveFileId(fi.fileId)
                setSelectedEntry(null)
              }}
              className={`border rounded px-[10px] py-[3px] text-xs cursor-pointer font-[inherit] max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap ${
                activeFileId === fi.fileId
                  ? 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-200'
                  : 'bg-transparent border-transparent text-gray-500'
              }`}
              title={fi.name}
            >
              {fi.name}
            </button>
          ))}

          <button
            onClick={openFiles}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md text-gray-400 text-xs px-3 py-[5px] cursor-pointer font-[inherit] shrink-0 whitespace-nowrap"
          >
            Open files
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {files.length > 0 && (
          <Sidebar
            files={files}
            levelCounts={levelCounts}
            activeLevels={activeLevels}
            onToggleLevel={handleToggleLevel}
            timeFrom={timeFrom}
            timeTo={timeTo}
            onTimeChange={(f, t) => {
              setTimeFrom(f)
              setTimeTo(t)
            }}
            propFilters={propFilters}
            onAddPropFilter={(pf) => setPropFilters((prev) => [...prev, pf])}
            onRemovePropFilter={(idx) => setPropFilters((prev) => prev.filter((_, i) => i !== idx))}
            propKeysSuggestions={activeFile?.propKeys ?? []}
            propValueSuggestions={propValueSuggestions}
            filteredCount={filteredCount}
            totalCount={totalCount}
            onToggleFile={(fileId) =>
              setFiles((prev) =>
                prev.map((f) => (f.fileId === fileId ? { ...f, visible: !f.visible } : f))
              )
            }
            onCloseFile={handleCloseFile}
          />
        )}

        {/* Main pane */}
        <div
          className={`flex-1 flex flex-col overflow-hidden ${isDragging ? 'outline outline-2 outline-green-500 -outline-offset-2' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {files.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-700 select-none">
              <svg
                width="48"
                height="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
              </svg>
              <div className="text-sm">Drop log files here or click Open files</div>
              <button
                onClick={openFiles}
                className="bg-[#111] border border-[#2a2a2a] rounded-md text-gray-400 text-[13px] px-5 py-2 cursor-pointer font-[inherit]"
              >
                Open files
              </button>
            </div>
          ) : activeFileId && displayedEntries.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-[32px] text-gray-700 select-none">
              ∅
            </div>
          ) : activeFileId ? (
            <div
              className={`flex-1 flex overflow-hidden min-h-0 ${panelPosition === 'bottom' ? 'flex-col' : 'flex-row'}`}
            >
              {/* Log list */}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                <FilterBar
                  timeFrom={timeFrom}
                  timeTo={timeTo}
                  propFilters={propFilters}
                  searchQueries={searchQueries}
                  onRemoveTime={() => {
                    setTimeFrom(undefined)
                    setTimeTo(undefined)
                  }}
                  onRemoveProp={(idx) => setPropFilters((prev) => prev.filter((_, i) => i !== idx))}
                  onRemoveSearch={(idx) =>
                    setSearchQueries((prev) => prev.filter((_, i) => i !== idx))
                  }
                />
                <VirtualList
                  ref={virtualListRef}
                  entries={displayedEntries}
                  fileName={activeFile?.name ?? ''}
                  queries={activeQueries}
                  selectedId={selectedEntry?.id}
                  onSelect={handleSelect}
                  onPropFilter={handlePropFilter}
                />
              </div>

              {/* Detail panel */}
              {selectedEntry && (
                <DetailPanel
                  entry={selectedEntry}
                  position={panelPosition}
                  onClose={() => setSelectedEntry(null)}
                  onTogglePosition={handleTogglePanelPosition}
                  onScrollToSelected={handleScrollToSelected}
                />
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-700 text-[13px]">
              Select a file tab above
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
