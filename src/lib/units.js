export function fmt(v, digits = 2) {
  if (!Number.isFinite(v)) return '--'
  return v.toFixed(digits)
}

export function batteryLevel(pct) {
  if (pct < 20) return 'critical'
  if (pct < 40) return 'warning'
  return 'healthy'
}

export function confidenceLabel(c) {
  if (c >= 0.85) return 'GOOD'
  if (c >= 0.6) return 'FAIR'
  return 'POOR'
}
