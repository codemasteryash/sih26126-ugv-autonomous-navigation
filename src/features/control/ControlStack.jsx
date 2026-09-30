import { memo, useState } from 'react'
import useMissionStore from '../../stores/useMissionStore.js'
import useConnectionStore from '../../stores/useConnectionStore.js'
import { sendCommand } from '../../hooks/useRobotStream.js'
import { simCommands } from '../../sim/simEngine.js'
import { cn } from '../../lib/cn.js'

function Btn({ children, onClick, disabled, tone, label }) {
  return (
    <button aria-label={label || (typeof children === 'string' ? children : undefined)} disabled={disabled} onClick={onClick}
      className={cn('font-mono-hud text-[11px] font-bold tracking-widest px-2.5 py-2 rounded border transition-colors disabled:opacity-35 disabled:cursor-not-allowed', tone)}>
      {children}
    </button>
  )
}

function ControlStack({ bare = false }) {
  const state = useMissionStore((s) => s.state)
  const connected = useConnectionStore((s) => s.connected)
  const [mode, setMode] = useState('auto')

  const canStart = connected && ['IDLE', 'GOAL_REACHED', 'ERROR'].includes(state)
  const canPause = ['NAVIGATING', 'REPLANNING', 'OBSTACLE_DETECTED'].includes(state)
  const paused = state === 'PAUSED'

  return (
    <section aria-label="Mission controls" className={bare ? '' : 'hud-panel p-3'}>
      {!bare && <div className="hud-label mb-2">OPERATOR CONTROL</div>}
      {bare && <div className="hud-label mb-1.5">OPERATOR CONTROL</div>}
      <div className="flex gap-1 mb-2" role="group" aria-label="Autonomy mode">
        {['auto', 'manual'].map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={cn('flex-1 font-mono-hud text-[11px] tracking-widest py-1.5 rounded border', mode === m ? 'border-cyan-400/60 text-cyan-200 bg-cyan-400/10' : 'border-edge text-slate-500')}>
            {m.toUpperCase()}
          </button>
        ))}
      </div>
      {mode === 'manual' && <div className="font-mono-hud text-[10px] text-amber-300 border border-amber-500/40 rounded px-2 py-1 mb-2">TELEOP PLACEHOLDER — NO LIVE COMMAND TRANSPORT IN MOCK</div>}
      <div className="grid grid-cols-3 gap-1.5">
        <Btn label="Start mission" disabled={!canStart} tone="border-emerald-500/60 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20" onClick={() => sendCommand('startMission')}>▶ START</Btn>
        <Btn label="Pause mission" disabled={!canPause} tone="border-amber-500/60 text-amber-200 bg-amber-500/10 hover:bg-amber-500/20" onClick={() => sendCommand('pause')}>❚❚ PAUSE</Btn>
        <Btn label="Resume mission" disabled={!paused} tone="border-cyan-500/60 text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20" onClick={() => sendCommand('resume')}>↻ RESUME</Btn>
        <Btn label="Abort mission" disabled={['IDLE', 'GOAL_REACHED', 'EMERGENCY_STOP'].includes(state)} tone="border-orange-500/60 text-orange-200 bg-orange-500/10 hover:bg-orange-500/20" onClick={() => sendCommand('abort')}>✕ ABORT</Btn>
        <Btn label="Reset mission" tone="border-edge text-slate-300 hover:text-white" onClick={() => sendCommand('reset')}>⟲ RESET</Btn>
        <Btn label="Trigger obstacle" disabled={state !== 'NAVIGATING'} tone="border-violet-500/60 text-violet-200 bg-violet-500/10 hover:bg-violet-500/20" onClick={() => simCommands.triggerObstacle()}>▲ OBSTACLE</Btn>
      </div>
      {!connected && <div className="mt-2 font-mono-hud text-[10px] text-red-300">START DISABLED — LINK LOST</div>}
    </section>
  )
}

export default memo(ControlStack)
