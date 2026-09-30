import { create } from 'zustand'

const useNavStore = create((set) => ({
  plannedPath: [],
  actualTraj: [],
  ghostPath: null,
  obstacles: [],
  highlightedId: null,
  goal: { x: 68, y: 10 },
  pendingGoal: null,
  pathVersion: 0,
  replanning: false,
  replanMsg: '',
  setNav: (patch) => set(patch),
  bumpPath: () => set((s) => ({ pathVersion: s.pathVersion + 1 })),
  reset: () => set({ plannedPath: [], actualTraj: [], ghostPath: null, obstacles: [], highlightedId: null, goal: { x: 68, y: 10 }, pendingGoal: null, replanning: false, replanMsg: '' }),
}))

export default useNavStore
