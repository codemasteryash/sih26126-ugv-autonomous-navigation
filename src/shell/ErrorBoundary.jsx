import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false, msg: '' }
  }
  static getDerivedStateFromError(err) {
    return { failed: true, msg: String(err?.message || err) }
  }
  componentDidCatch() {}
  render() {
    if (this.state.failed) {
      return (
        <div className="hud-panel p-4 text-sm" role="alert">
          <div className="hud-label mb-1">{this.props.label || 'PANEL FAULT'}</div>
          <div className="text-amber-300 font-mono-hud text-xs">{this.props.fallback || 'Module degraded — 2D map remains available.'}</div>
          <button
            className="mt-2 text-xs border border-edge rounded px-2 py-1 text-cyan-300"
            onClick={() => this.setState({ failed: false, msg: '' })}
          >
            RETRY
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
