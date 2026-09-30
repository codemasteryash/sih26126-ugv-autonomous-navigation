import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="hud-panel p-8 text-center">
      <div className="hud-label">NAV FAULT 404</div>
      <h1 className="font-mono-hud text-xl text-slate-100 mt-1">UNKNOWN SECTOR</h1>
      <p className="font-mono-hud text-xs text-slate-500 mt-1">RETURN TO OPERATOR CONSOLE</p>
      <Link to="/" className="inline-block mt-3 font-mono-hud text-xs px-3 py-2 rounded border border-cyan-500/50 text-cyan-200">→ MISSION CONTROL</Link>
    </main>
  )
}
