import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import useMissionStore from '../stores/useMissionStore.js'
import useConnectionStore from '../stores/useConnectionStore.js'
import useHealthStore from '../stores/useHealthStore.js'
import { STATE_META } from '../domain/autonomyStates.js'
import { formatMMSS, formatClock } from '../lib/time.js'
import { cn } from '../lib/cn.js'

function Dot({ color, pulse }) {
  return <span className={cn('inline-block w-2 h-2 rounded-full', pulse && 'anim-pulse-dot')} style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
}

export default function TopStatusRail() {
  const state = useMissionStore((s) => s.state)
  const elapsedMs = useMissionStore((s) => s.elapsedMs)
  const connected = useConnectionStore((s) => s.connected)
  const slam = useHealthStore((s) => s.systems.slam)
  const perception = useHealthStore((s) => s.systems.perception)
  const planner = useHealthStore((s) => s.systems.planner)
  const camera = useHealthStore((s) => s.systems.camera)
  const [clock, setClock] = useState(formatClock())
  const loc = useLocation()

  useEffect(() => {
    const t = setInterval(() => setClock(formatClock()), 1000)
    return () => clearInterval(t)
  }, [])

  const meta = STATE_META[state] || STATE_META.IDLE
  const healthColor = (h) => (h.status === 'ok' ? '#34d399' : h.status === 'degraded' ? '#fbbf24' : h.status === 'lost' ? '#f87171' : '#7d8ea6');

  return (
    <header className="hud-panel px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded border border-cyan-500/40 bg-cyan-500/10 flex items-center justify-center font-mono-hud text-cyan-300 text-xs font-bold">UGV</div>
        <div>
          <div className="font-mono-hud text-sm font-bold tracking-wider text-slate-100">UGV-01</div>
          <div className="hud-label">OUTDOOR NAV PLATFORM</div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 font-mono-hud text-[11px]">
        <Dot color={connected ? '#34d399' : '#f87171'} pulse={!connected} />
        <span className={connected ? 'text-emerald-300' : 'text-red-300'}>{connected ? 'CONNECTED' : 'LINK LOST'}</span>
      </div>

      <div className="flex items-center gap-1.5 font-mono-hud text-[11px] px-2 py-1 rounded border" style={{ borderColor: `${meta.color}55`, background: `${meta.color}14` }}>
        <Dot color={meta.color} pulse={['NAVIGATING', 'REPLANNING', 'OBSTACLE_DETECTED'].includes(state)} />
        <span style={{ color: meta.color }} className="font-bold tracking-wider">{meta.label}</span>
      </div>

      <div className="hidden lg:flex items-center gap-3 font-mono-hud text-[11px] text-slate-300">
        <span className="flex items-center gap-1"><Dot color={healthColor(slam)} /> VISUAL FIX</span>
        <span className="flex items-center gap-1"><Dot color={healthColor(perception)} /> PERCEPTION {perception.status.toUpperCase()}</span>
        <span className="flex items-center gap-1"><Dot color={healthColor(planner)} /> PLANNER</span>
        <span className="flex items-center gap-1"><Dot color={healthColor(camera)} /> CAM</span>
      </div>

      <div className="ml-auto flex items-center gap-3 font-mono-hud text-[11px]">
        <span className="px-1.5 py-0.5 rounded border border-amber-400/50 text-amber-300 tracking-widest text-[10px]">● SIMULATION MODE</span>
        <span className="text-slate-300">T+{formatMMSS(elapsedMs)}</span>
        <span className="text-slate-500">{clock}</span>
        <nav className="flex gap-1 ml-1" aria-label="Primary">
          {[
            { to: '/', label: 'OPS' },
            { to: '/replay', label: 'REPLAY' },
            { to: '/systems', label: 'SYSTEMS' },
          ].map((l) => (
            <Link key={l.to} to={l.to} className={cn('px-2 py-1 rounded border text-[10px] tracking-widest', (loc.pathname === l.to) ? 'border-cyan-400/60 text-cyan-200 bg-cyan-400/10' : 'border-edge text-slate-400 hover:text-slate-200')}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
