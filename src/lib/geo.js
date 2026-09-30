// Pure 2D geometry helpers. Map frame: x east (m), y north (m). Yaw rad, 0 = +x.

export function wrapAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}

export function yawDeg(yaw) {
  const d = ((yaw * 180) / Math.PI) % 360
  return (d + 360) % 360
}

export function dist2D(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function polylineLength(pts) {
  let L = 0
  for (let i = 1; i < pts.length; i++) L += dist2D(pts[i - 1], pts[i])
  return L
}

// residual distance from nearest index on path
export function residualDistance(path, nearestIdx) {
  if (!path.length) return 0
  let L = 0
  for (let i = nearestIdx + 1; i < path.length; i++) L += dist2D(path[i - 1], path[i])
  return L
}

export function nearestIndex(path, p) {
  let best = 0
  let bd = Infinity
  for (let i = 0; i < path.length; i++) {
    const d = dist2D(path[i], p)
    if (d < bd) { bd = d; best = i }
  }
  return best
}

export function clampToBounds(p, bounds) {
  return (
    p.x >= bounds.minX && p.x <= bounds.maxX &&
    p.y >= bounds.minY && p.y <= bounds.maxY
  )
}
