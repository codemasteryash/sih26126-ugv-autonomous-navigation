import { memo } from 'react'
import { Video, Map, Boxes } from 'lucide-react'
import useUiStore from '../stores/useUiStore.js'
import { cn } from '../lib/cn.js'

const TABS = [
  { id: 'perception', label: 'LIVE PERCEPTION', icon: Video },
  { id: 'navigation', label: 'NAVIGATION VIEW', icon: Map },
  { id: 'environment', label: '3D ENVIRONMENT', icon: Boxes },
]

function ViewSwitcher() {
  const view = useUiStore((s) => s.view)
  const setUi = useUiStore((s) => s.setUi)
  return (
    <div className="hud-panel px-2 py-1.5 flex items-center gap-1" role="tablist" aria-label="Visualization mode">
      <span className="hud-label hidden md:block px-1">VIEW</span>
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = view === id
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            onClick={() => setUi({ view: id })}
            className={cn(
              'flex items-center gap-1.5 font-mono-hud text-[11px] font-bold tracking-[0.12em] px-3 py-1.5 rounded-sm border transition-colors',
              active
                ? 'border-cyan-400/70 text-cyan-100 bg-cyan-400/10 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                : 'border-edge text-slate-500 hover:text-slate-300 hover:border-slate-600',
            )}
          >
            <Icon size={13} strokeWidth={2} />
            {label}
            {active && <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 anim-pulse-dot" />}
          </button>
        )
      })}
      <span className="ml-auto font-mono-hud text-[10px] text-slate-600 tracking-widest hidden lg:block">SHARED SIM STATE · SWITCHING VIEW NEVER RESETS MISSION</span>
    </div>
  )
}

export default memo(ViewSwitcher)
