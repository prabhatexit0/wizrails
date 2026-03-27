# Wizrails — 2D Pixel Retro Train Simulator

## Core Concept

A **2D pixel-art retro-style** train management game set on the **New Delhi → Chandigarh Shatabdi Express** route. The player is the train operator — managing the train interior, scheduling departures, handling signals, avoiding accidents, and keeping passengers happy.

The route is **pre-built and fixed** — the player does NOT build tracks. Instead, the game is about **running the railway**: operating the train, managing its interior, dealing with NPCs, and mastering the operational challenges of Indian rail.

The scenery scrolling by the window should feel **rich, authentic, and atmospheric** — like you're actually looking out the window of the Shatabdi Express as it races from Delhi's urban sprawl through Haryana's golden fields to Chandigarh's planned-city greenery.

---

## Tech Stack

- **React 18+ with TypeScript** (Vite)
- **Zustand** for game state management
- **Canvas 2D** for pixel-art rendering (NOT WebGL/Three.js — keep it retro)
- **Rust → WASM** (via `wasm-pack`) for:
  - **Signal logic engine** — manages train signals, block sections, and collision detection
  - **Scheduling engine** — calculates delays, punctuality scores, optimal speed profiles
  - **Pathfinding/routing** — for NPC movement within train carriages
- Everything else (rendering, UI, input) stays in TypeScript/React

---

## The Route: New Delhi → Chandigarh (Shatabdi Express)

The route is **266 km**, taking about **3 hours 15 minutes**. It passes through 5 real stations. The entire route is pre-built — the player just operates the train along it.

### Stations (in order, with real data)

1. **New Delhi (NDLS)** — KM 0
   - Starting station. 16 platforms, Indo-Islamic arched facade, cream-and-red exterior
   - Platform chaos: coolies in red shirts, chai wallahs, samosa vendors, families with luggage
   - Dense urban Delhi visible — apartment blocks, metro viaducts, signal gantries
   - Departure time: 17:15

2. **Panipat Junction (PNP)** — KM 90
   - 2-minute halt. 5 platforms, modest colonial-era building
   - Historic battleground city, known as "Textile City"
   - IOC Panipat Refinery visible — flare stacks, distillation towers
   - Arrival: 18:18

3. **Kurukshetra Junction (KKDE)** — KM 157
   - 2-minute halt. Junction station, pilgrimage-town feel
   - Mahabharata battleground, Brahma Sarovar nearby
   - More temples and religious signage around station
   - Arrival: 19:00

4. **Ambala Cantonment (UMB)** — KM 199
   - 3-minute halt. One of India's busiest junctions (~300 trains/day)
   - Major Indian Army base — military character, cantonment gardens
   - Colonial-era architecture, famous Ambala sweets
   - Arrival: 19:50

