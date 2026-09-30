// Minimal perf probe: FPS meter driven outside React.
export function createFpsMeter(cb, windowMs = 1000) {
  let frames = 0
  let start = performance.now()
  return {
    tick() {
      frames++
      const t = performance.now()
      if (t - start >= windowMs) {
        cb(Math.round((frames * 1000) / (t - start)))
        frames = 0
        start = t
      }
    },
  }
}
