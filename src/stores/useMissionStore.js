import { create } from 'zustand'
import { canTransition } from '../domain/autonomyStates.js'

const useMissionStore = create((set, get) => ({
  missionId: 'UGV-MISSION-001',
  start: { x: 0, y: 0 },
  goal: { x: 68, y: 10 },
  goalLabel: 'SEARCH ZONE B',
  state: 'IDLE',
  progress: 0,
  remainingM: 68,
  travelledM: 0,
  elapsedMs: 0,
  replanCount: 0,
  lastEvent: '',

  setMission: (patch) => set(patch),
  transition: (to) => {
    const from = get().state
    if (from === to) return true
    if (!canTransition(from, to)) return false
    set({ state: to })
    return true
  },
  reset: () => set({
    state: 'IDLE', progress: 0, remainingM: 68, travelledM: 0,
    elapsedMs: 0, replanCount: 0, goal: { x: 68, y: 10 }, goalLabel: 'SEARCH ZONE B',
  }),
}))

export default useMissionStore
