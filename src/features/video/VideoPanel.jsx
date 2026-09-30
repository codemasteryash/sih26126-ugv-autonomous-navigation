import { memo, useEffect, useRef } from 'react'
import usePerceptionStore from '../../stores/usePerceptionStore.js'
import useUiStore from '../../stores/useUiStore.js'
import useMissionStore from '../../stores/useMissionStore.js'
import { fitCanvas } from '../../lib/canvas.js'
import { traversabilityBand } from '../../domain/models.js'
import { cn } from '../../lib/cn.js'

// Procedural mock outdoor camera: gradient sky/ground + corridor + moving obstacles.
// Detections drawn on overlay canvas from perception store (read via getState in rAF).
function VideoPanel({ fill = false }) {
  const baseRef = useRef(null)
  const overRef = useRef(null)
  const videoMode = useUiStore((s) => s.videoMode)
  const setUi = useUiStore((s) => s.setUi)

  useEffect(() => {
    let raf = 0
    let t = 0
    const draw = () => {
      raf = requestAnimationFrame(draw)
      t += 0.016
      const base = baseRef.current
      const over = overRef.current
      if (!base || !over) return
      const mode = useUiStore.getState().videoMode
      const bctx = base.getContext('2d')
      const octx = over.getContext('2d')
      const dpr = fitCanvas(base)
      fitCanvas(over)
      const w = base.width, h = base.height
      const W = w / dpr, H = h / dpr
      bctx.save(); bctx.scale(dpr, dpr)
      octx.save(); octx.scale(dpr, dpr)
      octx.clearRect(0, 0, W, H)

      if (mode === 'depth') {
        // depth-style: dark gradient + corridor + blobs
        const g = bctx.createLinearGradient(0, 0, 0, H)
        g.addColorStop(0, '#0b0f1a'); g.addColorStop(0.55, '#1a2438'); g.addColorStop(1, '#05070c')
        bctx.fillStyle = g; bctx.fillRect(0, 0, W, H)
        bctx.fillStyle = 'rgba(148,163,184,0.25)'
        bctx.beginPath()
        bctx.moveTo(W * 0.42, H * 0.45); bctx.lineTo(W * 0.58, H * 0.45)
        bctx.lineTo(W * 0.85, H); bctx.lineTo(W * 0.15, H); bctx.closePath(); bctx.fill()
        const dets = usePerceptionStore.getState().detections
        dets.forEach((d, i) => {
          const bx = W * (0.3 + 0.12 * i + Math.sin(t * 0.7 + i) * 0.02)
          bctx.fillStyle = `rgba(226,232,240,${Math.max(0.2, 0.7 - d.distM / 40)})`
          bctx.beginPath(); bctx.ellipse(bx, H * 0.55, 26, 34, 0, 0, Math.PI * 2); bctx.fill()
        })
        bctx.fillStyle = 'rgba(148,163,184,0.7)'
        bctx.font = '10px monospace'
        bctx.fillText('MOCK DEPTH · STEREO DISPARITY (SIMULATED)', 10, 18)
      } else {
        // outdoor scene
        const sky = bctx.createLinearGradient(0, 0, 0, H * 0.5)
        sky.addColorStop(0, '#0a1626'); sky.addColorStop(1, '#274058')
        bctx.fillStyle = sky; bctx.fillRect(0, 0, W, H * 0.5)
        // sun glow
        const sg = bctx.createRadialGradient(W * 0.78, H * 0.16, 2, W * 0.78, H * 0.16, 60)
        sg.addColorStop(0, 'rgba(253,224,71,0.5)'); sg.addColorStop(1, 'transparent')
        bctx.fillStyle = sg; bctx.fillRect(0, 0, W, H * 0.5)
        // ground
        const gr = bctx.createLinearGradient(0, H * 0.5, 0, H)
        gr.addColorStop(0, '#3a3227'); gr.addColorStop(1, '#14100b')
        bctx.fillStyle = '#2c2a20'; bctx.fillRect(0, H * 0.5, W, H * 0.5)
        // corridor (dirt track) with perspective sway
        const sway = Math.sin(t * 0.5) * W * 0.01
        bctx.fillStyle = '#4d4433'
        bctx.beginPath()
        bctx.moveTo(W * 0.44 + sway, H * 0.5); bctx.lineTo(W * 0.56 + sway, H * 0.5)
        bctx.lineTo(W * 0.8, H); bctx.lineTo(W * 0.2, H); bctx.closePath(); bctx.fill()
        bctx.strokeStyle = 'rgba(52,211,153,0.35)'
        bctx.setLineDash([6, 5])
        bctx.beginPath(); bctx.moveTo(W * 0.5 + sway, H * 0.52); bctx.lineTo(W * 0.5, H); bctx.stroke()
        bctx.setLineDash([])
        // side vegetation blobs
        bctx.fillStyle = 'rgba(34,197,94,0.25)'
        for (let i = 0; i < 8; i++) {
          const bx = (i / 8) * W + Math.sin(t + i * 2) * 3
          const by = H * 0.55 + (i % 3) * H * 0.13
          bctx.beginPath(); bctx.ellipse(bx, by, 22 + (i % 3) * 8, 12, 0, 0, Math.PI * 2); bctx.fill()
        }
        // trees silhouettes
        bctx.fillStyle = '#101c12'
        bctx.fillRect(W * 0.06, H * 0.3, 10, H * 0.2)
        bctx.beginPath(); bctx.arc(W * 0.06 + 5, H * 0.28, 26, 0, Math.PI * 2); bctx.fill()
        bctx.fillRect(W * 0.9, H * 0.34, 8, H * 0.16)
        bctx.beginPath(); bctx.arc(W * 0.9 + 4, H * 0.32, 20, 0, Math.PI * 2); bctx.fill()
        // scan line
        const sy = ((t * 60) % (H + 40)) - 20
        bctx.fillStyle = 'rgba(34,211,238,0.08)'
        bctx.fillRect(0, sy, W, 14)
      }

      // perception overlay
      if (mode === 'perception') {
        const dets = usePerceptionStore.getState().detections
        dets.forEach((d, i) => {
          const bw = 90 - Math.min(40, d.distM * 1.5)
          const bh = 70 - Math.min(30, d.distM)
          const bx = W * (0.28 + i * 0.2) + Math.sin(t * 0.8 + i) * 4
          const by = H * 0.42 + (i % 2) * 20
          const col = d.confidence >= 0.9 ? '#34d399' : '#fbbf24'
          octx.strokeStyle = col; octx.lineWidth = 1.5
          octx.shadowColor = col; octx.shadowBlur = 6
          octx.strokeRect(bx, by, bw, bh)
          octx.shadowBlur = 0
          octx.fillStyle = col
          octx.font = '700 10px monospace'
          octx.fillText(`${d.label} ${(d.confidence).toFixed(2)}`, bx, by - 5)
          octx.fillStyle = 'rgba(0,0,0,0.55)'
          const tw = octx.measureText(`${d.distM.toFixed(1)}m`).width
          octx.fillRect(bx, by + bh + 2, tw + 8, 13)
          octx.fillStyle = '#e2e8f0'
          octx.font = '10px monospace'
          octx.fillText(`${d.distM.toFixed(1)}m`, bx + 4, by + bh + 12)
        })
        // traversable poly overlay
        octx.strokeStyle = 'rgba(52,211,153,0.6)'
        octx.setLineDash([5, 4])
        octx.beginPath()
        octx.moveTo(W * 0.44, H * 0.5); octx.lineTo(W * 0.35, H); octx.moveTo(W * 0.56, H * 0.5); octx.lineTo(W * 0.65, H)
        octx.stroke(); octx.setLineDash([])
      }

      // HUD chrome on overlay
      octx.fillStyle = 'rgba(0,0,0,0.5)'
      octx.fillRect(0, 0, W, 20)
      octx.fillStyle = '#f87171'
      octx.beginPath(); octx.arc(10, 10, 4, 0, Math.PI * 2); octx.fill()
      octx.fillStyle = '#e2e8f0'
      octx.font = '10px monospace'
      const st = useMissionStore.getState().state
      octx.fillText(`ZED 2i · MOCK FEED · ${st}`, 20, 14)
      octx.fillStyle = '#7d8ea6'
      octx.fillText(new Date().toLocaleTimeString('en-GB', { hour12: false }), W - 70, 14)

      bctx.restore(); octx.restore()
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const traversability = usePerceptionStore((s) => s.traversability)
  const detections = usePerceptionStore((s) => s.detections)
  const active = usePerceptionStore((s) => s.active)

  return (
    <section aria-label="Live perception" className={fill ? 'flex flex-col min-h-0 h-full' : 'hud-panel p-2 flex flex-col min-h-0'}>
      {!fill && (
      <div className="flex items-center gap-2 px-1 pb-1.5">
        <span className="hud-label">LIVE PERCEPTION · ZED 2i (MOCK)</span>
        <div className="ml-auto flex gap-1" role="group" aria-label="Camera mode">
          {['raw', 'perception', 'depth'].map((m) => (
            <button key={m} onClick={() => setUi({ videoMode: m })}
              className={cn('font-mono-hud text-[10px] tracking-widest px-2 py-1 rounded border', videoMode === m ? 'border-cyan-400/60 text-cyan-200 bg-cyan-400/10' : 'border-edge text-slate-500')}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      )}
      <div className="relative w-full flex-1 min-h-44 rounded overflow-hidden border border-edge" style={fill ? undefined : { aspectRatio: '16/8' }}>
        <canvas ref={baseRef} className="absolute inset-0 w-full h-full" />
        <canvas ref={overRef} className="absolute inset-0 w-full h-full" />
        <div className="absolute bottom-1.5 left-2 flex gap-2 font-mono-hud text-[10px]">
          <span className={cn('px-1.5 py-0.5 rounded border', active ? 'border-emerald-500/50 text-emerald-200 bg-black/60' : 'border-edge text-slate-500 bg-black/60')}>
            {active ? '● PERCEPTION ACTIVE (MOCK)' : '○ PERCEPTION IDLE'}
          </span>
          <span className="px-1.5 py-0.5 rounded border border-edge text-slate-300 bg-black/60">TRAVERSABILITY {(traversability * 100).toFixed(0)}% · {traversabilityBand(traversability)}</span>
          {detections.length > 0 && <span className="px-1.5 py-0.5 rounded border border-amber-500/50 text-amber-200 bg-black/60">{detections.length} TRACK(S)</span>}
        </div>
      </div>
    </section>
  )
}

export default memo(VideoPanel)
