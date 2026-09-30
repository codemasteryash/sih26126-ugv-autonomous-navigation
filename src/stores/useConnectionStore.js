import { create } from 'zustand'

const useConnectionStore = create((set) => ({
  connected: true,
  transport: 'mock',
  provider: import.meta.env.VITE_ROBOT_PROVIDER || 'mock',
  lastHeartbeat: Date.now(),
  setConnection: (patch) => set(patch),
}))

export default useConnectionStore