5. **Chandigarh (CDG)** — KM 266
   - Terminal station. Modern, clean, organized (Le Corbusier's planned city)
   - Shivalik Hills visible on northern horizon — blue-green mountain line
   - Arrival: 20:30

### Scenery Between Stations (scrolling parallax backgrounds)

**Delhi → Panipat (KM 0-90):**
- Delhi rail yards → Yamuna river bridge (wide sandy floodplain) → brick kilns with tall chimneys → endless wheat/mustard fields (golden/yellow) → GT Road with trucks running parallel → canal crossings → IOC Panipat Refinery (industrial skyline)
- Color palette: grey concrete → dusty brown → golden-green fields
- Time: Late afternoon golden sunlight

**Panipat → Kurukshetra (KM 90-157):**
- Greener, more irrigated farmland → sugarcane fields (tall green walls) → Markanda River (seasonal sandy bed) → tube-well pump houses → larger villages with brick-and-concrete houses → dharamshalas and ashrams appearing
- Color palette: lush greens, earthy browns
- Time: Approaching sunset, warm orange light

**Kurukshetra → Ambala (KM 157-199):**
- Soil shifts to reddish-brown → Ghaggar River crossing (wide seasonal bed) → more trees (neem, sheesham, mango groves, eucalyptus) → military cantonment buildings and barracks → ordnance depots
- Color palette: green with reddish-brown earth, military khaki
- Time: Sunset, golden-to-purple sky

**Ambala → Chandigarh (KM 199-266):**
- Landscape transforms — flat plains give way to undulating terrain → Shivalik foothills appear on horizon → denser vegetation → reddish laterite soil → Chandigarh's wide boulevards and organized sectors → abundant greenery
- Color palette: rich greens, blue-grey hills, modern whites
- Time: Dusk, deep blue sky with city lights

---

## Game Modes

### 1. Train Interior Management (Core Loop)

The player sees a **side-view cross-section** of the Shatabdi Express — 2-3 carriages visible at a time, scrollable. Each carriage has:

- **Seats** (AC Chair Car layout — 2+2 or 2+3 seating)
- **Pantry car** — where food is prepared and loaded
- **Vestibule areas** — between carriages, where passengers stand, vendors pass through
- **Luggage racks** — overhead storage
- **Windows** — showing the scrolling scenery outside

**Player actions in train interior:**
- Arrange seating layout (upgrade/downgrade seat quality)
- Set up food service (choose menu items, timing of service)
- Manage cleanliness (assign cleaning at stations)
- Handle AC temperature settings
- Place amenities: charging points, reading lights, curtains, blankets
- Emergency equipment placement

### 2. NPC Passenger System

Random NPC passengers board at each station with different preferences and expectations:

**NPC Types:**
- **Business Traveler** — wants quiet, charging points, good WiFi, on-time arrival. Rates punctuality highly.
- **Family with Kids** — wants window seats, snacks, spacious area. Rates food and comfort.
- **Elderly Pilgrim** — boarding at Kurukshetra, wants lower berth equivalent, easy access. Rates accessibility.
- **College Students** — group, wants cheap tickets, doesn't mind crowding. Rates value.
- **Army Officer** — boarding at Ambala, wants discipline and order. Rates cleanliness and punctuality.
- **Food Blogger** — rates the pantry food quality extensively. Their review affects future bookings.
- **Foreign Tourist** — fascinated by everything, rates the "experience" — scenery visibility, cultural touches.

**Rating System:**
- Each NPC rates the journey 1-5 stars based on their preferences
- Ratings affect your **Railway Reputation Score** (displayed prominently)
- High reputation = more premium passengers = more revenue
- Low reputation = complaints, fewer bookings, potential "show cause notice" from Railway Board

### 3. Operations & Skill Challenges

**Signal Management:**
- The route has block sections with signals (red/yellow/green)
- Player must watch for signals and respond appropriately
- Red signal = STOP. Missing a red signal = accident (game over scenario)
- Yellow signal = slow down, prepare to stop
- Green signal = proceed at full speed
- Signals change based on track occupancy (other trains on the route)

**Scheduling & Punctuality:**
- Each station has a target arrival/departure time
- Player controls speed (but higher speed = more fuel cost)
- Arriving late loses reputation; arriving too early means waiting
- Random events cause delays: cattle on tracks, fog (common in Haryana winter), signal failures, medical emergencies
- Player must decide: speed up to recover time (risky, costly) or accept the delay

**Speed Management:**
- Speed zones: 130 km/h max on straight sections, 60 km/h through stations, slower on curves
- Overspeeding triggers warnings and potential derailment risk
- Fuel efficiency scoring — optimal speed management earns bonus

**Accident Avoidance:**
- Level crossings with vehicles/pedestrians
- Other trains at junctions (especially Ambala Junction — 300 trains/day!)
- Weather events: fog reduces visibility, rain makes tracks slippery
- Animals on tracks (cows, dogs — very real in India)

### 4. Station Operations

At each station stop:
- Passengers board/alight (animated pixel NPCs)
- Player can trigger announcements
- Quick maintenance tasks (water refill, cleaning)
- Food loading from station vendors
- Timer shows remaining halt time — depart on time!

---

## Visual Style: 2D Pixel Retro

- **Resolution feel:** 320×180 base resolution, scaled up (like classic SNES/GBA games)
- **Pixel art style:** Warm, detailed pixel art. 16-32px character sprites. Rich backgrounds.
- **Color palette:** Warm Indian tones — saffron, earthy browns, forest greens, dusty golds, deep blues
- **Parallax scrolling:** 3-4 layers of background scenery scrolling at different speeds
  - Far background: sky, clouds, distant hills/city skyline
  - Mid background: fields, trees, buildings, landmarks
  - Near background: trackside elements — signals, poles, fences, platforms
  - Foreground: the train itself, tracks, nearby objects
- **Day progression:** Sky color changes from golden afternoon (Delhi) → sunset (Kurukshetra) → dusk (Chandigarh)
- **Weather effects:** Dust haze in plains, evening mist near Chandigarh (pixel-art particle effects)
- **UI:** Retro pixel font, bordered panels, CRT-style scanline overlay (subtle, toggleable)

---

## UI Layout

### Main Game View
- **Top 60% of screen:** Scrolling scenery / train exterior view OR train interior cross-section (toggle between them)
- **Bottom 40%:** Control panel

### Control Panel (Bottom)
- **Speed control:** Throttle slider (0% to 100%) + brake button
- **Current speed** display (km/h) + speed limit indicator
- **Signal indicator:** Shows next signal color and distance
- **Station info:** Next station name, ETA, distance remaining
- **Reputation score:** Star rating (updated live)
- **Mini-map:** Simple line showing Delhi—Panipat—Kurukshetra—Ambala—Chandigarh with current position dot
- **Clock:** Current in-game time

### Station Screen (during halts)
- Platform view — pixel art station with NPCs boarding/alighting
- Passenger manifest panel — who's boarding, their type, preferences
- Quick action buttons: Clean, Refill Water, Load Food, Make Announcement
- Departure countdown timer

### Train Interior View (toggleable)
- Side-view cross-section of carriages
- Clickable seats/areas for management
- NPC passengers visible with mood indicators (emoji-style pixel icons)
- Pantry car operations

---

## Game Flow

1. **Start Screen:** "WIZRAILS" title in pixel font, train animation, "Start Journey" button
2. **Pre-departure (New Delhi):** Set up train interior, check passenger manifest, prepare food service
3. **Journey begins:** Train departs New Delhi at 17:15
4. **Between stations:** Manage speed, watch signals, enjoy scenery, handle random events
5. **Station stops:** Quick operations — passengers in/out, maintenance, depart on time
6. **Journey end (Chandigarh):** Final ratings from all passengers, journey summary, score
7. **Results screen:** Total reputation, punctuality score, fuel efficiency, passenger satisfaction breakdown, revenue earned

---

## Revenue & Progression

- Earn revenue from ticket sales (based on reputation and class of service)
- Spend on train upgrades: better seats, pantry equipment, amenities
- Unlock cosmetic upgrades: train livery colors, station decorations
- Progressive difficulty: later runs have more random events, tighter schedules, pickier passengers

---

## Random Events (keep gameplay dynamic)

- Cattle on tracks — brake hard or use horn
- Fog patch — reduced visibility, must slow down
- Signal failure — proceed with caution at restricted speed
- Medical emergency — passenger needs help, decide to stop or call ahead
- Chain pulling — someone pulls emergency chain, investigate
- VIP passenger — Railway Minister is onboard, everything must be perfect
- Food complaint — passenger finds something wrong, handle diplomatically
- Track maintenance — speed restriction zone
- Monsoon flooding — waterlogged tracks, reduced speed

---

## Audio (stretch goal)

- Rhythmic train chugging sound (changes with speed)
- Station announcements in Hindi/English (pixel-style beeps or real audio)
- Whistle at departures and level crossings
- Ambient sounds: wind, birds (plains), evening crickets (dusk)
- Signal bell sounds
- NPC reaction sounds (happy chime, angry buzz)

---

## Rust/WASM Module Structure

```
wasm-engine/
├── Cargo.toml
├── src/
│   ├── lib.rs           # wasm_bindgen exports
│   ├── signals.rs       # Block signal logic, track occupancy
│   ├── scheduler.rs     # Timetable, delay calculation, punctuality scoring
│   ├── physics.rs       # Speed, braking distance, fuel consumption
│   └── npc.rs           # NPC preference matching, rating calculation
```

Expose to JS:
- `check_signal(position, speed, block_occupancy) -> SignalState`
- `calculate_arrival(current_pos, speed, target_station) -> ArrivalInfo`
- `calculate_rating(npc_prefs, journey_stats) -> Rating`
- `check_collision(train_pos, obstacles) -> CollisionResult`
- `calculate_fuel(speed_history, distance) -> FuelStats`

---

## Auto-Builders / Templates

The New Delhi → Chandigarh route comes **fully pre-built** with:
- All 5 stations placed with accurate-ish distances
- Scenery layers for each segment pre-configured
- Signal blocks placed at realistic intervals
- Speed zones marked
- A default "Standard Shatabdi" train template:
  - 1 Executive AC Chair Car
  - 7 AC Chair Cars
  - 1 Pantry Car
  - Pre-set food menu (Shatabdi meals are included in ticket price)

The player can customize the train interior but the route infrastructure is ready to play immediately.

---

## Getting Started (for AI agent implementing this)

1. **Rip out all 3D code** — remove React Three Fiber, drei, postprocessing, Three.js dependencies
2. **Keep** Zustand, Vite, React, TypeScript, and the Rust/WASM setup
3. **Add** HTML Canvas 2D rendering system with a game loop
4. **Build in order:**
   - Canvas rendering system + game loop
   - Parallax scrolling backgrounds (scenery)
   - Train exterior rendering (pixel art train moving along tracks)
   - Speed/throttle controls + signal system
   - Station stops with timers
   - Train interior view (cross-section)
   - NPC passenger system + ratings
   - Random events
   - Polish: day/night progression, weather, sound
5. **Pixel art:** Generate programmatically where possible (geometric shapes, gradients), use hand-crafted sprites for key elements (train, characters, stations)
6. **WASM module:** Update Rust code — remove terrain generation, add signal/scheduler/physics engines

### Important Implementation Notes
- The canvas should be responsive but maintain pixel-perfect scaling
- Use `requestAnimationFrame` for the game loop, not React re-renders for animation
- Keep React for UI overlay (HUD, menus, dialogs) on top of the canvas
- Game state in Zustand, rendering reads from Zustand store
- Pixel art scale: render at low res (e.g., 480×270) and CSS scale up with `image-rendering: pixelated`
