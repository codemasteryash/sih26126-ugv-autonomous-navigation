import { create } from 'zustand'

let id = 0
const useAlertStore = create((set) => ({
  events: [],
  push: (severity, msg, tMs) => set((s) => ({
    events: [...s.events.slice(-99), { id: ++id, severity, msg, tMs }],
  })),
  clear: () => set({ events: [] }),
}))

export default useAlertStore
