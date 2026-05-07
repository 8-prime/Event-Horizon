interface Props {
  label: string
  onRemove: () => void
}

export default function Chip({ label, onRemove }: Props) {
  return (
    <span className="inline-flex items-center gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-gray-300 text-xs px-2 py-0.5 shrink-0 max-w-[220px]" title={label}>
      <span className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0">{label}</span>
      <button
        onClick={onRemove}
        className="bg-transparent border-none text-gray-500 cursor-pointer pl-0.5 text-[13px] leading-none flex items-center"
        aria-label="Remove filter"
      >
        ×
      </button>
    </span>
  )
}
