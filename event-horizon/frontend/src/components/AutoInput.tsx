import { useState, useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  suggestions?: string[]
  placeholder?: string
  style?: React.CSSProperties
}

export default function AutoInput({ value, onChange, suggestions = [], placeholder, style }: Props) {
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase()) && s !== value
  )
  const showDropdown = focused && filtered.length > 0

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => { setFocused(true); setOpen(true) }}
        placeholder={placeholder}
        style={{
          width: '100%',
          background: '#0d0d0d',
          border: '1px solid #2a2a2a',
          borderRadius: '4px',
          color: '#d1d5db',
          fontSize: '12px',
          padding: '4px 8px',
          outline: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      />
      {showDropdown && open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#111',
          border: '1px solid #2a2a2a',
          borderRadius: '4px',
          marginTop: '2px',
          zIndex: 100,
          maxHeight: '160px',
          overflowY: 'auto',
        }}>
          {filtered.slice(0, 20).map(s => (
            <div
              key={s}
              onMouseDown={e => { e.preventDefault(); onChange(s); setOpen(false) }}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                color: '#d1d5db',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1a1a1a')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
