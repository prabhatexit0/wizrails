import { create } from 'zustand';

// ── Route & Station Data ──

export interface StationData {
  name: string;
  code: string;
  km: number;
  scheduledArrival: string; // HH:MM
  scheduledDeparture: string;
  haltMinutes: number;
  platformCount: number;
  description: string;
}

export const STATIONS: StationData[] = [
  {
    name: 'New Delhi',
    code: 'NDLS',
    km: 0,
    scheduledArrival: '17:00',
    scheduledDeparture: '17:15',
    haltMinutes: 0, // origin
    platformCount: 16,
    description: 'Indo-Islamic arched facade, cream-and-red exterior',
  },
  {
    name: 'Panipat Junction',
    code: 'PNP',
    km: 90,
    scheduledArrival: '18:18',
    scheduledDeparture: '18:20',
    haltMinutes: 2,
    platformCount: 5,
    description: 'Textile City, IOC Refinery nearby',
  },
  {
    name: 'Kurukshetra Junction',
    code: 'KKDE',
    km: 157,
    scheduledArrival: '19:00',
    scheduledDeparture: '19:02',
    haltMinutes: 2,
    platformCount: 4,
    description: 'Mahabharata battleground, pilgrimage town',
  },
  {
    name: 'Ambala Cantonment',
    code: 'UMB',
    km: 199,
    scheduledArrival: '19:50',
    scheduledDeparture: '19:53',
    haltMinutes: 3,
    platformCount: 6,
    description: 'Major junction, Indian Army base',
  },
  {
    name: 'Chandigarh',
    code: 'CDG',
    km: 266,
    scheduledArrival: '20:30',
    scheduledDeparture: '20:30',
    haltMinutes: 0, // terminal
    platformCount: 7,
    description: "Le Corbusier's planned city, Shivalik Hills",
  },
];

export const TOTAL_ROUTE_KM = 266;

// ── Signal ──

export type SignalColor = 'green' | 'yellow' | 'red';

export interface Signal {
  km: number;
  color: SignalColor;
  blockId: number;
}

// ── NPC ──

export type NPCType =
  | 'business'
  | 'family'
  | 'pilgrim'
  | 'student'
  | 'army'
  | 'foodBlogger'
  | 'tourist';

export type NPCMood = 'happy' | 'neutral' | 'unhappy';

export interface NPC {
  id: number;
  type: NPCType;
  boardingStation: number; // index into STATIONS
  seatIndex: number;
  mood: NPCMood;
  rating: number; // 1-5, calculated at end
  preferences: {
    punctuality: number;
    safety: number;
    comfort: number;
    food: number;
  };
}

// ── Random Events ──

export type EventType =
  | 'cattle'
  | 'fog'
  | 'signalFailure'
  | 'chainPull'
  | 'medical';

export interface GameEvent {
  type: EventType;
  title: string;
  description: string;
  active: boolean;
  resolved: boolean;
  startKm: number;
}

// ── Game Phase ──

export type GamePhase =
  | 'menu'
  | 'preDeparture'
  | 'running'
  | 'stationStop'
  | 'results'
  | 'accident'
  | 'paused';

// ── Game State ──

export interface GameState {
  // Game phase
  phase: GamePhase;
  previousPhase: GamePhase; // for pause/resume

  // Train state
  positionKm: number;
  speedKmh: number;
  throttle: number; // 0..1
  isBraking: boolean;
  maxSpeed: number; // current zone limit

  // Game clock — minutes since midnight
  currentTime: number; // e.g., 17*60+15 = 1035 for 17:15
  timeScale: number; // 1 = real time mapping

  // Signals
  signals: Signal[];
  nextSignalIndex: number;

  // Station stop
  currentStationIndex: number; // which station we're at or approaching
  haltTimeRemaining: number; // seconds
  stationArrivals: (number | null)[]; // actual arrival times (minutes since midnight)

  // Passengers
  passengers: NPC[];
  nextNpcId: number;

  // Scoring
  reputationScore: number; // 0-5
  safetyViolations: number;
  signalViolationsCount: number;
  overspeedCount: number;
  hardBrakeCount: number;
  totalFuelUsed: number;

  // Random events
  activeEvent: GameEvent | null;

  // Toast notifications
  toast: string | null;

