// Deterministic mock simulation engine. Single interval, writes to zustand stores.
// Realistic demo: ~60-75s mission A->B with 3 scripted obstacle replans.
import useMissionStore from '../stores/useMissionStore.js'
import useTelemetryStore from '../stores/useTelemetryStore.js'
import usePerceptionStore from '../stores/usePerceptionStore.js'
import useNavStore from '../stores/useNavStore.js'
import useHealthStore from '../stores/useHealthStore.js'
import useAlertStore from '../stores/useAlertStore.js'
import useConnectionStore from '../stores/useConnectionStore.js'
import { buildBasePath, SCENARIO_OBSTACLES, obstaclePoseOnPath, MAP_BOUNDS } from './scenario.js'
import { faults } from './faults.js'
import { offsetPath, featureTracks } from '../domain/models.js'
import { polylineLength, clampToBounds, yawDeg } from '../lib/geo.js'
import { safePose, clampDetections } from '../robot/decode.js'

const DT = 0.1
const CRUISE = 7.0 // m/s sim speed (scaled so demo completes ~60s for 70m path + pauses)

const engine = {
  timer: null,
  running: false,
  mode: 'auto',
  s: 0, // distance travelled along path
  totalLen: 1,
  path: [],
  basePath: [],
  phaseT: 0,
  paused: false,
  obstacleState: null, // {obs, t}
  triggeredObs: new Set(),
  ghostTimer: 0,
  traj: [],
  log: [],
  logT: 0,
  tickN: 0,
  manualObsIdx: 0,
}

function ensureLoop() {
  if (engine.timer) return
  engine.timer = setInterval(tick, DT * 1000)
}

function snapshot() {
  return {
    mission: useMissionStore.getState(),
    telemetry: useTelemetryStore.getState(),
    nav: useNavStore.getState(),
  }
}

export function getSnapshot() { return snapshot() }

function pushEvent(sev, msg) {
  const t = useMissionStore.getState().elapsedMs
  useAlertStore.getState().push(sev, msg, t)
}

function setState(to) {
  const ok = useMissionStore.getState().transition(to)
  if (ok) useMissionStore.setState({ lastEvent: to })
  return ok
}

function initPath(goal) {
  engine.basePath = buildBasePath(goal)
  engine.path = engine.basePath.map((p) => ({ ...p }))
  engine.totalLen = polylineLength(engine.path)
  engine.s = 0
  engine.traj = [{ ...engine.path[0] }]
  engine.triggeredObs = new Set()
  engine.obstacleState = null
  useNavStore.setState({
    plannedPath: engine.path.map((p) => ({ ...p })),
    actualTraj: [{ ...engine.path[0] }],
    obstacles: [], highlightedId: null, ghostPath: null,
    goal: { ...goal }, replanning: false, replanMsg: '',
  })
}

function poseAt(s) {
  // walk along path by arclength
  let acc = 0
  for (let i = 1; i < engine.path.length; i++) {
    const a = engine.path[i - 1], b = engine.path[i]
    const seg = Math.hypot(b.x - a.x, b.y - a.y)
    if (acc + seg >= s) {
      const t = seg ? (s - acc) / seg : 0
      const x = a.x + (b.x - a.x) * t
      const y = a.y + (b.y - a.y) * t
      const yaw = Math.atan2(b.y - a.y, b.x - a.x)
      return { x, y, yaw }
    }
    acc += seg
  }
  const last = engine.path[engine.path.length - 1]
  const prev = engine.path[engine.path.length - 2] || last
  return { x: last.x, y: last.y, yaw: Math.atan2(last.y - prev.y, last.x - prev.x) }
}

