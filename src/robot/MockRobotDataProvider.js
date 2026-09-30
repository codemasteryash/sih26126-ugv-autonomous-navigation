// Mock provider: same interface future ROS/Foxglove providers will implement.
import { simCommands } from '../sim/simEngine.js'

export class MockRobotDataProvider {
  constructor() { this.subs = new Set() }
  connect() { simCommands.ensure(); return () => {} }
  disconnect() {}
  onSnapshot(cb) { this.subs.add(cb); return () => this.subs.delete(cb) }
}

let lastCmd = 0
function rateLimit() {
  const t = Date.now()
  if (t - lastCmd < 300) return false
  lastCmd = t
  return true
}

export class MockRobotCommandProvider {
  startMission() { return simCommands.startMission() }
  pause() { return simCommands.pause() }
  resume() { return simCommands.resume() }
  abort() { return simCommands.abort() }
  reset() { return simCommands.reset() }
  eStop() { return simCommands.eStop() }
  clearEStop() { return simCommands.clearEStop() }
  setGoal(g) { return simCommands.setGoal(g) }
  triggerObstacle() {
    if (!rateLimit()) return { accepted: false, reason: 'Rate limited' }
    return simCommands.triggerObstacle()
  }
}

export const mockDataProvider = new MockRobotDataProvider()
export const mockCommandProvider = new MockRobotCommandProvider()
