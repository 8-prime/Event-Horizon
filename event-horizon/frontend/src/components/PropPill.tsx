interface Props {
  propKey: string
  value: string
  onFilter?: (key: string, value: string) => void
}

export default function PropPill({ propKey, value, onFilter }: Props) {
  const handleClick = () => onFilter?.(propKey, value)
  return (
    <span
      onClick={handleClick}
      title={`${propKey}=${value}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '3px',
        overflow: 'hidden',
        fontSize: '11px',
        cursor: onFilter ? 'pointer' : 'default',
        flexShrink: 0,
        maxWidth: '220px',
      }}
    >
      <span style={{
        background: '#1a1a1a',
        color: '#9ca3af',
        padding: '1px 5px',
        borderTopLeftRadius: '3px',
        borderBottomLeftRadius: '3px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '80px',
      }}>
        {propKey}
      </span>
      <span style={{
        background: '#141414',
        color: '#d1d5db',
        padding: '1px 5px',
        borderTopRightRadius: '3px',
        borderBottomRightRadius: '3px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '140px',
      }}>
        {value}
      </span>
    </span>
  )
}