function fireObstacle(obs) {
  const pose = obstaclePoseOnPath(engine.path, obs.atProgress, obs.lateral)
  const ob = { ...obs, ...pose }
  const nav = useNavStore.getState()
  if (!nav.obstacles.find((o) => o.id === ob.id)) {
    useNavStore.setState({ obstacles: [...nav.obstacles, ob] })
  }
  useNavStore.setState({ highlightedId: ob.id })
  engine.triggeredObs.add(ob.id)
  engine.obstacleState = { obs: ob, t: 0 }
  setState('OBSTACLE_DETECTED')
  pushEvent('warning', `${ob.label} DETECTED @ ${Math.max(2, 14 - engine.tickN % 6).toFixed(1)}m — PATH BLOCKED`)
  useHealthStore.getState().setSystem('perception', { status: 'ok', latencyMs: 44, message: `${ob.label} tracked` })
}

function doReplan(obs) {
  const nav = useNavStore.getState()
  const ghost = nav.plannedPath.map((p) => ({ ...p }))
  const fresh = offsetPath(engine.basePath, obs.lateral, 0.2, 0.85)
  // keep travelled prefix identical so UGV doesn't jump
  const idx = Math.min(ghost.length - 1, Math.floor(ghost.length * obs.atProgress))
  for (let i = 0; i <= idx && i < fresh.length; i++) fresh[i] = { ...ghost[i] }
  engine.path = fresh
  engine.totalLen = polylineLength(engine.path)
  const n = useMissionStore.getState().replanCount + 1
  useMissionStore.setState({ replanCount: n })
  useNavStore.setState({ plannedPath: fresh.map((p) => ({ ...p })), ghostPath: ghost, replanning: true, replanMsg: `REPLAN #${String(n).padStart(2, '0')} — ${obs.label} DETECTED` })
  useNavStore.getState().bumpPath()
  engine.ghostTimer = 6
  setState('REPLANNING')
  pushEvent('warning', `REPLANNING… (reason: ${obs.label})`)
  setTimeout(() => {
    if (useMissionStore.getState().state !== 'REPLANNING') return
    useNavStore.setState({ replanning: false })
    setState('NAVIGATING')
    pushEvent('success', `NEW PATH ACCEPTED — REPLAN #${String(n).padStart(2, '0')}`)
  }, 2000)
}

