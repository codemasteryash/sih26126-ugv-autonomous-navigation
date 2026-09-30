import { memo, useEffect, useRef } from 'react'
import useAlertStore from '../../stores/useAlertStore.js'
import { formatMMSS } from '../../lib/time.js'

const SEV = {
  info: 'text-slate-300 border-slate-600/40',
  success: 'text-emerald-300 border-emerald-500/40',
  warning: 'text-amber-300 border-amber-500/40',
  critical: 'text-red-300 border-red-500/50',
}

function EventLog() {
  const events = useAlertStore((s) => s.events)
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [events.length])
  return (
    <section aria-label="Event log" className="hud-panel p-3 flex flex-col min-h-0">
      <div className="hud-label mb-1">MISSION EVENTS · {events.length}</div>
      <div ref={ref} className="overflow-y-auto space-y-1 max-h-56 min-h-24 pr-1" role="log" aria-live="polite">
        {events.length === 0 && <div className="font-mono-hud text-[11px] text-slate-600">NO EVENTS — START MISSION TO BEGIN AUTONOMY LOG</div>}
        {events.map((e) => (
          <div key={e.id} className={`font-mono-hud text-[11px] border-l-2 pl-2 py-0.5 ${SEV[e.severity] || SEV.info}`}>
            <span className="text-slate-500">[{formatMMSS(e.tMs)}]</span> {e.msg}
          </div>
        ))}
      </div>
    </section>
  )
}

export default memo(EventLog)
