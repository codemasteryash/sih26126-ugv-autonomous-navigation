import { memo } from 'react'
import useHealthStore from '../../stores/useHealthStore.js'
import { cn } from '../../lib/cn.js'

const LABELS = { ros: 'ROS LINK', camera: 'CAMERA', slam: 'VIS SLAM', perception: 'PERCEPTION', planner: 'PLANNER', network: 'NETWORK', power: 'POWER' }

function SystemHealthList({ compact }) {
  const systems = useHealthStore((s) => s.systems)
  const color = (st) => (st === 'ok' ? '#34d399' : st === 'degraded' ? '#fbbf24' : st === 'lost' ? '#f87171' : '#7d8ea6')
  const keys = compact ? ['slam', 'perception', 'planner', 'camera', 'ros'] : Object.keys(systems)
  return (
    <section aria-label="System health" className="hud-panel p-3">
      <div className="hud-label mb-2">SYSTEM HEALTH {compact ? '· COMPACT' : ''}</div>
      <ul className="space-y-1">
        {keys.map((k) => {
          const h = systems[k]
          if (!h) return null
          return (
            <li key={k} className="flex items-center gap-2 font-mono-hud text-[11px]">
              <span className={cn('w-1.5 h-1.5 rounded-full', h.status !== 'ok' && 'anim-pulse-dot')} style={{ background: color(h.status), boxShadow: `0 0 5px ${color(h.status)}` }} />
              <span className="text-slate-400 w-24">{LABELS[k] || k.toUpperCase()}</span>
              <span style={{ color: color(h.status) }} className="font-bold">{h.status.toUpperCase()}</span>
              {!compact && <span className="ml-auto text-slate-500 truncate">{h.latencyMs ? `${h.latencyMs} ms · ` : ''}{h.message}</span>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default memo(SystemHealthList)
