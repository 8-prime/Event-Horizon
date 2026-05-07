export const SYSTEM_KEYS = new Set(['@t', '@l', '@m', '@mt', '@x', '@i', '@r', '@tr', '@sp'])

export type LevelName = 'trace' | 'debug' | 'information' | 'warning' | 'error' | 'fatal'

export interface LevelConfig {
  label: string // 3-letter display
  color: string // foreground
  bg: string // badge background
  border: string // badge border
  num: number // numeric level
}

export const LEVEL_CONFIG: Record<LevelName, LevelConfig> = {
  trace: {
    label: 'TRC',
    color: '#a78bfa',
    bg: 'rgba(139,92,246,0.1)',
    border: 'rgba(139,92,246,0.4)',
    num: 0,
  },
  debug: {
    label: 'DBG',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.1)',
    border: 'rgba(52,211,153,0.4)',
    num: 1,
  },
  information: {
    label: 'INF',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.1)',
    border: 'rgba(96,165,250,0.4)',
    num: 2,
  },
  warning: {
    label: 'WRN',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.1)',
    border: 'rgba(251,191,36,0.4)',
    num: 3,
  },
  error: {
    label: 'ERR',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.1)',
    border: 'rgba(248,113,113,0.4)',
    num: 4,
  },
  fatal: {
    label: 'FTL',
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.1)',
    border: 'rgba(244,63,94,0.4)',
    num: 5,
  },
}

export const LEVELS: LevelName[] = ['trace', 'debug', 'information', 'warning', 'error', 'fatal']

export const LEVEL_ALIASES: Record<string, LevelName> = {
  verbose: 'trace',
  trace: 'trace',
  debug: 'debug',
  info: 'information',
  information: 'information',
  warn: 'warning',
  warning: 'warning',
  error: 'error',
  fatal: 'fatal',
  critical: 'fatal',
}

export function levelNumToName(n: number): LevelName {
  return LEVELS[Math.min(Math.max(n, 0), 5)] as LevelName
}

export function levelConfig(n: number): LevelConfig {
  return LEVEL_CONFIG[levelNumToName(n)]
}

export function normalizeLevel(s: string): LevelName {
  return LEVEL_ALIASES[s.toLowerCase()] ?? 'information'
}

/** Format unix nanoseconds to "YYYY-MM-DD HH:mm:ss.mmm" */
export function formatTs(ns: number): string {
  const ms = ns / 1_000_000
  const d = new Date(ms)
  const pad = (n: number, len = 2) => String(n).padStart(len, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
  )
}
