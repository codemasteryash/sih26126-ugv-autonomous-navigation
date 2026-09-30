// Mission domain: factories + progress math. Pure, no React.
import { polylineLength, residualDistance, nearestIndex } from '../lib/geo.js'

/**
 * @typedef {{x:number,y:number}} Point2
 * @typedef {{missionId:string,start:Point2,goal:Point2,goalLabel:string}} MissionSpec
 */

export function createMission(spec) {
  return {
    ...spec,
    state: 'IDLE',
    plannedPath: [],
    actualTraj: [],
    elapsedMs: 0,
    replanCount: 0,
  }
}

export function missionProgress(plannedPath, pose) {
  if (!plannedPath.length) return { pct: 0, remainingM: 0, travelledM: 0 }
  const total = polylineLength(plannedPath)
  const idx = nearestIndex(plannedPath, pose)
  const remaining = residualDistance(plannedPath, idx)
  const travelled = Math.max(0, total - remaining)
  return { pct: total ? Math.min(100, (travelled / total) * 100) : 0, remainingM: remaining, travelledM: travelled }
}
