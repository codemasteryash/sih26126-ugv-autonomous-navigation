import { memo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useMissionStore from '../stores/useMissionStore.js'
import useAlertStore from '../stores/useAlertStore.js'
import { simCommands } from '../sim/simEngine.js'
import { formatMMSS } from '../lib/time.js'
import { cn } from '../lib/cn.js'

// Replay: deterministic re-run of scripted scenario in read-only mode.
// Implementation: resets sim and auto-starts, locks commands, offers scrub of recorded log.
function ReplayPage() {
  const [playing, setPlaying] = useState(false)
  const [cursor, setCursor] = useState(0)
  const [samples, setSamples] = useState([])
  const events = useAlertStore((s) => s.events)
  const progress = useMissionStore((s) => s.progress)
  const state = useMissionStore((s) => s.state)

  const startReplay = () => {
    simCommands.reset()
    simCommands.startMission()
    setSamples([])
    setPlaying(true)
  }

  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => {
      const log = simCommands.getLog()
      setSamples([...log])
      setCursor(log.length)
      if (useMissionStore.getState().state === 'GOAL_REACHED') setPlaying(false)
    }, 500)
    return () => clearInterval(t)
  }, [playing])

  const log = samples
  const cur = log[Math.min(cursor - 1, log.length - 1)]

  return (
    <main className="grid gap-2 grid-cols-1 xl:grid-cols-[1fr_340px]">
      <section className="hud-panel p-4">
        <div className="hud-label mb-1">MISSION REPLAY · READ-ONLY DEMO BACKUP</div>
        <h1 className="font-mono-hud text-lg text-slate-100">UGV-MISSION-001 — A → SEARCH ZONE B</h1>
        <p className="font-mono-hud text-[11px] text-slate-500 mt-1">SIMULATED REPLAY · COMMANDS LOCKED · SAME SCRIPTED OBSTACLES (ROCK / DITCH / PERSON)</p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          <button onClick={startReplay} className="font-mono-hud text-[11px] font-bold tracking-widest px-3 py-2 rounded border border-emerald-500/60 text-emerald-200 bg-emerald-500/10">▶ PLAY REPLAY</button>
          <button onClick={() => setPlaying(false)} className="font-mono-hud text-[11px] tracking-widest px-3 py-2 rounded border border-edge text-slate-300">❚❚ PAUSE VIEW</button>
          <button onClick={() => { simCommands.reset(); setPlaying(false); setCursor(0); setSamples([]) }} className="font-mono-hud text-[11px] tracking-widest px-3 py-2 rounded border border-edge text-slate-300">⟲ RESTART</button>
          <Link to="/" className="font-mono-hud text-[11px] tracking-widest px-3 py-2 rounded border border-cyan-500/50 text-cyan-200">→ LIVE OPS</Link>
        </div>

        <div className="mt-4">
          <div className="flex justify-between hud-label"><span>TIMELINE SCRUB · {log.length} SAMPLES</span><span className="hud-value text-slate-200">{cur ? `T+${formatMMSS(cur.t)} · ${cur.state}` : '—'}</span></div>
          <input type="range" min={0} max={Math.max(1, log.length)} value={cursor} onChange={(e) => setCursor(Number(e.target.value))}
            className="w-full mt-2" aria-label="Replay timeline scrub" />
          {cur && (
            <div className="grid grid-cols-4 gap-2 mt-2 font-mono-hud text-[11px]">
              <div className="rounded border border-edge p-2">X <b className="text-slate-100">{cur.x.toFixed(1)}</b></div>
              <div className="rounded border border-edge p-2">Y <b className="text-slate-100">{cur.y.toFixed(1)}</b></div>
              <div className="rounded border border-edge p-2">V <b className="text-cyan-200">{cur.v.toFixed(2)}</b></div>
              <div className="rounded border border-edge p-2">BAT <b className="text-emerald-200">{cur.battery.toFixed(0)}%</b></div>
            </div>
          )}
        </div>

        <div className="mt-3 rounded border border-amber-500/40 bg-amber-500/5 px-3 py-2 font-mono-hud text-[11px] text-amber-200">
          READ-ONLY: START / PAUSE / E-STOP DISABLED IN REPLAY · USE <Link to="/" className="underline">LIVE OPS</Link> FOR CONTROL · LIVE STATE: <b className={cn(state === 'NAVIGATING' ? 'text-emerald-300' : 'text-slate-200')}>{state}</b> · {progress.toFixed(0)}%
        </div>
      </section>

      <section className="hud-panel p-3">
        <div className="hud-label mb-2">REPLAY EVENT TRACK · {events.length}</div>
        <div className="space-y-1 max-h-96 overflow-y-auto" role="log">
          {events.map((e) => (
            <div key={e.id} className="font-mono-hud text-[11px] text-slate-300 border-l-2 border-slate-600/40 pl-2">
              <span className="text-slate-500">[{formatMMSS(e.tMs)}]</span> {e.msg}
            </div>
          ))}
          {events.length === 0 && <div className="font-mono-hud text-[11px] text-slate-600">PRESS PLAY REPLAY TO GENERATE DETERMINISTIC EVENT TRACK</div>}
        </div>
      </section>
    </main>
  )
}

export default memo(ReplayPage)
