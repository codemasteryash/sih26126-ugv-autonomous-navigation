import { memo } from 'react'
import useMissionStore from '../../stores/useMissionStore.js'
import { formatMMSS } from '../../lib/time.js'
import { fmt } from '../../lib/units.js'

function MissionCard() {
  const missionId = useMissionStore((s) => s.missionId)
  const goalLabel = useMissionStore((s) => s.goalLabel)
  const progress = useMissionStore((s) => s.progress)
  const remainingM = useMissionStore((s) => s.remainingM)
  const travelledM = useMissionStore((s) => s.travelledM)
  const elapsedMs = useMissionStore((s) => s.elapsedMs)
  const state = useMissionStore((s) => s.state)
  const replanCount = useMissionStore((s) => s.replanCount)

  return (
    <section aria-label="Mission" className="hud-panel p-3">
      <div className="hud-label mb-1">MISSION · {missionId}</div>
      <div className="flex items-center gap-2 text-sm">
        <span className="px-1.5 py-0.5 rounded bg-cyan-400/10 border border-cyan-500/30 font-mono-hud text-cyan-200 text-xs">A · START</span>
        <span className="text-slate-500">→</span>
        <span className="px-1.5 py-0.5 rounded bg-emerald-400/10 border border-emerald-500/30 font-mono-hud text-emerald-200 text-xs">{goalLabel}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div><div className="hud-label">DIST REMAIN</div><div className="hud-value text-lg text-slate-100">{fmt(remainingM, 1)}<span className="text-xs text-slate-500"> m</span></div></div>
        <div><div className="hud-label">ELAPSED</div><div className="hud-value text-lg text-slate-100">{formatMMSS(elapsedMs)}</div></div>
        <div><div className="hud-label">STATE</div><div className="hud-value text-lg text-cyan-300">{state.replace('_', ' ')}</div></div>
      </div>
      <div className="mt-2">
        <div className="flex justify-between hud-label"><span>PROGRESS</span><span className="hud-value text-slate-200">{progress.toFixed(0)}%</span></div>
        <div className="h-2 rounded bg-slate-800/80 overflow-hidden mt-1" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2 font-mono-hud text-[11px] text-slate-400">
        <span>TRAVELLED <b className="text-slate-200">{fmt(travelledM, 1)} m</b></span>
        <span className="text-right">REPLANS <b className="text-violet-300">{replanCount}</b></span>
      </div>
    </section>
  )
}

export default memo(MissionCard)
