import { levelConfig } from '../lib/clef'

interface Props {
  level: number
}

export default function LevelBadge({ level }: Props) {
  const cfg = levelConfig(level)
  return (
    <span
      className="inline-block font-[inherit] text-[11px] font-semibold tracking-[0.05em] rounded-[3px] px-[5px] py-px shrink-0 select-none"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  )
}
