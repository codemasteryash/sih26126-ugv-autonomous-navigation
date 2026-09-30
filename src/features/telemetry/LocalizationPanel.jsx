import { memo } from 'react'
import useTelemetryStore from '../../stores/useTelemetryStore.js'
import { confidenceLabel } from '../../lib/units.js'
import { featureTracks } from '../../domain/models.js'

function LocalizationPanel() {
  const pose = useTelemetryStore((s) => s.pose)
  const headingDeg = useTelemetryStore((s) => s.headingDeg)
  const locConfidence = useTelemetryStore((s) => s.locConfidence)
  const pct = Math.round(locConfidence * 100)
  return (
    <section aria-label="Visual localization" className="hud-panel p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="hud-label">VISUAL LOCALIZATION · FIX: VISUAL (NO GPS)</span>
        <span className="font-mono-hud text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/40 text-emerald-300">VO/SLAM</span>
      </div>
      <div className="grid grid-cols-3 gap-2 font-mono-hud text-center">
        <div className="rounded border border-edge py-1"><div className="hud-label">X m</div><div className="text-sm text-slate-100">{pose.x.toFixed(1)}</div></div>
        <div className="rounded border border-edge py-1"><div className="hud-label">Y m</div><div className="text-sm text-slate-100">{pose.y.toFixed(1)}</div></div>
        <div className="rounded border border-edge py-1"><div className="hud-label">HDG</div><div className="text-sm text-cyan-200">{String(Math.round(headingDeg)).padStart(3, '0')}°</div></div>
      </div>
      <div className="mt-2">
        <div className="flex justify-between hud-label"><span>VISUAL CONFIDENCE · {confidenceLabel(locConfidence)}</span><span className="hud-value text-emerald-300">{pct}%</span></div>
        <div className="h-1.5 rounded bg-slate-800 mt-1 overflow-hidden"><div className="h-full bg-emerald-400" style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="mt-1 font-mono-hud text-[10px] text-slate-500">FEATURE TRACKS ~{featureTracks(locConfidence)} · ODOM FRAME</div>
    </section>
  )
}

export default memo(LocalizationPanel)
