import { memo } from 'react'
import useMissionStore from '../../stores/useMissionStore.js'
import useTelemetryStore from '../../stores/useTelemetryStore.js'
import usePerceptionStore from '../../stores/usePerceptionStore.js'
import useHealthStore from '../../stores/useHealthStore.js'
import useUiStore from '../../stores/useUiStore.js'
import { STATE_META } from '../../domain/autonomyStates.js'
import { fmt, confidenceLabel } from '../../lib/units.js'
import { featureTracks } from '../../domain/models.js'

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

function HealthMini() {
  const systems = useHealthStore((s) => s.systems)
  const color = (st) => (st === 'ok' ? '#34d399' : st === 'degraded' ? '#fbbf24' : st === 'lost' ? '#f87171' : '#7d8ea6')
  const keys = ['slam', 'perception', 'planner', 'camera', 'network']
  const labels = { slam: 'VIS SLAM', perception: 'PERCEPTION', planner: 'PLANNER', camera: 'CAMERA', network: 'NETWORK' }
  return (
    <ul className="space-y-0.5">
      {keys.map((k) => (
        <li key={k} className="flex items-center gap-1.5 font-mono-hud text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: color(systems[k].status), boxShadow: `0 0 4px ${color(systems[k].status)}` }} />
          <span className="text-slate-500">{labels[k]}</span>
          <span className="ml-auto" style={{ color: color(systems[k].status) }}>{systems[k].status.toUpperCase()}</span>
        </li>
      ))}
    </ul>
  )
}

function MissionSummary() {
  const missionId = useMissionStore((s) => s.missionId)
  const goalLabel = useMissionStore((s) => s.goalLabel)
  const state = useMissionStore((s) => s.state)
  const progress = useMissionStore((s) => s.progress)
  const meta = STATE_META[state] || STATE_META.IDLE
  return (
    <Sec title="MISSION CONTEXT">
      <Row k="ROBOT" v="UGV-01" />
      <Row k="MISSION" v={missionId} />
      <div className="flex justify-between items-center font-mono-hud text-[11px] py-px">
        <span className="text-slate-500">STATE</span>
        <span className="font-bold" style={{ color: meta.color }}>{meta.label}</span>
      </div>
      <div className="mt-1">
        <div className="flex justify-between hud-label"><span>PROGRESS</span><span className="hud-value text-slate-200">{progress.toFixed(0)}%</span></div>
        <div className="h-1.5 rounded bg-slate-800/80 overflow-hidden mt-0.5" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <Row k="GOAL" v={goalLabel} tone="text-emerald-200" />
      <div className="mt-1.5"><HealthMini /></div>
    </Sec>
  )
}

function PerceptionLeft() {
  const camera = useHealthStore((s) => s.systems.camera)
  const latencyMs = useTelemetryStore((s) => s.latencyMs)
  const traversability = usePerceptionStore((s) => s.traversability)
  const detections = usePerceptionStore((s) => s.detections)
  const active = usePerceptionStore((s) => s.active)
  const locConfidence = useTelemetryStore((s) => s.locConfidence)
  return (
    <>
      <Sec title="CAMERA · ZED 2i (MOCK)">
        <Row k="STATUS" v={camera.status === 'ok' ? '● ONLINE' : `● ${camera.status.toUpperCase()}`} tone="text-emerald-300" />
        <Row k="FPS" v="30" />
        <Row k="LATENCY" v={`${latencyMs} ms`} />
      </Sec>
      <Sec title="PERCEPTION (MOCK)">
        <Row k="STATUS" v={active ? '● ACTIVE' : '○ IDLE'} tone={active ? 'text-emerald-300' : 'text-slate-500'} />
        <Row k="TRAVERSABILITY" v={`${(traversability * 100).toFixed(0)}%`} tone="text-cyan-200" />
        <Row k="DETECTIONS" v={String(detections.length)} tone="text-amber-200" />
      </Sec>
      <Sec title={`CURRENT DETECTIONS · ${detections.length}`}>
        {detections.length === 0 && <div className="font-mono-hud text-[10px] text-slate-600">NO TRACKS — CLEAR CORRIDOR</div>}
        {detections.map((d) => (
          <div key={d.id} className="flex justify-between font-mono-hud text-[11px] py-px">
            <span className="text-slate-200">{d.label}</span>
            <span className="text-amber-200">{(d.confidence * 100).toFixed(0)}%</span>
          </div>
        ))}
      </Sec>
      <Sec title="LOCALIZATION">
        <Row k="FIX" v="VISUAL (NO GPS)" tone="text-emerald-300" />
        <Row k="QUALITY" v={`● ${confidenceLabel(locConfidence)} ${(locConfidence * 100).toFixed(0)}%`} tone="text-emerald-300" />
      </Sec>
    </>
  )
}

