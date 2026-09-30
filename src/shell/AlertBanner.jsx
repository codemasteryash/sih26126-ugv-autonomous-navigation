import useMissionStore from '../stores/useMissionStore.js'
import useConnectionStore from '../stores/useConnectionStore.js'

export default function AlertBanner() {
  const state = useMissionStore((s) => s.state)
  const connected = useConnectionStore((s) => s.connected)
  if (!connected) {
    return <div role="alert" className="rounded border border-red-500/60 bg-red-500/10 px-3 py-2 font-mono-hud text-xs text-red-200 tracking-wider">CONNECTION LOST — LAST KNOWN POSE SHOWN · START DISABLED · E-STOP AVAILABLE</div>
  }
  if (state === 'EMERGENCY_STOP') {
    return <div role="alert" className="rounded border border-red-500 bg-red-600/20 px-3 py-2 font-mono-hud text-xs text-red-100 tracking-wider anim-pulse-dot">EMERGENCY STOP LATCHED — ALL MOTION HALTED · CLEAR E-STOP TO RETURN TO IDLE</div>
  }
  if (state === 'ERROR') {
    return <div role="alert" className="rounded border border-red-400/60 bg-red-500/10 px-3 py-2 font-mono-hud text-xs text-red-200 tracking-wider">AUTONOMY ERROR — CHECK SYSTEMS PAGE · RESET TO IDLE</div>
  }
  return null
}
