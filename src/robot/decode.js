// Provider boundary validation. Uses zod if available, else light clamps.
import { z } from 'zod'

export const PoseSchema = z.object({
  x: z.number().finite(), y: z.number().finite(), yaw: z.number().finite(),
  v: z.number().finite(), w: z.number().finite(), confidence: z.number().min(0).max(1),
})

export function safePose(p, fallback) {
  const r = PoseSchema.safeParse(p)
  return r.success ? r.data : fallback
}

export function clampDetections(list) {
  return (Array.isArray(list) ? list : []).slice(0, 50).map((d) => ({
    id: String(d.id),
    label: String(d.label).toUpperCase(),
    confidence: Math.min(0.99, Math.max(0.3, Number(d.confidence) || 0.8)),
    distM: Math.max(1, Number(d.distM) || 8),
    angle: Number(d.angle) || 0,
  }))
}
