import { create } from 'zustand'

const initial = {
  ros: { status: 'ok', latencyMs: 24, message: 'Mock link 10 Hz' },
  camera: { status: 'ok', latencyMs: 41, message: 'Mock ZED 720p' },
  slam: { status: 'ok', latencyMs: 33, message: 'Visual fix' },
  perception: { status: 'ok', latencyMs: 38, message: 'Mock perception' },
  planner: { status: 'ok', latencyMs: 21, message: 'Planner ready' },
  network: { status: 'ok', latencyMs: 18, message: 'Loopback' },
  power: { status: 'ok', latencyMs: 0, message: '96%' },
}

const useHealthStore = create((set) => ({
  systems: { ...initial },
  setSystem: (key, patch) => set((s) => ({ systems: { ...s.systems, [key]: { ...s.systems[key], ...patch } } })),
  setAll: (systems) => set({ systems }),
  reset: () => set({ systems: { ...initial } }),
}))

export default useHealthStore
