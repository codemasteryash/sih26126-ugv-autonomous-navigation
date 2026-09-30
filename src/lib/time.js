// Pure helpers: time formatting for HUD + event log.

export function formatMMSS(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

export function formatClock(date = new Date()) {
  return date.toLocaleTimeString('en-GB', { hour12: false })
}

export function nowMs() {
  return Date.now()
}
