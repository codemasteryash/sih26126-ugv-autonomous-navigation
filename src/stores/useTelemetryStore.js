import { create } from 'zustand'

const useTelemetryStore = create((set) => ({
  v: 0, w: 0, headingDeg: 90, battery: 96, latencyMs: 38,
  locConfidence: 0, featureTracks: 0,
  pose: { x: 0, y: 0, yaw: Math.PI / 2 },
  speedHist: [], batteryHist: [],
  setTelemetry: (patch) => set(patch),
  pushHist: (s, b) => set((st) => ({
    speedHist: [...st.speedHist.slice(-59), s],
    batteryHist: [...st.batteryHist.slice(-59), b],
  })),
  reset: () => set({ v: 0, w: 0, headingDeg: 90, battery: 96, latencyMs: 38, locConfidence: 0, pose: { x: 0, y: 0, yaw: Math.PI / 2 }, speedHist: [], batteryHist: [] }),
}))

export default useTelemetryStore
