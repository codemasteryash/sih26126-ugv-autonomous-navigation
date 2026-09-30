import { create } from 'zustand'

// activeView: 'perception' | 'navigation' | 'environment' — controls ONLY the
// center viewport. Sidebars stay mounted; their content is contextual to this.
const useUiStore = create((set) => ({
  view: 'perception',
  videoMode: 'perception', // raw | perception | depth
  pointDensity: 'medium',
  layers: {
    ugv: true,
    trajectory: true,
    planned: true,
    obstacles: true,
    cloud: true,
    axes: true,
    frustum: true,
  },
  replayPlaying: false,
  setUi: (patch) => set(patch),
  toggleLayer: (key) => set((s) => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),
}))

export default useUiStore
