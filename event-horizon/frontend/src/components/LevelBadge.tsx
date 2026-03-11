import { levelConfig } from '../lib/clef'

interface Props {
  level: number
}

export default function LevelBadge({ level }: Props) {
  const cfg = levelConfig(level)
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: 'inherit',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.05em',
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: '3px',
      padding: '1px 5px',
      flexShrink: 0,
      userSelect: 'none',
    }}>
      {cfg.label}
    </span>
  )
}
