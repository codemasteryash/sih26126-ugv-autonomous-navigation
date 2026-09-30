# UGV Mission Control Center — SIH 2026 · Problem Statement 26126

**Vision Based Autonomous Navigation for Unmanned Ground Vehicle for Outdoor Environment**

Professional operator-facing Autonomous UGV Mission Control Center. Visualizes the autonomy pipeline
(camera → perception → obstacles/traversable path → visual localization/SLAM → path planning →
collision avoidance → replanning → motion command) without implementing AI/SLAM/planning algorithms in the frontend.

> **CURRENT: 100% mock implementation.** All telemetry, detections, paths and point clouds are produced by a
> deterministic in-browser simulation (`src/sim/`). Always shown in-UI as **SIMULATION MODE / MOCK PERCEPTION**.
> **FUTURE: real robot** via ROS 2 / Foxglove providers without rewriting UI (stubs in `src/robot/`).

## SIH challenges → where to see them

| Challenge | Main screen evidence |
|---|---|
| 1. Path detection | `VideoPanel` (PERCEPTION mode: boxes + confidence + traversability), `CostmapCanvas` traversable corridor + obstacles + inflated zones |
| 2. Visual localization (GPS-denied) | `LocalizationPanel` (FIX: VISUAL, X/Y/heading, confidence, feature tracks), trajectory on 2D + 3D |
| 3. Collision avoidance | `OBSTACLE_DETECTED → REPLANNING → NAVIGATING` badge flow, ghosted old path + new path, `REPLAN #n` events |

## Demo (judge flow, ~60s)

1. `npm run dev` → open `/` → **UGV-01 · SIMULATION MODE · IDLE**
2. Press **▶ START** → INITIALIZING → LOCALIZING → READY → NAVIGATING
3. Watch 3 scripted replans: **ROCK (~30%) → DITCH (~55%) → PERSON (~75%)**, each with PATH BLOCKED → REPLANNING → NEW PATH ACCEPTED + ghosted old path
4. **GOAL REACHED** → progress 100%
5. Try: click 2D map → CONFIRM destination; ▲ OBSTACLE inject; `/systems` fault toggles; **E-STOP** (press twice, latching); `/replay` backup demo

## Running locally

```powershell
npm install
npm run dev      # http://localhost:5173
npm run lint
npm run build
npm run preview
```

No env vars required for mock. Future ROS: copy `.env.example` → `.env`, set `VITE_ROBOT_PROVIDER=ros|foxglove`.

## Architecture

```
UI (features/*, shell/*, pages/*)
 → zustand stores (1–5 Hz React state; selectors everywhere)
 → robot/ provider interface (RobotDataProvider / RobotCommandProvider)
 → sim/ deterministic engine (mock)  |  Ros/Foxglove providers (future stubs)
High-rate rendering bypasses React: canvas rAF + R3F useFrame + refs + preallocated buffers.
```

- `src/domain/` — autonomy state machine (11 states, guarded transitions), mission/perception/nav math (pure, testable)
- `src/stores/` — mission, telemetry, perception, nav, health, alerts, connection, ui
- `src/robot/` — interfaces + `MockRobotDataProvider` + `Ros`/`Foxglove` stubs + `topicMap.js` (only file with topic names) + `decode.js` (zod boundary)
- `src/sim/` — `scenario.js` (scripted A→B + obstacles), `simEngine.js` (10 Hz tick), `faults.js` (injectors)
- `src/features/map2d/` — Canvas 2D costmap (not SVG): corridor, obstacles, inflated zones, planned/actual/ghost paths, goal picker
- `src/features/video/` — procedural mock ZED feed, RAW/PERCEPTION/DEPTH modes, canvas overlay (no frames in React state)
- `src/features/viz3d/` — isolated R3F scene: procedural UGV (no GLB), buffer `THREE.Points` cloud (4k/9k/18k density), `InstancedMesh` obstacles, version-driven path lines
- Routes: `/` ops console, `/replay` read-only backup demo, `/systems` diagnostics + fault injection, `/*` safe fallback

## Performance rules

React/zustand ≤5 Hz · transient telemetry ~5–10 Hz · canvas/3D 30–60 fps via rAF/`useFrame` · preallocated point buffers · trajectory decimation + caps · lazy-loaded 3D with 2D fallback · `ErrorBoundary` per viewport · latching E-STOP always mounted.

## Project structure

See `src/` folders: `shell/ pages/ features/{mission,video,map2d,viz3d,telemetry,health,alerts,control} domain/ stores/ robot/ sim/ hooks/ lib/`.
