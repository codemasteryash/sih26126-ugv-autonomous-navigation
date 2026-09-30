import { memo } from 'react'
import useTelemetryStore from '../../stores/useTelemetryStore.js'
import usePerceptionStore from '../../stores/usePerceptionStore.js'
import useNavStore from '../../stores/useNavStore.js'
import useMissionStore from '../../stores/useMissionStore.js'
import useHealthStore from '../../stores/useHealthStore.js'
import useAlertStore from '../../stores/useAlertStore.js'
import useUiStore from '../../stores/useUiStore.js'
import ControlStack from '../control/ControlStack.jsx'
import { formatMMSS } from '../../lib/time.js'
import { fmt, batteryLevel } from '../../lib/units.js'
import { cn } from '../../lib/cn.js'

function Sec({ title, children }) {
  return (
    <section className="border-b border-edge/70 px-2.5 py-2 last:border-0">
      <div className="hud-label mb-1.5">{title}</div>
      {children}
    </section>
  )
}

function Row({ k, v, tone }) {
  return (
    <div className="flex justify-between font-mono-hud text-[11px] py-px">
      <span className="text-slate-500">{k}</span>
      <span className={tone || 'text-slate-200'}>{v}</span>
    </div>
  )
}

// ---- contextual right panels ----

function PerceptionRight() {
  const active = usePerceptionStore((s) => s.active)
  const detections = usePerceptionStore((s) => s.detections)
  const latencyMs = useTelemetryStore((s) => s.latencyMs)
  const videoMode = useUiStore((s) => s.videoMode)
  const setUi = useUiStore((s) => s.setUi)
  return (
    <>
      <Sec title="PERCEPTION STATUS">
        <Row k="STATE" v={active ? '● ACTIVE' : '○ IDLE'} tone={active ? 'text-emerald-300' : 'text-slate-500'} />
        <Row k="MODEL" v="SIMULATED VISION" tone="text-amber-200" />
        <Row k="FPS" v="30 (MOCK)" />
        <Row k="LATENCY" v={`${latencyMs} ms`} />
      </Sec>
      <Sec title={`DETECTION DETAILS · ${detections.length}`}>
        {detections.length === 0 && <div className="font-mono-hud text-[10px] text-slate-600">NO ACTIVE TRACKS</div>}
        {detections.map((d) => (
          <div key={d.id} className="rounded border border-edge bg-panel2/60 px-2 py-1 mb-1">
            <div className="flex justify-between font-mono-hud text-[11px]">
              <span className="font-bold text-slate-100">{d.label}</span>
              <span className="text-amber-200">{(d.confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="font-mono-hud text-[10px] text-slate-500">CONF {(d.confidence * 100).toFixed(1)}% · DIST {d.distM.toFixed(1)} m</div>
          </div>
        ))}
      </Sec>
      <Sec title="PERCEPTION CONTROLS">
        <div className="flex gap-1" role="group" aria-label="Camera mode">
          {['raw', 'perception', 'depth'].map((m) => (
            <button key={m} onClick={() => setUi({ videoMode: m })}
              className={cn('flex-1 font-mono-hud text-[10px] tracking-widest py-1.5 rounded border', videoMode === m ? 'border-cyan-400/60 text-cyan-200 bg-cyan-400/10' : 'border-edge text-slate-500')}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </Sec>
      <Sec title="CAMERA">
        <Row k="SIGNAL" v="● STABLE" tone="text-emerald-300" />
      </Sec>
    </>
  )
}

function NavigationRight() {
  const v = useTelemetryStore((s) => s.v)
  const w = useTelemetryStore((s) => s.w)
  const headingDeg = useTelemetryStore((s) => s.headingDeg)
  const remainingM = useMissionStore((s) => s.remainingM)
  const planner = useHealthStore((s) => s.systems.planner)
  const replanning = useNavStore((s) => s.replanning)
  const replanMsg = useNavStore((s) => s.replanMsg)
  const highlightedId = useNavStore((s) => s.highlightedId)
  const obstacles = useNavStore((s) => s.obstacles)
  const state = useMissionStore((s) => s.state)
  const hl = obstacles.find((o) => o.id === highlightedId)
  const showReplan = replanning || state === 'OBSTACLE_DETECTED'
  return (
    <>
      <Sec title="NAVIGATION TELEMETRY">
        <Row k="SPEED" v={`${fmt(v)} m/s`} tone="text-cyan-200" />
        <Row k="ANGULAR" v={`${fmt(w)} rad/s`} />
        <Row k="HEADING" v={`${String(Math.round(headingDeg)).padStart(3, '0')}°`} tone="text-cyan-200" />
        <Row k="DISTANCE" v={`${fmt(remainingM, 1)} m`} tone="text-slate-100" />
      </Sec>
      <Sec title="PLANNER">
        <Row k="STATUS" v={`● ${planner.status.toUpperCase()}`} tone="text-emerald-300" />
        <Row k="PATH" v={replanning ? 'REPLANNING' : 'ACTIVE'} tone={replanning ? 'text-violet-300' : 'text-cyan-200'} />
      </Sec>
      <Sec title="REPLANNING">
        {!showReplan && <Row k="CURRENT" v="NONE — ON TRACK" tone="text-slate-400" />}
        {showReplan && (
          <div className="rounded border border-amber-500/50 bg-amber-500/5 px-2 py-1.5 font-mono-hud text-[11px]">
            <div className="text-amber-200 font-bold anim-replan">⚠ OBSTACLE DETECTED</div>
            {hl && <div className="text-slate-200 mt-0.5">{hl.label} · ~12 m</div>}
            <div className="text-slate-500">PATH BLOCKED</div>
            <div className="text-violet-300 font-bold">{replanMsg || 'REPLANNING…'}</div>
          </div>
        )}
      </Sec>
    </>
  )
}

const LAYER_LABELS = { ugv: 'UGV', trajectory: 'TRAJECTORY', planned: 'PLANNED PATH', obstacles: 'OBSTACLES', cloud: 'POINT CLOUD', axes: 'AXES', frustum: 'CAM FRUSTUM' }

function EnvironmentRight() {
  const pointDensity = useUiStore((s) => s.pointDensity)
  const layers = useUiStore((s) => s.layers)
  const setUi = useUiStore((s) => s.setUi)
  const toggleLayer = useUiStore((s) => s.toggleLayer)
  const locConfidence = useTelemetryStore((s) => s.locConfidence)
  const points = pointDensity === 'low' ? '4.0K' : pointDensity === 'high' ? '18.0K' : '9.0K'
  const good = locConfidence >= 0.6
  return (
    <>
      <Sec title="POINT CLOUD">
        <Row k="STATUS" v="● ACTIVE (MOCK)" tone="text-emerald-300" />
        <Row k="POINTS" v={points} />
        <div className="flex gap-1 mt-1" role="group" aria-label="Point density">
          {['low', 'medium', 'high'].map((d) => (
            <button key={d} onClick={() => setUi({ pointDensity: d })}
              className={cn('flex-1 font-mono-hud text-[10px] tracking-widest py-1 rounded border', pointDensity === d ? 'border-cyan-400/60 text-cyan-200 bg-cyan-400/10' : 'border-edge text-slate-500')}>
              {d.toUpperCase()}
            </button>
          ))}
        </div>
      </Sec>
      <Sec title="3D LAYERS">
        {Object.entries(LAYER_LABELS).map(([k, label]) => (
          <label key={k} className="flex items-center gap-2 font-mono-hud text-[11px] text-slate-300 py-0.5 cursor-pointer">
            <input type="checkbox" checked={!!layers[k]} onChange={() => toggleLayer(k)} className="accent-cyan-400" />
            {label}
          </label>
        ))}
      </Sec>
      <Sec title="TRACKING">
        <Row k="SLAM" v={good ? '● GOOD' : '● DEGRADED'} tone={good ? 'text-emerald-300' : 'text-amber-300'} />
        <Row k="TRACKING" v="ACTIVE" />
      </Sec>
      <Sec title="CAMERA">
        <Row k="FRUSTUM" v={layers.frustum ? 'ON' : 'OFF'} tone="text-slate-200" />
      </Sec>
    </>
  )
}

// ---- always-visible summaries ----

function TelemetrySummary() {
  const v = useTelemetryStore((s) => s.v)
  const headingDeg = useTelemetryStore((s) => s.headingDeg)
  const battery = useTelemetryStore((s) => s.battery)
  const latencyMs = useTelemetryStore((s) => s.latencyMs)
  const progress = useMissionStore((s) => s.progress)
  const bl = batteryLevel(battery)
  return (
    <Sec title="TELEMETRY">
      <div className="grid grid-cols-2 gap-1">
        {[
          ['SPEED', `${fmt(v)} m/s`, 'text-cyan-200'],
          ['HEADING', `${String(Math.round(headingDeg)).padStart(3, '0')}°`, 'text-cyan-200'],
          ['BATTERY', `${battery.toFixed(0)}%`, bl === 'healthy' ? 'text-emerald-300' : bl === 'warning' ? 'text-amber-300' : 'text-red-300'],
          ['LATENCY', `${latencyMs} ms`, 'text-slate-200'],
        ].map(([k, val, tone]) => (
          <div key={k} className="rounded border border-edge bg-panel2/60 px-1.5 py-1">
            <div className="hud-label">{k}</div>
            <div className={cn('hud-value text-sm', tone)}>{val}</div>
          </div>
        ))}
      </div>
      <Row k="PROGRESS" v={`${progress.toFixed(0)}%`} />
    </Sec>
  )
}

function CompactEvents() {
  const events = useAlertStore((s) => s.events)
  const last = events.slice(-6).reverse()
  return (
    <Sec title={`EVENTS · ${events.length}`}>
      {last.length === 0 && <div className="font-mono-hud text-[10px] text-slate-600">NO EVENTS YET</div>}
      {last.map((e) => (
        <div key={e.id} className="font-mono-hud text-[10px] text-slate-400 py-px truncate" title={e.msg}>
          <span className="text-slate-600">{formatMMSS(e.tMs)}</span> {e.msg}
        </div>
      ))}
    </Sec>
  )
}

function RightSidebar() {
  const view = useUiStore((s) => s.view)
  return (
    <aside aria-label="Telemetry and control sidebar" className="hud-panel min-h-0 overflow-y-auto">
      {view === 'perception' && <PerceptionRight />}
      {view === 'navigation' && <NavigationRight />}
      {view === 'environment' && <EnvironmentRight />}
      <TelemetrySummary />
      <div className="px-2.5 py-2 border-b border-edge/70">
        <ControlStack bare />
      </div>
      <CompactEvents />
    </aside>
  )
}

export default memo(RightSidebar)
