import { memo } from 'react'
import useMissionStore from '../../stores/useMissionStore.js'
import { AUTONOMY_STATES, STATE_META } from '../../domain/autonomyStates.js'
import { cn } from '../../lib/cn.js'

function AutonomyStateCard() {
  const state = useMissionStore((s) => s.state)
  return (
    <section aria-label="Autonomy state" className="hud-panel p-3">
      <div className="hud-label mb-2">AUTONOMY PIPELINE</div>
      <div className="flex flex-wrap gap-1">
        {AUTONOMY_STATES.map((st) => {
          const active = st === state
          const c = STATE_META[st].color
          return (
            <span key={st} title={st}
              className={cn('font-mono-hud text-[9px] tracking-wider px-1.5 py-0.5 rounded border', active && (st === 'REPLANNING' || st === 'OBSTACLE_DETECTED' ? 'anim-replan' : st === 'NAVIGATING' ? 'anim-pulse-dot' : ''))}
              style={active ? { borderColor: c, color: c, background: `${c}1a`, boxShadow: `0 0 8px ${c}55` } : { borderColor: '#1b2637', color: '#5b6b82' }}>
              {st === 'OBSTACLE_DETECTED' ? 'OBSTACLE' : st === 'EMERGENCY_STOP' ? 'E-STOP' : st === 'GOAL_REACHED' ? 'GOAL' : st}
            </span>
          )
        })}
      </div>
      <div className="mt-2 font-mono-hud text-[10px] text-slate-500">VISION → PERCEPTION → LOCALIZATION → PLANNING → COMMAND</div>
    </section>
  )
}

export default memo(AutonomyStateCard)
