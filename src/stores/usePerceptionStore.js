import { create } from 'zustand'

const usePerceptionStore = create((set) => ({
  detections: [],
  traversability: 0.95,
  active: false,
  setPerception: (patch) => set(patch),
  reset: () => set({ detections: [], traversability: 0.95, active: false }),
}))

export default usePerceptionStore