function tick() {
  engine.tickN++
  const M = useMissionStore.getState()
  const T = useTelemetryStore.getState()
  const C = useConnectionStore.getState()

  // connection fault
  if (faults.connectionLost) {
    if (C.connected) {
      useConnectionStore.setState({ connected: false })
      pushEvent('critical', 'CONNECTION LOST — TELEMETRY FROZEN')
      useHealthStore.getState().setSystem('ros', { status: 'lost', message: 'Heartbeat timeout' })
      useHealthStore.getState().setSystem('network', { status: 'lost', message: 'No heartbeat 3s' })
    }
    return
  } else if (!C.connected) {
    useConnectionStore.setState({ connected: true, lastHeartbeat: Date.now() })
    pushEvent('success', 'CONNECTION RESTORED')
    useHealthStore.getState().setSystem('ros', { status: 'ok', message: 'Mock link 10 Hz' })
    useHealthStore.getState().setSystem('network', { status: 'ok', message: 'Loopback' })
  }
  useConnectionStore.setState({ lastHeartbeat: Date.now() })

  // mission clock runs once started
  if (!['IDLE', 'GOAL_REACHED'].includes(M.state)) {
    useMissionStore.setState({ elapsedMs: M.elapsedMs + DT * 1000 })
  }

  // phased startup
  if (['INITIALIZING', 'LOCALIZING', 'READY'].includes(M.state)) {
    engine.phaseT += DT
    const need = M.state === 'INITIALIZING' ? 1.6 : M.state === 'LOCALIZING' ? 2.2 : 1.0
    // ramp confidence during localizing
    const conf = M.state === 'INITIALIZING' ? 0.25 : M.state === 'LOCALIZING' ? Math.min(0.96, 0.4 + engine.phaseT * 0.3) : 0.96
    useTelemetryStore.setState({ locConfidence: faults.slamDegraded ? 0.42 : conf, featureTracks: featureTracks(conf) })
    if (M.state === 'INITIALIZING') useTelemetryStore.setState({ v: 0, w: 0 })
    if (engine.phaseT >= need) {
      engine.phaseT = 0
      if (M.state === 'INITIALIZING') { setState('LOCALIZING'); pushEvent('info', 'LOCALIZING — VISUAL ODOMETRY INIT') }
      else if (M.state === 'LOCALIZING') {
        if (faults.slamDegraded) {
          useHealthStore.getState().setSystem('slam', { status: 'degraded', message: 'Low feature lock' })
          pushEvent('warning', 'LOCALIZATION DEGRADED — LOW FEATURE LOCK')
        } else {
          useHealthStore.getState().setSystem('slam', { status: 'ok', message: 'Visual fix' })
          pushEvent('success', 'VISUAL FIX ACQUIRED — FIX: VISUAL (NO GPS)')
        }
        setState('READY')
      }
      else if (M.state === 'READY') {
        setState('NAVIGATING')
        pushEvent('success', 'NAVIGATION STARTED — A→B AUTONOMOUS')
        useHealthStore.getState().setSystem('planner', { status: 'ok', message: 'Tracking path' })
      }
    }
    return
  }

  const pausedHold = M.state === 'PAUSED' || M.state === 'EMERGENCY_STOP' || M.state === 'ERROR' || M.state === 'IDLE' || M.state === 'GOAL_REACHED'
  void pausedHold
  const blocked = M.state === 'OBSTACLE_DETECTED' || M.state === 'REPLANNING'

  // obstacle sequencing
  if (M.state === 'NAVIGATING' && !engine.paused) {
    const frac = engine.totalLen ? engine.s / engine.totalLen : 0
    for (const obs of SCENARIO_OBSTACLES) {
      if (!engine.triggeredObs.has(obs.id) && frac >= obs.atProgress) {
        fireObstacle(obs)
        break
      }
    }
  }
  if (engine.obstacleState && M.state === 'OBSTACLE_DETECTED') {
    engine.obstacleState.t += DT
    useTelemetryStore.setState({ v: 0, w: 0 })
    if (engine.obstacleState.t >= 1.4) {
      const ob = engine.obstacleState.obs
      engine.obstacleState = null
      doReplan(ob)
    }
    // still update HUD below
  }

  // motion
  if (M.state === 'NAVIGATING' && !blocked && !engine.paused) {
    const remain = engine.totalLen - engine.s
    const target = remain < 6 ? Math.max(0.5, (remain / 6) * 1.6) : 1.6
    const step = target * CRUISE * DT * 0.22 // scaled step
    engine.s = Math.min(engine.totalLen, engine.s + step)
    if (engine.totalLen - engine.s <= 0.15) {
      setState('GOAL_REACHED')
      pushEvent('success', 'GOAL REACHED — MISSION COMPLETE')
      useTelemetryStore.setState({ v: 0, w: 0 })
      useHealthStore.getState().setSystem('planner', { status: 'ok', message: 'Goal reached' })
    }
  }

  const pose = poseAt(engine.s)
  const safe = safePose({ ...pose, v: M.state === 'NAVIGATING' && !blocked ? 1.55 : 0, w: blocked ? 0 : Math.sin(engine.tickN / 25) * 0.08, confidence: faults.slamDegraded ? 0.42 : 0.9 + Math.sin(engine.tickN / 40) * 0.05 }, { ...pose, v: 0, w: 0, confidence: 0.9 })

  // trajectory decimation
  const lastT = engine.traj[engine.traj.length - 1]
  if (!lastT || Math.hypot(pose.x - lastT.x, pose.y - lastT.y) > 0.5) {
    engine.traj.push({ x: pose.x, y: pose.y })
    if (engine.traj.length > 800) engine.traj.shift()
    useNavStore.setState({ actualTraj: engine.traj.map((p) => ({ ...p })) })
  }

  // progress + mission distances
  useMissionStore.setState({ progress: Math.min(100, (engine.s / engine.totalLen) * 100), remainingM: Math.max(0, engine.totalLen - engine.s), travelledM: engine.s })

  // battery
  let battery = T.battery - (M.state === 'NAVIGATING' && !blocked ? 0.022 : 0.004)
  if (faults.lowBattery) battery = Math.min(battery, 18.5)
  battery = Math.max(5, battery)
  useTelemetryStore.setState({
    v: safe.v, w: safe.w, headingDeg: yawDeg(pose.yaw), battery,
    latencyMs: Math.round(36 + Math.sin(engine.tickN / 12) * 8 + (engine.tickN % 7)),
    locConfidence: faults.slamDegraded ? 0.42 : safe.confidence,
    featureTracks: featureTracks(faults.slamDegraded ? 0.42 : safe.confidence),
    pose: { x: pose.x, y: pose.y, yaw: pose.yaw },
  })
  if (engine.tickN % 10 === 0) useTelemetryStore.getState().pushHist(safe.v, battery)

  // ghost fade
  if (engine.ghostTimer > 0) {
    engine.ghostTimer -= DT
    if (engine.ghostTimer <= 0) useNavStore.setState({ ghostPath: null, highlightedId: null })
  }

  // perception detections from active obstacles near UGV
  const nav = useNavStore.getState()
  const dets = nav.obstacles
    .filter((o) => Math.hypot(o.x - pose.x, o.y - pose.y) < 30)
    .map((o) => ({
      id: o.id, label: o.label,
      confidence: 0.86 + ((engine.tickN + o.x) % 10) / 100,
      distM: Math.hypot(o.x - pose.x, o.y - pose.y),
      angle: Math.atan2(o.y - pose.y, o.x - pose.x) - pose.yaw,
    }))
  usePerceptionStore.setState({
    detections: faults.perceptionLost ? [] : clampDetections(dets),
    active: M.state === 'NAVIGATING' || M.state === 'OBSTACLE_DETECTED' || M.state === 'REPLANNING',
    traversability: blocked ? 0.42 : 0.88 + Math.sin(engine.tickN / 30) * 0.05,
  })

  // health
  const H = useHealthStore.getState()
  if (faults.perceptionLost && H.systems.perception.status !== 'lost') {
    H.setSystem('perception', { status: 'lost', message: 'No detections 3s' })
    pushEvent('critical', 'PERCEPTION DEGRADED — MOCK PERCEPTION LOST')
  } else if (!faults.perceptionLost && H.systems.perception.status === 'lost') {
    H.setSystem('perception', { status: 'ok', message: 'Mock perception' })
    pushEvent('success', 'PERCEPTION RESTORED')
  }
  if (!faults.slamDegraded && ['NAVIGATING'].includes(M.state)) {
    H.setSystem('slam', { status: 'ok', latencyMs: 30 + (engine.tickN % 9), message: 'Visual fix' })
  }
  H.setSystem('power', { status: battery < 20 ? 'lost' : battery < 40 ? 'degraded' : 'ok', message: `${battery.toFixed(0)}%` })
  if (battery < 20 && !engine.lowWarned) { engine.lowWarned = true; pushEvent('warning', 'BATTERY LOW — CONSIDER PAUSE/ABORT') }
  if (battery >= 20) engine.lowWarned = false

  // replay log @5Hz
  engine.logT += DT
  if (engine.logT >= 0.2 && ['NAVIGATING', 'OBSTACLE_DETECTED', 'REPLANNING'].includes(M.state)) {
    engine.logT = 0
    engine.log.push({ t: M.elapsedMs, x: pose.x, y: pose.y, yaw: pose.yaw, v: safe.v, battery, state: M.state, replanCount: M.replanCount })
    if (engine.log.length > 3000) engine.log.shift()
  }
}

