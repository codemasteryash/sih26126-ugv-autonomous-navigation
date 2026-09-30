import { useState } from 'react'
import useMissionStore from '../stores/useMissionStore.js'
import { sendCommand } from '../hooks/useRobotStream.js'
import { cn } from '../lib/cn.js'

export default function EStopBar() {
  const state = useMissionStore((s) => s.state)
  const [arm, setArm] = useState(false)
  const latched = state === 'EMERGENCY_STOP'

  const press = () => {
    if (latched) return
    if (!arm) { setArm(true); setTimeout(() => setArm(false), 3000); return }
    setArm(false)
    sendCommand('eStop')
  }

  return (
    <div className="hud-panel px-3 py-2 flex items-center gap-3">
      <button
        aria-label="Emergency stop"
        onClick={press}
        className={cn(
          'font-mono-hud font-bold tracking-widest text-sm px-6 py-2.5 rounded border-2 transition-colors',
          latched
            ? 'bg-red-600 border-red-300 text-white anim-pulse-dot'
            : arm
              ? 'bg-red-500/30 border-red-400 text-red-100'
              : 'bg-red-950/60 border-red-600/70 text-red-300 hover:bg-red-900/70',
        )}
      >
        {latched ? '■ E-STOP LATCHED' : arm ? 'PRESS AGAIN TO CONFIRM E-STOP' : '◉ E-STOP'}
      </button>
      <div className="font-mono-hud text-[11px] text-slate-400">
        {latched ? (
          <span className="text-red-300">NO AUTO-RESUME · <button className="underline text-cyan-300" onClick={() => sendCommand('clearEStop')}>CLEAR E-STOP → IDLE</button></span>
        ) : (
          <span>LATCHING · LOGGED · OVERRIDES ALL STATES · {arm ? 'ARMED — CONFIRM' : 'PRESS TWICE TO ENGAGE'}</span>
        )}
      </div>
      <div className="ml-auto font-mono-hud text-[10px] text-slate-500 tracking-widest hidden md:block">SAFETY INTERLOCK ACTIVE · SIMULATION</div>
    </div>
  )
}