  // Overlay
  showTutorial: boolean;
  showInterior: boolean;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setThrottle: (t: number) => void;
  setBraking: (b: boolean) => void;
  setSpeedKmh: (s: number) => void;
  setPositionKm: (km: number) => void;
  setCurrentTime: (t: number) => void;
  setMaxSpeed: (s: number) => void;
  setSignals: (s: Signal[]) => void;
  setNextSignalIndex: (i: number) => void;
  setCurrentStationIndex: (i: number) => void;
  setHaltTimeRemaining: (t: number) => void;
  recordStationArrival: (stationIndex: number, time: number) => void;
  addPassenger: (npc: Omit<NPC, 'id'>) => void;
  removePassengersAt: (stationIndex: number) => void;
  updatePassengerMoods: () => void;
  setReputationScore: (s: number) => void;
  incrementSafetyViolation: () => void;
  incrementSignalViolation: () => void;
  incrementOverspeed: () => void;
  incrementHardBrake: () => void;
  addFuel: (amount: number) => void;
  setActiveEvent: (e: GameEvent | null) => void;
  setToast: (msg: string | null) => void;
  setShowTutorial: (v: boolean) => void;
  setShowInterior: (v: boolean) => void;
  resetGame: () => void;
}

function initialTime(): number {
  // 17:15
  return 17 * 60 + 15;
}

const INITIAL_STATE = {
  phase: 'menu' as GamePhase,
  previousPhase: 'menu' as GamePhase,
  positionKm: 0,
  speedKmh: 0,
  throttle: 0,
  isBraking: false,
  maxSpeed: 130,
  currentTime: initialTime(),
  timeScale: 1,
  signals: [] as Signal[],
  nextSignalIndex: 0,
  currentStationIndex: 0,
  haltTimeRemaining: 0,
  stationArrivals: [null, null, null, null, null] as (number | null)[],
  passengers: [] as NPC[],
  nextNpcId: 1,
  reputationScore: 5,
  safetyViolations: 0,
  signalViolationsCount: 0,
  overspeedCount: 0,
  hardBrakeCount: 0,
  totalFuelUsed: 0,
  activeEvent: null as GameEvent | null,
  toast: null as string | null,
  showTutorial: false,
  showInterior: false,
};

export const useGameStore = create<GameState>((set, get) => ({
  ...INITIAL_STATE,

  setPhase: (phase) => {
    const prev = get().phase;
    set({ phase, previousPhase: prev });
  },
  setThrottle: (throttle) => set({ throttle: Math.max(0, Math.min(1, throttle)) }),
  setBraking: (isBraking) => set({ isBraking }),
  setSpeedKmh: (speedKmh) => set({ speedKmh: Math.max(0, speedKmh) }),
  setPositionKm: (positionKm) => set({ positionKm }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setMaxSpeed: (maxSpeed) => set({ maxSpeed }),
  setSignals: (signals) => set({ signals }),
  setNextSignalIndex: (nextSignalIndex) => set({ nextSignalIndex }),
  setCurrentStationIndex: (currentStationIndex) => set({ currentStationIndex }),
  setHaltTimeRemaining: (haltTimeRemaining) => set({ haltTimeRemaining }),
  recordStationArrival: (stationIndex, time) => {
    const arrivals = [...get().stationArrivals];
    arrivals[stationIndex] = time;
    set({ stationArrivals: arrivals });
  },
  addPassenger: (npc) => {
    const id = get().nextNpcId;
    set({
      passengers: [...get().passengers, { ...npc, id }],
      nextNpcId: id + 1,
    });
  },
  removePassengersAt: (stationIndex) => {
    set({
      passengers: get().passengers.filter(
        (p) => p.boardingStation !== stationIndex
      ),
    });
  },
  updatePassengerMoods: () => {
    const state = get();
    const passengers = state.passengers.map((p) => {
      let score = 3;
      if (state.safetyViolations > 2) score -= 1;
      if (state.overspeedCount > 3) score -= 0.5;
      if (state.reputationScore > 4) score += 1;
      const mood: NPCMood = score >= 3.5 ? 'happy' : score >= 2 ? 'neutral' : 'unhappy';
      return { ...p, mood };
    });
    set({ passengers });
  },
  setReputationScore: (reputationScore) => set({ reputationScore }),
  incrementSafetyViolation: () =>
    set({ safetyViolations: get().safetyViolations + 1 }),
  incrementSignalViolation: () =>
    set({ signalViolationsCount: get().signalViolationsCount + 1 }),
  incrementOverspeed: () => set({ overspeedCount: get().overspeedCount + 1 }),
  incrementHardBrake: () => set({ hardBrakeCount: get().hardBrakeCount + 1 }),
  addFuel: (amount) => set({ totalFuelUsed: get().totalFuelUsed + amount }),
  setActiveEvent: (activeEvent) => set({ activeEvent }),
  setToast: (toast) => set({ toast }),
  setShowTutorial: (showTutorial) => set({ showTutorial }),
  setShowInterior: (showInterior) => set({ showInterior }),

  resetGame: () => set({ ...INITIAL_STATE }),
}));

// ── Helper: format time ──
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// ── Helper: parse HH:MM to minutes ──
export function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