// ---- command API used by MockRobotDataProvider ----
export const simCommands = {
  ensure() { ensureLoop() },
  startMission() {
    ensureLoop()
    const M = useMissionStore.getState()
    if (M.state !== 'IDLE' && M.state !== 'GOAL_REACHED' && M.state !== 'ERROR') return { accepted: false, reason: `Cannot START from ${M.state}` }
    const goal = useNavStore.getState().goal
    initPath(goal)
    useMissionStore.setState({ elapsedMs: 0, progress: 0, replanCount: 0 })
    useTelemetryStore.getState().reset()
    useAlertStore.getState().clear()
    engine.phaseT = 0
    setState('INITIALIZING')
    pushEvent('info', `MISSION START — UGV-MISSION-001 → ${useMissionStore.getState().goalLabel}`)
    return { accepted: true }
  },
  pause() {
    const M = useMissionStore.getState()
    if (!['NAVIGATING', 'REPLANNING', 'OBSTACLE_DETECTED'].includes(M.state)) return { accepted: false, reason: `Cannot PAUSE from ${M.state}` }
    engine.prePause = M.state
    setState('PAUSED'); pushEvent('warning', 'MISSION PAUSED BY OPERATOR')
    return { accepted: true }
  },
  resume() {
    const M = useMissionStore.getState()
    if (M.state !== 'PAUSED') return { accepted: false, reason: 'Not paused' }
    setState(engine.prePause === 'REPLANNING' ? 'REPLANNING' : 'NAVIGATING')
    pushEvent('info', 'MISSION RESUMED')
    return { accepted: true }
  },
  abort() {
    setState('IDLE'); engine.s = 0
    useTelemetryStore.setState({ v: 0, w: 0 })
    pushEvent('critical', 'MISSION ABORTED BY OPERATOR')
    return { accepted: true }
  },
  reset() {
    useMissionStore.getState().reset()
    useTelemetryStore.getState().reset()
    usePerceptionStore.getState().reset()
    useNavStore.getState().reset()
    useHealthStore.getState().reset()
    useAlertStore.getState().clear()
    useConnectionStore.setState({ connected: true })
    engine.s = 0; engine.path = []; engine.traj = []; engine.log = []; engine.lowWarned = false
    return { accepted: true }
  },
  eStop() {
    useMissionStore.setState({ state: 'EMERGENCY_STOP' })
    useTelemetryStore.setState({ v: 0, w: 0 })
    pushEvent('critical', 'EMERGENCY STOP ENGAGED — ALL MOTION HALTED')
    return { accepted: true }
  },
  clearEStop() {
    const M = useMissionStore.getState()
    if (M.state !== 'EMERGENCY_STOP') return { accepted: false, reason: 'E-STOP not latched' }
    useMissionStore.setState({ state: 'IDLE' })
    pushEvent('info', 'E-STOP CLEARED — SYSTEM SAFE (IDLE)')
    return { accepted: true }
  },
  setGoal(g) {
    if (!clampToBounds(g, MAP_BOUNDS)) return { accepted: false, reason: 'Goal outside map bounds' }
    useNavStore.setState({ goal: { ...g } })
    useMissionStore.setState({ goal: { ...g } })
    pushEvent('info', `DESTINATION SET → (${g.x.toFixed(1)}, ${g.y.toFixed(1)})`)
    return { accepted: true }
  },
  triggerObstacle() {
    const next = SCENARIO_OBSTACLES.find((o) => !engine.triggeredObs.has(o.id))
    if (!next) return { accepted: false, reason: 'No remaining scripted obstacles' }
    if (useMissionStore.getState().state !== 'NAVIGATING') return { accepted: false, reason: 'Requires NAVIGATING' }
    fireObstacle(next, false)
    return { accepted: true }
  },
  getLog() { return engine.log },
  getState() { return engine },
}

export { MAP_BOUNDS }
