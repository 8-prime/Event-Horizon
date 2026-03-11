interface Props {
  label: string
  onRemove: () => void
}

export default function Chip({ label, onRemove }: Props) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      background: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: '4px',
      padding: '2px 8px',
      fontSize: '12px',
      color: '#d1d5db',
      flexShrink: 0,
    }}>
      {label}
      <button
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          color: '#6b7280',
          cursor: 'pointer',
          padding: '0 0 0 2px',
          fontSize: '13px',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
        }}
        aria-label="Remove filter"
      >
        ×
      </button>
    </span>
  )
}
