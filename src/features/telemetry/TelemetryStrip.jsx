import { memo } from 'react'
import useTelemetryStore from '../../stores/useTelemetryStore.js'
import { fmt, batteryLevel, confidenceLabel } from '../../lib/units.js'
import { cn } from '../../lib/cn.js'

function Spark({ data, color }) {
  const w = 72, h = 20
  if (!data.length) return <svg width={w} height={h} className="opacity-40"><line x1="0" y1={h - 2} x2={w} y2={h - 2} stroke="#1e2c42" /></svg>
  const max = Math.max(...data, 0.01)
  const pts = data.map((v, i) => `${(i / Math.max(1, data.length - 1)) * w},${h - 2 - (v / max) * (h - 4)}`).join(' ')
  return <svg width={w} height={h} aria-hidden><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" /></svg>
}

function Cell({ label, value, unit, tone, spark, sparkColor }) {
  return (
    <div className="rounded border border-edge bg-panel2/60 px-2 py-1.5">
      <div className="hud-label">{label}</div>
      <div className={cn('hud-value text-base', tone)}>{value}<span className="text-[10px] text-slate-500"> {unit}</span></div>
      {spark && <Spark data={spark} color={sparkColor} />}
    </div>
  )
}

function TelemetryStrip() {
  const v = useTelemetryStore((s) => s.v)
  const w = useTelemetryStore((s) => s.w)
  const headingDeg = useTelemetryStore((s) => s.headingDeg)
  const battery = useTelemetryStore((s) => s.battery)
  const latencyMs = useTelemetryStore((s) => s.latencyMs)
  const locConfidence = useTelemetryStore((s) => s.locConfidence)
  const speedHist = useTelemetryStore((s) => s.speedHist)
  const batteryHist = useTelemetryStore((s) => s.batteryHist)

  const bl = batteryLevel(battery)
  return (
    <section aria-label="Telemetry" className="hud-panel p-3">
      <div className="hud-label mb-2">TELEMETRY · 2 HZ HUD</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-1.5">
        <Cell label="SPEED" value={fmt(v)} unit="m/s" tone="text-cyan-200" spark={speedHist} sparkColor="#22d3ee" />
        <Cell label="ANG VEL" value={fmt(w)} unit="rad/s" tone="text-slate-200" />
        <Cell label="HEADING" value={String(Math.round(headingDeg)).padStart(3, '0') + '°'} unit="" tone="text-cyan-200" />
        <Cell label="BATTERY" value={battery.toFixed(0) + '%'} unit={bl.toUpperCase()} tone={bl === 'healthy' ? 'text-emerald-300' : bl === 'warning' ? 'text-amber-300' : 'text-red-300'} spark={batteryHist} sparkColor={bl === 'healthy' ? '#34d399' : '#fbbf24'} />
        <Cell label="LATENCY" value={latencyMs} unit="ms" tone="text-slate-200" />
        <Cell label="VIS CONF" value={(locConfidence * 100).toFixed(0) + '%'} unit={confidenceLabel(locConfidence)} tone="text-emerald-300" />
      </div>
    </section>
  )
}

export default memo(TelemetryStrip)
