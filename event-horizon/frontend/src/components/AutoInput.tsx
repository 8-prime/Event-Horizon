import { useState, useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  suggestions?: string[]
  placeholder?: string
}

export default function AutoInput({ value, onChange, suggestions = [], placeholder }: Props) {
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(value.toLowerCase()) && s !== value
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
    <div ref={ref} className="relative">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          setFocused(true)
          setOpen(true)
        }}
        placeholder={placeholder}
        className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded text-gray-300 text-xs px-2 py-1 outline-none font-[inherit]"
      />
      {showDropdown && open && (
        <div className="absolute top-full left-0 right-0 bg-[#111] border border-[#2a2a2a] rounded mt-0.5 z-[100] max-h-[160px] overflow-y-auto">
          {filtered.slice(0, 20).map((s) => (
            <div
              key={s}
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(s)
                setOpen(false)
              }}
              title={s}
              className="px-[10px] py-[5px] text-xs text-gray-300 cursor-pointer hover:bg-[#1a1a1a] overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
