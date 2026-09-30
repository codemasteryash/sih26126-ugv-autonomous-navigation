import { memo, Suspense, lazy } from 'react'
import useUiStore from '../../stores/useUiStore.js'
import useTelemetryStore from '../../stores/useTelemetryStore.js'
import useNavStore from '../../stores/useNavStore.js'
import useHealthStore from '../../stores/useHealthStore.js'
import VideoPanel from '../video/VideoPanel.jsx'
import CostmapCanvas from '../map2d/CostmapCanvas.jsx'
import ErrorBoundary from '../../shell/ErrorBoundary.jsx'

const UgvSceneCanvas = lazy(() => import('../viz3d/UgvSceneCanvas.jsx'))

function ViewportHeader({ title, stats }) {
  return (
    <div className="flex items-center gap-3 px-2.5 py-1.5 border-b border-edge/70">
      <span className="font-mono-hud text-[11px] font-bold tracking-[0.14em] text-slate-200">{title}</span>
      <span className="ml-auto font-mono-hud text-[10px] text-slate-500 tracking-wider truncate">{stats}</span>
    </div>
  )
}

function LivePerceptionView() {
  const latencyMs = useTelemetryStore((s) => s.latencyMs)
  return (
    <div className="flex flex-col min-h-0 h-full">
      <ViewportHeader title="LIVE PERCEPTION" stats={`ZED 2i · RGB (MOCK) · 30 FPS · ${latencyMs} ms`} />
      <div className="flex-1 min-h-0 p-2">
        <ErrorBoundary label="VIDEO FAULT" fallback="Camera unavailable — CAMERA SIGNAL LOST.">
          <VideoPanel fill />
        </ErrorBoundary>
      </div>
    </div>
  )
}

function NavigationView() {
  const locConfidence = useTelemetryStore((s) => s.locConfidence)
  const planner = useHealthStore((s) => s.systems.planner)
  const replanMsg = useNavStore((s) => s.replanMsg)
  const replanning = useNavStore((s) => s.replanning)
  return (
    <div className="flex flex-col min-h-0 h-full">
      <ViewportHeader
        title="NAVIGATION VIEW"
        stats={`VISUAL LOCALIZATION · ${(locConfidence * 100).toFixed(0)}% · PLANNER · ${planner.status.toUpperCase()}${replanning && replanMsg ? ` · ${replanMsg}` : ''}`}
      />
      <div className="flex-1 min-h-0 p-2">
        <div className="w-full h-full rounded border border-edge overflow-hidden relative">
          <ErrorBoundary label="2D MAP FAULT" fallback="2D map failed.">
            <CostmapCanvas />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}

function Environment3DView() {
  const pointDensity = useUiStore((s) => s.pointDensity)
  const points = pointDensity === 'low' ? '4.0K' : pointDensity === 'high' ? '18.0K' : '9.0K'
  return (
    <div className="flex flex-col min-h-0 h-full">
      <ViewportHeader title="3D ENVIRONMENT" stats={`POINT CLOUD (MOCK) · ${points} · SLAM TRACKING · ACTIVE`} />
      <div className="flex-1 min-h-0 p-2">
        <div className="w-full h-full rounded border border-edge overflow-hidden relative">
          <ErrorBoundary label="3D FAULT" fallback="3D renderer failed — switch to NAVIGATION VIEW for authoritative 2D map.">
            <Suspense fallback={<div className="p-4 font-mono-hud text-xs text-slate-500">LOADING 3D…</div>}>
              <UgvSceneCanvas />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}

function MainVisualizationViewport() {
  const view = useUiStore((s) => s.view)
  return (
    <section aria-label="Main visualization viewport" className="hud-panel min-h-0 overflow-hidden flex flex-col">
      {view === 'perception' && <LivePerceptionView />}
      {view === 'navigation' && <NavigationView />}
      {view === 'environment' && <Environment3DView />}
    </section>
  )
}

export default memo(MainVisualizationViewport)
