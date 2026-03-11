import Chip from './Chip'
import type { PropFilter } from '../hooks/useFilter'

interface Props {
  timeFrom?: number
  timeTo?: number
  propFilters: PropFilter[]
  onRemoveTime: () => void
  onRemoveProp: (idx: number) => void
}

export default function FilterBar({ timeFrom, timeTo, propFilters, onRemoveTime, onRemoveProp }: Props) {
  const hasTime = timeFrom || timeTo
  if (!hasTime && propFilters.length === 0) return null

  const fmtTs = (ns: number) => {
    const d = new Date(ns / 1_000_000)
    return d.toLocaleString()
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderBottom: '1px solid #1a1a1a',
      flexWrap: 'wrap',
      background: '#060606',
      minHeight: '36px',
    }}>
      {hasTime && (
        <Chip
          label={`${timeFrom ? fmtTs(timeFrom) : '–'} → ${timeTo ? fmtTs(timeTo) : '–'}`}
          onRemove={onRemoveTime}
        />
      )}
      {propFilters.map((pf, i) => (
        <Chip
          key={i}
          label={pf.op === 'exists' ? `${pf.key} exists` : `${pf.key} ${pf.op} ${pf.value}`}
          onRemove={() => onRemoveProp(i)}
        />
      ))}
    </div>
  )
}
