// Deterministic scripted scenario: waypoints + 3 scripted obstacles.
export const MAP_BOUNDS = { minX: -10, maxX: 80, minY: -20, maxY: 30 }

export function buildBasePath(goal) {
  const pts = []
  const N = 60
  for (let i = 0; i <= N; i++) {
    const t = i / N
    pts.push({ x: t * goal.x, y: Math.sin(t * Math.PI * 1.1) * 6 + t * goal.y * 0.15 })
  }
  return pts
}

export const SCENARIO_OBSTACLES = [
  { id: 'obs-rock', kind: 'rock', label: 'ROCK', atProgress: 0.30, r: 2.2, lateral: 5.5 },
  { id: 'obs-ditch', kind: 'ditch', label: 'DITCH', atProgress: 0.55, r: 2.6, lateral: -6.0 },
  { id: 'obs-tree', kind: 'person', label: 'PERSON', atProgress: 0.75, r: 2.0, lateral: 5.0 },
]

export function obstaclePoseOnPath(path, atProgress, lateral) {
  const idx = Math.floor(path.length * atProgress)
  const p = path[idx] || { x: 0, y: 0 }
  return { x: p.x + 1.5, y: p.y + lateral * 0.35 }
}
