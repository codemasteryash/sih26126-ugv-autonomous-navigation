import { memo, useEffect, useRef } from 'react'
import useNavStore from '../../stores/useNavStore.js'
import useTelemetryStore from '../../stores/useTelemetryStore.js'
import useMissionStore from '../../stores/useMissionStore.js'
import { MAP_BOUNDS } from '../../sim/scenario.js'
import { fitCanvas } from '../../lib/canvas.js'
import { sendCommand } from '../../hooks/useRobotStream.js'

const BOUNDS = MAP_BOUNDS
const COLORS = { obstacle: '#f87171', inflated: 'rgba(248,113,113,0.22)', planned: '#34d399', actual: '#22d3ee', ghost: '#64748b', ugv: '#22d3ee', goal: '#34d399' }

function worldToScreen(p, w, h, pad = 24) {
  const sx = (w - pad * 2) / (BOUNDS.maxX - BOUNDS.minX)
  const sy = (h - pad * 2) / (BOUNDS.maxY - BOUNDS.minY)
  const s = Math.min(sx, sy)
  const ox = pad + ((w - pad * 2) - s * (BOUNDS.maxX - BOUNDS.minX)) / 2
  const oy = pad + ((h - pad * 2) - s * (BOUNDS.maxY - BOUNDS.minY)) / 2
  return { x: ox + (p.x - BOUNDS.minX) * s, y: h - (oy + (p.y - BOUNDS.minY) * s), s }
}

function screenToWorld(px, py, w, h, pad = 24) {
  const sx = (w - pad * 2) / (BOUNDS.maxX - BOUNDS.minX)
  const sy = (h - pad * 2) / (BOUNDS.maxY - BOUNDS.minY)
  const s = Math.min(sx, sy)
  const ox = pad + ((w - pad * 2) - s * (BOUNDS.maxX - BOUNDS.minX)) / 2
  const oy = pad + ((h - pad * 2) - s * (BOUNDS.maxY - BOUNDS.minY)) / 2
  return { x: BOUNDS.minX + (px - ox) / s, y: BOUNDS.minY + (h - py - oy) / s }
}

function strokePath(ctx, pts, w, h, color, dash = [], width = 2) {
  if (!pts.length) return
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.setLineDash(dash)
  ctx.shadowColor = color
  ctx.shadowBlur = 6
  ctx.beginPath()
  pts.forEach((p, i) => {
    const s = worldToScreen(p, w, h)
    if (i === 0) ctx.moveTo(s.x, s.y)
    else ctx.lineTo(s.x, s.y)
  })
  ctx.stroke()
  ctx.restore()
}

function CostmapCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    let raf = 0
    const canvas = ref.current
    const ctx = canvas.getContext('2d')

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const dpr = fitCanvas(canvas)
      const w = canvas.width, h = canvas.height
      const nav = useNavStore.getState()
      const tel = useTelemetryStore.getState()
      const mission = useMissionStore.getState()

      // bg: unknown
      ctx.fillStyle = '#070c14'
      ctx.fillRect(0, 0, w, h)

      // subtle grid (world 5m)
      ctx.strokeStyle = 'rgba(34,211,238,0.07)'
      ctx.lineWidth = 1
      for (let gx = BOUNDS.minX; gx <= BOUNDS.maxX; gx += 5) {
        const a = worldToScreen({ x: gx, y: BOUNDS.minY }, w / dpr, h / dpr)
        const b = worldToScreen({ x: gx, y: BOUNDS.maxY }, w / dpr, h / dpr)
        ctx.beginPath(); ctx.moveTo(a.x * dpr, a.y * dpr); ctx.lineTo(b.x * dpr, b.y * dpr); ctx.stroke()
      }

      ctx.save()
      ctx.scale(dpr, dpr)
      const W = w / dpr, H = h / dpr

      // traversable corridor around planned path
      if (nav.plannedPath.length) {
        ctx.save()
        ctx.strokeStyle = 'rgba(52,211,153,0.13)'
        ctx.lineWidth = 26
        ctx.lineJoin = 'round'
        ctx.beginPath()
        nav.plannedPath.forEach((p, i) => {
          const s = worldToScreen(p, W, H)
          if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y)
        })
        ctx.stroke()
        ctx.restore()
      }

      // obstacles + inflated zones
      for (const o of nav.obstacles) {
        const s = worldToScreen(o, W, H)
        const r = (o.r + 2.5) * s.s
        ctx.fillStyle = COLORS.inflated
        ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = COLORS.obstacle
        ctx.beginPath(); ctx.arc(s.x, s.y, o.r * s.s, 0, Math.PI * 2); ctx.fill()
        const hl = nav.highlightedId === o.id
        ctx.strokeStyle = hl ? '#fbbf24' : '#7f1d1d'
        ctx.lineWidth = hl ? 2.5 : 1.5
        ctx.beginPath(); ctx.arc(s.x, s.y, o.r * s.s, 0, Math.PI * 2); ctx.stroke()
        ctx.fillStyle = hl ? '#fbbf24' : '#fca5a5'
        ctx.font = '700 9px monospace'
        ctx.fillText(o.label, s.x + 8, s.y - 6)
      }

      if (nav.ghostPath) strokePath(ctx, nav.ghostPath, W, H, COLORS.ghost, [5, 4], 2)
      if (nav.plannedPath.length) strokePath(ctx, nav.plannedPath, W, H, COLORS.planned, mission.state === 'REPLANNING' ? [] : [7, 4], 2.5)
      if (nav.actualTraj.length) strokePath(ctx, nav.actualTraj, W, H, COLORS.actual, [], 2)

      // goal flag
      const g = worldToScreen(nav.goal, W, H)
      ctx.fillStyle = COLORS.goal
      ctx.fillRect(g.x - 1.5, g.y - 16, 3, 16)
      ctx.beginPath(); ctx.moveTo(g.x + 1.5, g.y - 16); ctx.lineTo(g.x + 13, g.y - 12); ctx.lineTo(g.x + 1.5, g.y - 8); ctx.fill()
      ctx.fillStyle = '#a7f3d0'
      ctx.font = '700 9px monospace'
      ctx.fillText('GOAL', g.x - 10, g.y + 12)

      // pending goal
      if (nav.pendingGoal) {
        const pg = worldToScreen(nav.pendingGoal, W, H)
        ctx.strokeStyle = '#fbbf24'
        ctx.setLineDash([4, 3])
        ctx.beginPath(); ctx.arc(pg.x, pg.y, 10, 0, Math.PI * 2); ctx.stroke()
        ctx.setLineDash([])
      }

      // UGV triangle + heading wedge
      const u = worldToScreen(tel.pose, W, H)
      const yaw = tel.pose.yaw
      ctx.save()
      ctx.translate(u.x, u.y)
      ctx.fillStyle = 'rgba(34,211,238,0.18)'
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 22, -0.5 - yawScreen(yaw), 0.5 - yawScreen(yaw)); ctx.closePath(); ctx.fill()
      ctx.rotate(-yawScreen(yaw))
      ctx.fillStyle = COLORS.ugv
      ctx.shadowColor = COLORS.ugv; ctx.shadowBlur = 10
      ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-6, -6); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill()
      ctx.restore()

      // safety radius ring
      ctx.strokeStyle = 'rgba(34,211,238,0.25)'
      ctx.setLineDash([3, 4])
      ctx.beginPath(); ctx.arc(u.x, u.y, 3 * u.s, 0, Math.PI * 2); ctx.stroke()
      ctx.setLineDash([])

      ctx.restore()
    }

    const yawScreen = (yaw) => yaw // screen y-flip handled by mapping; keep rotation simple

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const onClick = (e) => {
    const canvas = ref.current
    const rect = canvas.getBoundingClientRect()
    const wp = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height)
    useNavStore.setState({ pendingGoal: { x: Math.round(wp.x * 10) / 10, y: Math.round(wp.y * 10) / 10 } })
  }

  const pendingGoal = useNavStore((s) => s.pendingGoal)

  return (
    <div className="relative w-full h-full">
      <canvas ref={ref} onClick={onClick} className="w-full h-full cursor-crosshair rounded" aria-label="2D navigation costmap. Click to set destination." role="application" />
      {pendingGoal && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 hud-panel px-3 py-2 flex items-center gap-2 font-mono-hud text-[11px]">
          <span className="text-amber-200">SET DESTINATION? ({pendingGoal.x.toFixed(1)}, {pendingGoal.y.toFixed(1)})</span>
          <button className="px-2 py-1 rounded border border-emerald-500/60 text-emerald-200" onClick={() => { sendCommand('setGoal', pendingGoal); useNavStore.setState({ pendingGoal: null }) }}>CONFIRM</button>
          <button className="px-2 py-1 rounded border border-edge text-slate-400" onClick={() => useNavStore.setState({ pendingGoal: null })}>CANCEL</button>
        </div>
      )}
      <div className="absolute bottom-1.5 left-2 flex flex-wrap gap-2 font-mono-hud text-[9px] text-slate-400 bg-black/50 rounded px-1.5 py-1">
        <span><i className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: '#34d39955' }} />TRAVERSABLE</span>
        <span><i className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: '#f87171' }} />OBSTACLE</span>
        <span><i className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: '#f8717155' }} />INFLATED</span>
        <span><i className="inline-block w-3 h-0.5 mr-1 bg-emerald-400" />PLANNED</span>
        <span><i className="inline-block w-3 h-0.5 mr-1 bg-cyan-400" />ACTUAL</span>
        <span className="text-slate-500">CLICK MAP = SET GOAL</span>
      </div>
    </div>
  )
}

export default memo(CostmapCanvas)
