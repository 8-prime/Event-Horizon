import { useRef, useState, useCallback } from 'react'
import { OpenFileDialog, LoadFile, CloseFile } from '../wailsjs/go/main/App'
import { useEntryStream, type Entry } from './hooks/useEntryStream'
import { useFilter, type FilterQuery, type PropFilter } from './hooks/useFilter'
import { useFileWatch } from './hooks/useFileWatch'
import VirtualList from './components/VirtualList'
import Sidebar from './components/Sidebar'
import FilterBar from './components/FilterBar'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [liveTail, setLiveTail] = useState<Entry[]>([])

  const entriesRef = useRef<Entry[]>([])
  const activeFile = files.find(f => f.fileId === activeFileId)

  // Build filter query
  const filterQuery: FilterQuery | null = activeFileId ? {
    fileId: activeFileId,
    levels: activeLevels.size > 0 ? Array.from(activeLevels) : undefined,
    timeFrom,
    timeTo,
    propFilters: propFilters.length > 0 ? propFilters : undefined,
    query: searchQuery || undefined,
  } : null

  const hasFilters = activeLevels.size > 0 || timeFrom || timeTo || propFilters.length > 0 || searchQuery

  // Stream entries on file change
  useEntryStream(activeFileId, entriesRef, (_count) => {
    setStreamCount(c => c + 1)
    setLiveTail([])
  })

  // Filter entries
  const filtered = useFilter(hasFilters ? filterQuery : null, streamCount)

  // SSE live watch
  useFileWatch(activeFileId, entriesRef, hasFilters ? filterQuery : null, (e) => {
    setLiveTail(prev => [...prev, e])
  })

  // Displayed entries: filtered (if active) or all + live
  const displayedEntries: Entry[] = (() => {
    if (hasFilters && filtered !== null) return filtered
    return [...entriesRef.current, ...liveTail]
  })()

  // Level counts
  const levelCounts = LEVELS.map((_, idx) =>
    entriesRef.current.filter(e => e.lvl === idx).length
  )

  const openFiles = async () => {
    const paths = await OpenFileDialog()
    if (!paths || paths.length === 0) return
    for (const path of paths) {
      const meta = await LoadFile(path)
      setFiles(prev => {
        if (prev.some(f => f.fileId === meta.fileId)) return prev
        return [...prev, {
          fileId: meta.fileId,
          name: meta.name,
          total: meta.totalEntries,
          propKeys: meta.propKeys ?? [],
          visible: true,
        }]
      })
      setActiveFileId(meta.fileId)
    }
  }

  const handleCloseFile = (fileId: string) => {
    CloseFile(fileId)
    setFiles(prev => prev.filter(f => f.fileId !== fileId))
    if (activeFileId === fileId) {
      setActiveFileId(null)
      entriesRef.current = []
    }
  }

  const handleToggleLevel = (lvl: number) => {
    setActiveLevels(prev => {
      const next = new Set(prev)
      if (next.has(lvl)) next.delete(lvl)
      else next.add(lvl)
      return next
    })
  }

  const handlePropFilter = useCallback((key: string, value: string) => {
    setPropFilters(prev => {
      if (prev.some(p => p.key === key && p.op === '=' && p.value === value)) return prev
      return [...prev, { key, op: '=', value }]
    })
  }, [])

  const propValueSuggestions = useCallback((key: string) => {
    if (!activeFileId || !key) return []
    return activeFile?.propKeys.includes(key)
      ? entriesRef.current
          .map(e => e.props?.[key])
          .filter((v): v is unknown => v !== undefined)
          .map(String)
          .filter((v, i, a) => a.indexOf(v) === i)
          .slice(0, 20)
      : []
  }, [activeFileId, activeFile])

  // Drag-and-drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files).map(f => (f as any).path as string).filter(Boolean)
    for (const path of droppedFiles) {
      if (!path) continue
      const meta = await LoadFile(path)
      setFiles(prev => {
        if (prev.some(f => f.fileId === meta.fileId)) return prev
        return [...prev, {
          fileId: meta.fileId,
          name: meta.name,
          total: meta.totalEntries,
          propKeys: meta.propKeys ?? [],
          visible: true,
        }]
      })
      setActiveFileId(meta.fileId)
    }
  }

  const totalCount = entriesRef.current.length + liveTail.length
  const filteredCount = displayedEntries.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#080808', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{
        height: '48px',
        background: '#050505',
        borderBottom: '1px solid #111',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '0 16px',
        flexShrink: 0,
      }}>
        <span style={{ fontWeight: 700, fontSize: '14px', color: '#e5e7eb', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
          Event Horizon
        </span>

        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search messages…"
          style={{
            flex: 1,
            maxWidth: '480px',
            background: '#0d0d0d',
            border: '1px solid #1f1f1f',
            borderRadius: '6px',
            color: '#d1d5db',
            fontSize: '13px',
            padding: '5px 12px',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />

        <div style={{ flex: 1 }} />

        {/* File tabs */}
        {files.map(fi => (
          <button
            key={fi.fileId}
            onClick={() => setActiveFileId(fi.fileId)}
            style={{
              background: activeFileId === fi.fileId ? '#1a1a1a' : 'transparent',
              border: activeFileId === fi.fileId ? '1px solid #2a2a2a' : '1px solid transparent',
              borderRadius: '4px',
              color: activeFileId === fi.fileId ? '#e5e7eb' : '#6b7280',
              fontSize: '12px',
              padding: '3px 10px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              maxWidth: '160px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={fi.name}
          >
            {fi.name}
          </button>
        ))}

        <button
          onClick={openFiles}
          style={{
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: '6px',
            color: '#9ca3af',
            fontSize: '12px',
            padding: '5px 12px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Open files
        </button>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {files.length > 0 && (
          <Sidebar
            files={files}
            levelCounts={levelCounts}
            activeLevels={activeLevels}
            onToggleLevel={handleToggleLevel}
            timeFrom={timeFrom}
            timeTo={timeTo}
            onTimeChange={(f, t) => { setTimeFrom(f); setTimeTo(t) }}
            propFilters={propFilters}
            onAddPropFilter={pf => setPropFilters(prev => [...prev, pf])}
            onRemovePropFilter={idx => setPropFilters(prev => prev.filter((_, i) => i !== idx))}
            propKeysSuggestions={activeFile?.propKeys ?? []}
            propValueSuggestions={propValueSuggestions}
            filteredCount={filteredCount}
            totalCount={totalCount}
            onToggleFile={fileId => setFiles(prev => prev.map(f => f.fileId === fileId ? { ...f, visible: !f.visible } : f))}
            onCloseFile={handleCloseFile}
          />
        )}

        {/* Main pane */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            outline: isDragging ? '2px solid #22c55e' : 'none',
            outlineOffset: '-2px',
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {files.length === 0 ? (
            /* Empty state */
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              color: '#374151',
              userSelect: 'none',
            }}>
              <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              <div style={{ fontSize: '14px' }}>Drop log files here or click Open files</div>
              <button
                onClick={openFiles}
                style={{
                  background: '#111',
                  border: '1px solid #2a2a2a',
                  borderRadius: '6px',
                  color: '#9ca3af',
                  fontSize: '13px',
                  padding: '8px 20px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Open files
              </button>
            </div>
          ) : activeFileId && displayedEntries.length === 0 ? (
            /* Zero results */
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: '#374151',
              userSelect: 'none',
            }}>
              ∅
            </div>
          ) : activeFileId ? (
            <>
              <FilterBar
                timeFrom={timeFrom}
                timeTo={timeTo}
                propFilters={propFilters}
                onRemoveTime={() => { setTimeFrom(undefined); setTimeTo(undefined) }}
                onRemoveProp={idx => setPropFilters(prev => prev.filter((_, i) => i !== idx))}
              />
              <VirtualList
                entries={displayedEntries}
                fileName={activeFile?.name ?? ''}
                query={searchQuery}
                onPropFilter={handlePropFilter}
              />
            </>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#374151',
              fontSize: '13px',
            }}>
              Select a file tab above
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
