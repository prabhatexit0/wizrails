# 🚂 Wizrails — Vibe Coding Prompt

## Paste this into your AI coding tool (Claude Code / Cursor / etc.)

---

Build me a **3D Indian Railways Track Builder game called Wizrails** using **React + TypeScript** with **React Three Fiber (R3F)** and **@react-three/drei** for 3D rendering.

### Core Concept

The player builds railway tracks on a 3D terrain map representing the route from **New Delhi → Chandigarh → Shimla**. The terrain gradually rises from the flat plains of Delhi, through the green fields near Chandigarh, into the steep Himalayan foothills approaching Shimla. Once a valid track is laid connecting all three stations, the player can hit "Depart" and watch a train chug along their route in real time.

### Tech Stack

- **React 18+ with TypeScript** (Vite)
- **React Three Fiber** (`@react-three/fiber`) + **Drei** (`@react-three/drei`) for the 3D scene
- **Zustand** for game state management
- **Rust → WASM** (via `wasm-pack`) for the performance-critical parts:
  - **Pathfinding engine** — A* or Dijkstra over the track grid, considering elevation cost
  - **Terrain generation** — procedural heightmap with noise (use the `noise` crate), exported as a flat `Float32Array` to JS
  - **Track validation** — check connectivity, max gradient limits, and whether all 3 stations are connected
- Everything else (rendering, UI, input handling) stays in TypeScript/React

### The Map & Terrain

- Grid-based map, roughly **24 columns × 40 rows**, each cell ~1 unit
- Elevation profile (south to north):
  - **Rows 30-40 (Delhi):** Flat plains, elevation ~0. Dusty golden-green ground. Sparse trees.
  - **Rows 16-30 (Punjab/Haryana):** Gentle rolling fields, elevation 0–2. Lush green, farmland vibes. Scattered villages (tiny cube clusters).
  - **Rows 8-16 (Chandigarh/Kalka):** Foothills begin, elevation 2–5. Mix of green and rocky brown. Denser trees.
  - **Rows 0-8 (Shimla):** Mountain terrain, elevation 5–12. Rocky grey-brown, pine trees, snow-capped peaks at the very top. Steep gradients.
- Generate the heightmap in **Rust/WASM** using simplex/perlin noise, flatten it to `Float32Array`, pass to JS
- Render terrain as a displaced plane geometry or grid of boxes with vertex coloring based on elevation

### Three Stations (fixed positions on the map)

1. **🏛️ New Delhi** — Row ~35, center. Iconic reddish-orange station building. Flat area.
2. **🌳 Chandigarh** — Row ~20, slightly offset. Green-themed station. Moderate elevation.
3. **🏔️ Shimla** — Row ~3, nestled in mountains. Blue/stone-themed station. High elevation.

Each station should be a small 3D model (boxes + domes + platforms — keep it simple but charming). Show station names as `<Html>` labels from drei.

### Track Building Mechanics

- **Click cells** to toggle track pieces on/off
- Tracks should auto-orient: show straight rails if neighbors are linear, curved if turning (even simple 90° bends are fine)
- Visual: wooden ties + metallic rails + gravel ballast bed, all sitting on the terrain surface
- **Gradient constraint:** tracks can't go up more than X elevation units per cell (the Rust validator checks this). If a placement is invalid, flash the cell red briefly.
- **Right-click drag** to orbit camera, **scroll** to zoom

### Train Ride

- "🚂 Depart" button — calls the Rust/WASM pathfinder to find the optimal path from Delhi → Chandigarh → Shimla through placed tracks
- If no valid path exists, show a toast: "Track incomplete! Connect all stations."
- If valid: animate a cute low-poly train along the path
  - Train = engine (dark blue body, saffron stripe, small chimney) + 1-2 carriages
  - Smooth interpolation between cells, train banks slightly on curves
  - Camera has a "follow mode" toggle — chase cam behind the train vs free orbit
  - Show a progress bar: Delhi ——●—— Chandigarh ——○—— Shimla
  - When passing each station, trigger a small celebration (particle burst, station name popup)

### Visual Style: Realistic-ish yet Cartoonish

- **Low-poly but warm** — think a hand-painted miniature diorama
- Soft shadows, warm golden-hour lighting (late afternoon Indian sun)
- Slight tilt-shift / depth of field effect (drei's `<EffectComposer>` + `<DepthOfField>`)
- Color palette: saffron, forest green, earthy browns, sky blue — Indian flag vibes without being literal
- Cartoon-scale proportions: chunky trees, slightly oversized stations, toy-like train
- Subtle ambient particles: dust motes in plains, mist in mountains

### UI Overlay

- **Top bar:** Game title "WIZRAILS" with a tricolor gradient (saffron → white → green), track count, total cost
- **Right sidebar:** Station checklist (✅ connected / ⬜ not yet) 
- **Bottom bar:** Tool selector (place track / remove track / bulldoze area), Depart button, Clear All
- **Optional fun:** A budget system — you start with ₹100 crore, each track piece costs more at higher elevations (mountain tracks are expensive!). Display remaining budget. If you run out, you gotta optimize your route.

### Rust/WASM Module Structure

```
wasm-engine/
├── Cargo.toml          # wasm-pack, noise crate, serde
├── src/
│   ├── lib.rs          # wasm_bindgen exports
│   ├── terrain.rs      # heightmap generation (simplex noise)
│   ├── pathfinder.rs   # A* pathfinding with elevation cost
│   └── validator.rs    # track connectivity + gradient checks
```

Expose these functions to JS via `wasm_bindgen`:
- `generate_terrain(width, height, seed) -> Float32Array` (heightmap)
- `find_path(tracks: &[u32], stations: &[u32], width, height, heightmap: &[f32]) -> Vec<u32>` (returns cell indices of optimal path)
- `validate_track(tracks: &[u32], heightmap: &[f32], max_gradient: f32) -> ValidationResult` (returns which placements are invalid and why)

### Getting Started

1. Scaffold with `npm create vite@latest wizrails -- --template react-ts`
2. Install: `npm i @react-three/fiber @react-three/drei three zustand @types/three`
3. Set up wasm-pack: `cargo install wasm-pack`, create `wasm-engine/` crate
4. Build WASM: `cd wasm-engine && wasm-pack build --target web`
5. Import in React: `import init, { generate_terrain, find_path } from '../wasm-engine/pkg'`

Start with terrain rendering + click-to-place tracks, then add pathfinding, then the train animation. Layer in polish (particles, sound, camera effects) as time allows.

### Stretch Goals (if you finish early on the ride)

- **Day/night cycle** — sun moves across the sky, warm sunrise over Delhi, cool blue moonlight over Shimla
- **Sound design** — chugging train sounds, whistle at stations, ambient birds/wind
- **Tunnel pieces** — special track type that goes through mountains instead of over them (cheaper but limited)
- **Historical info popups** — when the train passes landmarks, show a small card about the real Kalka-Shimla railway (UNESCO World Heritage!)
- **Leaderboard** — fewest tracks used, lowest budget, fastest route
