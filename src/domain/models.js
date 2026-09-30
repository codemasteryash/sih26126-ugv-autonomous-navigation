// Perception + navigation + localization model helpers (pure).

// perception
export function detectionColor(conf) {
  if (conf >= 0.9) return '#34d399'
  if (conf >= 0.75) return '#fbbf24'
  return '#f87171'
}

export function traversabilityBand(score) {
  if (score >= 0.8) return 'CLEAR'
  if (score >= 0.55) return 'CAUTION'
  return 'BLOCKED'
}

// navigation: offset a path laterally to fake a replanned detour
export function offsetPath(path, lateral, fromT = 0.25, toT = 0.75) {
  return path.map((p, i) => {
    const t = path.length <= 1 ? 0 : i / (path.length - 1)
    if (t < fromT || t > toT) return { ...p }
    const bump = Math.sin(((t - fromT) / (toT - fromT)) * Math.PI)
    return { x: p.x, y: p.y + lateral * bump }
  })
}

// localization: feature-track count from confidence (mock mapping)
export function featureTracks(conf) {
  return Math.round(120 + conf * 380)
}