function NavigationLeft() {
  const pose = useTelemetryStore((s) => s.pose)
  const headingDeg = useTelemetryStore((s) => s.headingDeg)
  const locConfidence = useTelemetryStore((s) => s.locConfidence)
  const goalLabel = useMissionStore((s) => s.goalLabel)
  const remainingM = useMissionStore((s) => s.remainingM)
  const progress = useMissionStore((s) => s.progress)
  const planner = useHealthStore((s) => s.systems.planner)
  return (
    <>
      <Sec title="LOCALIZATION · VISUAL">
        <Row k="FIX" v="VISUAL" tone="text-emerald-300" />
        <Row k="CONFIDENCE" v={`${(locConfidence * 100).toFixed(0)}%`} tone="text-emerald-300" />
      </Sec>
      <Sec title="CURRENT POSE">
        <Row k="X" v={`${fmt(pose.x, 1)} m`} />
        <Row k="Y" v={`${fmt(pose.y, 1)} m`} />
        <Row k="HEADING" v={`${String(Math.round(headingDeg)).padStart(3, '0')}°`} tone="text-cyan-200" />
      </Sec>
      <Sec title="GOAL">
        <Row k="TARGET" v={goalLabel} tone="text-emerald-200" />
        <Row k="DISTANCE" v={`${fmt(remainingM, 1)} m`} tone="text-slate-100" />
      </Sec>
      <Sec title="PLANNER">
        <Row k="STATUS" v={`● ${planner.status.toUpperCase()}`} tone="text-emerald-300" />
        <Row k="PATH" v="ACTIVE" tone="text-cyan-200" />
      </Sec>
      <Sec title="MISSION">
        <Row k="PROGRESS" v={`${progress.toFixed(0)}%`} />
      </Sec>
    </>
  )
}

function EnvironmentLeft() {
  const pose = useTelemetryStore((s) => s.pose)
  const headingDeg = useTelemetryStore((s) => s.headingDeg)
  const locConfidence = useTelemetryStore((s) => s.locConfidence)
  const pointDensity = useUiStore((s) => s.pointDensity)
  const state = useMissionStore((s) => s.state)
  const points = pointDensity === 'low' ? '4.0K' : pointDensity === 'high' ? '18.0K' : '9.0K'
  return (
    <>
      <Sec title="LOCALIZATION · VISUAL FIX ACTIVE">
        <Row k="POSE" v={`${pose.x.toFixed(1)} / ${pose.y.toFixed(1)}`} />
        <Row k="HEADING" v={`${String(Math.round(headingDeg)).padStart(3, '0')}°`} tone="text-cyan-200" />
      </Sec>
      <Sec title="ENVIRONMENT">
        <Row k="POINT CLOUD" v="● ACTIVE" tone="text-emerald-300" />
        <Row k="POINTS" v={points} />
      </Sec>
      <Sec title="SLAM">
        <Row k="TRACKING" v={`● ${confidenceLabel(locConfidence)}`} tone="text-emerald-300" />
        <Row k="FEATURES" v={`~${featureTracks(locConfidence)}`} />
      </Sec>
      <Sec title="MISSION">
        <Row k="UGV" v="UGV-01" />
        <Row k="STATE" v={state.replace(/_/g, ' ')} tone="text-cyan-200" />
      </Sec>
    </>
  )
}

function LeftSidebar() {
  const view = useUiStore((s) => s.view)
  return (
    <aside aria-label="Mission context sidebar" className="hud-panel min-h-0 overflow-y-auto">
      <MissionSummary />
      {view === 'perception' && <PerceptionLeft />}
      {view === 'navigation' && <NavigationLeft />}
      {view === 'environment' && <EnvironmentLeft />}
    </aside>
  )
}

export default memo(LeftSidebar)
