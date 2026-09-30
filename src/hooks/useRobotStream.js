import { mockCommandProvider } from '../robot/MockRobotDataProvider.js'

// Single gateway: all UI commands flow through here (rate-limit + audit event).
export function sendCommand(name, ...args) {
  const fn = mockCommandProvider[name]
  if (typeof fn !== 'function') return { accepted: false, reason: 'Unknown command' }
  const res = fn.apply(mockCommandProvider, args)
  if (!res.accepted && res.reason) {
    // surface rejections quietly (not every rejection is an alert)
    console.debug(`[cmd] ${name} rejected: ${res.reason}`)
  }
  return res
}

export function useCommand() {
  return sendCommand
}
