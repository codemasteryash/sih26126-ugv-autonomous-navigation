import { memo } from 'react'
import useHealthStore from '../stores/useHealthStore.js'
import useMissionStore from '../stores/useMissionStore.js'
import useConnectionStore from '../stores/useConnectionStore.js'
import useTelemetryStore from '../stores/useTelemetryStore.js'
import { faults, setFault, clearFaults } from '../sim/faults.js'
import { simCommands } from '../sim/simEngine.js'
import { useState } from 'react'
import { topicFor } from '../robot/topicMap.js'

function Row({ k, v }) {
  return <div className="flex justify-between font-mono-hud text-[11px] py-1 border-b border-edge/60"><span className="text-slate-500">{k}</span><span className="text-slate-200">{v}</span></div>
}

function SystemsPage() {
  const systems = useHealthStore((s) => s.systems)
  const state = useMissionStore((s) => s.state)
  const missionId = useMissionStore((s) => s.missionId)
  const connected = useConnectionStore((s) => s.connected)
  const provider = useConnectionStore((s) => s.provider)
  const battery = useTelemetryStore((s) => s.battery)
  const latencyMs = useTelemetryStore((s) => s.latencyMs)
  const [, force] = useState(0)

  const toggle = (key) => { setFault(key, !faults[key]); force((x) => x + 1) }

  return (
    <main className="grid gap-2 grid-cols-1 xl:grid-cols-2">
      <section className="hud-panel p-4">
        <div className="hud-label mb-2">OPERATOR INFORMATION</div>
        <Row k="ROBOT LINK" v={connected ? 'CONNECTED (MOCK 10 Hz)' : 'LOST — WATCHDOG'} />
        <Row k="PROVIDER" v={`${provider} · SIMULATION MODE`} />
        <Row k="AUTONOMY STATE" v={state} />
        <Row k="ACTIVE MISSION" v={missionId} />
        <Row k="BATTERY" v={`${battery.toFixed(1)}%`} />
        <Row k="LATENCY" v={`${latencyMs} ms`} />
        <Row k="HEARTBEAT AGE" v={connected ? '< 1 s' : 'STALE > 3 s'} />
        <div className="hud-label mt-4 mb-1">SUBSYSTEM DETAIL</div>
        {Object.entries(systems).map(([k, h]) => (
          <Row key={k} k={k.toUpperCase()} v={`${h.status.toUpperCase()} · ${h.latencyMs ? h.latencyMs + 'ms · ' : ''}${h.message}`} />
        ))}
      </section>

      <section className="hud-panel p-4">
        <div className="hud-label mb-1">DEVELOPER DIAGNOSTICS · FAULT INJECTION (MOCK ONLY)</div>
        <p className="font-mono-hud text-[10px] text-slate-500 mb-3">DO NOT EXPOSE ON MAIN OPS SCREEN · FOR JUDGE Q&A + ROBUSTNESS DEMO</p>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            ['connectionLost', 'CONNECTION LOSS'],
            ['slamDegraded', 'SLAM DEGRADATION'],
            ['perceptionLost', 'PERCEPTION LOSS'],
            ['lowBattery', 'LOW BATTERY'],
          ].map(([k, label]) => (
            <button key={k} onClick={() => toggle(k)} aria-pressed={!!faults[k]}
              className={`font-mono-hud text-[11px] tracking-widest px-2 py-2 rounded border ${faults[k] ? 'border-red-500/70 text-red-200 bg-red-500/10' : 'border-edge text-slate-300'}`}>
              {faults[k] ? '■ ' : '○ '}{label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 mt-2">
          <button onClick={() => { clearFaults(); force((x) => x + 1) }} className="flex-1 font-mono-hud text-[11px] px-2 py-2 rounded border border-emerald-500/50 text-emerald-200">CLEAR ALL FAULTS</button>
          <button onClick={() => simCommands.triggerObstacle()} className="flex-1 font-mono-hud text-[11px] px-2 py-2 rounded border border-violet-500/50 text-violet-200">INJECT OBSTACLE</button>
        </div>
        <div className="hud-label mt-4 mb-1">TOPIC MAP (FUTURE ROS — STUB)</div>
        {['pose', 'path', 'costmap', 'detections', 'pointcloud', 'image'].map((k) => (
          <Row key={k} k={k.toUpperCase()} v={topicFor(k)} />
        ))}
        <div className="mt-2 font-mono-hud text-[10px] text-slate-500">VITE_ROBOT_PROVIDER=mock · switch to ros/foxglove post-SIH without UI changes</div>
      </section>
    </main>
  )
}

export default memo(SystemsPage)
