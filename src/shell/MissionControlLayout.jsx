import { Outlet } from 'react-router-dom'
import TopStatusRail from './TopStatusRail.jsx'
import AlertBanner from './AlertBanner.jsx'
import EStopBar from './EStopBar.jsx'

export default function MissionControlLayout() {
  return (
    <div className="min-h-full flex flex-col gap-2 p-2 max-w-[1920px] mx-auto">
      <TopStatusRail />
      <AlertBanner />
      <div className="flex-1 min-h-0">
        <Outlet />
      </div>
      <EStopBar />
      <footer className="font-mono-hud text-[10px] text-slate-600 tracking-widest px-1 flex gap-3">
        <span>SIH26126 · VISION-BASED UGV NAVIGATION</span>
        <span className="ml-auto">MOCK PERCEPTION · FIX: VISUAL (NO GPS) · DEMO BUILD</span>
      </footer>
    </div>
  )
}
