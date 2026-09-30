import { memo, useMemo, useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import * as THREE from 'three'
import useNavStore from '../../stores/useNavStore.js'
import useTelemetryStore from '../../stores/useTelemetryStore.js'
import useUiStore from '../../stores/useUiStore.js'
import ErrorBoundary from '../../shell/ErrorBoundary.jsx'

// UGV procedural model (no GLB): chassis + wheels + mast + frustum
function UgvModel() {
  const ref = useRef()
  const showUgv = useUiStore((s) => s.layers.ugv)
  const showFrustum = useUiStore((s) => s.layers.frustum)
  useFrame(() => {
    const p = useTelemetryStore.getState().pose
    if (ref.current) {
      ref.current.position.set(p.x - 34, 0.5, -(p.y - 5))
      ref.current.rotation.y = -p.yaw
    }
  })
  if (!showUgv) return null
  return (
    <group ref={ref}>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[2.4, 0.7, 1.6]} />
        <meshStandardMaterial color="#16202f" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[1.4, 0.35, 1.1]} />
        <meshStandardMaterial color="#22d3ee" emissive="#0e7490" emissiveIntensity={0.6} />
      </mesh>
      {[[-0.9, -0.85], [0.9, -0.85], [-0.9, 0.85], [0.9, 0.85]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.25, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.25, 14]} />
          <meshStandardMaterial color="#0b0f16" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[-0.6, 1.4, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 1.1, 8]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[-0.6, 1.95, 0]}>
        <boxGeometry args={[0.5, 0.25, 0.25]} />
        <meshStandardMaterial color="#f59e0b" emissive="#92400e" emissiveIntensity={0.5} />
      </mesh>
      {showFrustum && (
        <mesh position={[3.2, 1.7, 0]} rotation={[0, 0, -Math.PI / 2.25]}>
          <coneGeometry args={[1.6, 4.5, 4, 1, true]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.14} wireframe />
        </mesh>
      )}
    </group>
  )
}

function PathLine({ kind }) {
  const ref = useRef()
  const color = kind === 'planned' ? '#34d399' : kind === 'ghost' ? '#64748b' : '#22d3ee'
  // subscribe to version counter only; bulk data read in useFrame (no react churn)
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const arr = new Float32Array(1200 * 3)
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    return g
  }, [])
  useFrame(() => {
    const st = useNavStore.getState()
    const layers = useUiStore.getState().layers
    const layerKey = kind === 'planned' || kind === 'ghost' ? 'planned' : 'trajectory'
    const data = kind === 'planned' ? st.plannedPath : kind === 'ghost' ? st.ghostPath || [] : st.actualTraj
    const attr = geom.getAttribute('position')
    if (!layers[layerKey]) { geom.setDrawRange(0, 0); return }
    const n = Math.min(data.length, 1200)
    for (let i = 0; i < n; i++) attr.setXYZ(i, data[i].x - 34, 0.15, -(data[i].y - 5))
    geom.setDrawRange(0, n)
    attr.needsUpdate = true
  })
  if (kind === 'ghost') {
    // ghost visibility handled by draw-range; keep mounted
  }
  return (
    <line ref={ref} geometry={geom} frustumCulled={false}>
      <lineBasicMaterial color={color} transparent opacity={kind === 'ghost' ? 0.4 : 0.95} />
    </line>
  )
}

function ObstacleMarkers() {
  const ref = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useFrame(() => {
    if (!ref.current) return
    const show = useUiStore.getState().layers.obstacles
    const obs = show ? useNavStore.getState().obstacles : []
    obs.forEach((o, i) => {
      dummy.position.set(o.x - 34, 0.8, -(o.y - 5))
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.count = obs.length
    ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 16]} frustumCulled={false}>
      <coneGeometry args={[1.1, 2.2, 10]} />
      <meshStandardMaterial color="#f87171" emissive="#7f1d1d" emissiveIntensity={0.7} />
    </instancedMesh>
  )
}

// deterministic PRNG (no ref/state mutation during render)
function mulberry(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Decimated mock point cloud: preallocated buffer, throttled update, density-capped.
function MockCloud() {
  const density = useUiStore((s) => s.pointDensity)
  const COUNT = density === 'low' ? 4000 : density === 'high' ? 18000 : 9000
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(18000 * 3), 3))
    // deterministic pseudo-terrain scatter (mulberry32, seeded)
    const attr = g.getAttribute('position')
    const rnd = mulberry(42)
    for (let i = 0; i < 18000; i++) {
      const x = (rnd() - 0.3) * 90
      const z = (rnd() - 0.5) * 50
      const y = Math.max(0, Math.sin(x * 0.3) * 0.5 + rnd() * 1.4) * (Math.abs(z) > 8 ? 1.6 : 0.25)
      attr.setXYZ(i, x, y, z)
    }
    return g
  }, [])
  useFrame(() => {
    const show = useUiStore.getState().layers.cloud
    geom.setDrawRange(0, show ? COUNT : 0)
  })
  return <points geometry={geom} frustumCulled={false}><pointsMaterial size={0.09} color="#38bdf8" transparent opacity={0.65} sizeAttenuation /></points>
}

function GoalMarker() {
  const goal = useNavStore((s) => s.goal)
  return (
    <group position={[goal.x - 34, 0, -(goal.y - 5)]}>
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[0.9, 0.6, 0.08]} />
        <meshStandardMaterial color="#34d399" emissive="#065f46" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.2, 6]} />
        <meshStandardMaterial color="#34d399" />
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.6, 2.1, 32]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function AxesToggle() {
  const show = useUiStore((s) => s.layers.axes)
  if (!show) return null
  return <axesHelper args={[6]} position={[-34, 0.02, 5]} />
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[20, 30, 10]} intensity={1.1} />
      <Grid infiniteGrid sectionColor="#12303a" cellColor="#0e1a26" fadeDistance={120} position={[0, -0.02, 0]} />
      <AxesToggle />
      <UgvModel />
      <PathLine kind="planned" />
      <PathLine kind="ghost" />
      <PathLine kind="actual" />
      <ObstacleMarkers />
      <GoalMarker />
      <MockCloud />
      <OrbitControls makeDefault target={[0, 0, 0]} maxPolarAngle={Math.PI / 2.1} />
    </>
  )
}

function UgvSceneCanvas() {
  return (
    <div className="relative w-full h-full">
      <ErrorBoundary label="3D FAULT" fallback="3D renderer failed — 2D costmap remains authoritative.">
        <Suspense fallback={<div className="font-mono-hud text-xs text-slate-500 p-4">LOADING 3D…</div>}>
          <Canvas dpr={[1, 1.75]} camera={{ position: [8, 14, 22], fov: 50 }} gl={{ antialias: true, powerPreference: 'high-performance' }} style={{ background: '#060a12' }}>
            <Scene />
          </Canvas>
        </Suspense>
      </ErrorBoundary>
      <div className="absolute bottom-1.5 left-2 font-mono-hud text-[9px] text-slate-500 bg-black/50 rounded px-1.5 py-0.5">R3F · BUFFER POINTS · INSTANCED OBSTACLES · DRAG TO ORBIT · LAYERS IN SIDEBAR</div>
    </div>
  )
}

export default memo(UgvSceneCanvas)
