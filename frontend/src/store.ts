import { create } from 'zustand';

export type Tool = 'place' | 'remove' | 'bulldoze';
export type GameMode = 'building' | 'riding';
export type CameraMode = 'free' | 'follow';

export interface StationInfo {
  name: string;
  row: number;
  col: number;
  color: string;
  connected: boolean;
}

export interface GameState {
  // Grid
  gridWidth: number;
  gridHeight: number;
  heightmap: Float32Array | null;

  // Tracks
  tracks: Set<number>;
  invalidCells: Set<number>;
  flashCells: Map<number, number>; // cell -> timestamp

  // Stations
  stations: StationInfo[];

  // Tool
  activeTool: Tool;

  // Budget
  budget: number;
  totalCost: number;

  // Game mode
  gameMode: GameMode;
  cameraMode: CameraMode;

  // Train
  trainPath: number[];
  trainProgress: number; // 0..1
  trainRunning: boolean;
  currentStationIndex: number;

  // Toast
  toast: string | null;

  // Actions
  setHeightmap: (hm: Float32Array) => void;
  toggleTrack: (cell: number) => void;
  removeTrack: (cell: number) => void;
  setActiveTool: (tool: Tool) => void;
  setInvalidCells: (cells: number[]) => void;
  setTrainPath: (path: number[]) => void;
  setTrainProgress: (p: number) => void;
  setTrainRunning: (running: boolean) => void;
  setGameMode: (mode: GameMode) => void;
  setCameraMode: (mode: CameraMode) => void;
  setCurrentStationIndex: (idx: number) => void;
  setStationConnected: (idx: number, connected: boolean) => void;
  setToast: (msg: string | null) => void;
  clearAllTracks: () => void;
  addFlashCell: (cell: number) => void;
}

const GRID_WIDTH = 24;
const GRID_HEIGHT = 40;
const INITIAL_BUDGET = 100; // in crore

function getTrackCost(cell: number, heightmap: Float32Array | null): number {
  if (!heightmap) return 1;
  const elev = heightmap[cell] || 0;
  // Base cost + elevation multiplier
  return 0.5 + elev * 0.3;
}

export const useGameStore = create<GameState>((set, get) => ({
  gridWidth: GRID_WIDTH,
  gridHeight: GRID_HEIGHT,
  heightmap: null,

  tracks: new Set<number>(),
  invalidCells: new Set<number>(),
  flashCells: new Map<number, number>(),

  stations: [
    { name: 'New Delhi', row: 35, col: 12, color: '#E65100', connected: false },
    { name: 'Chandigarh', row: 20, col: 10, color: '#2E7D32', connected: false },
    { name: 'Shimla', row: 3, col: 12, color: '#1565C0', connected: false },
  ],

  activeTool: 'place',
  budget: INITIAL_BUDGET,
  totalCost: 0,

  gameMode: 'building',
  cameraMode: 'free',

  trainPath: [],
  trainProgress: 0,
  trainRunning: false,
  currentStationIndex: 0,

  toast: null,

  setHeightmap: (hm) => set({ heightmap: hm }),

  toggleTrack: (cell) => {
    const state = get();
    const newTracks = new Set(state.tracks);
    if (newTracks.has(cell)) {
      newTracks.delete(cell);
      const cost = getTrackCost(cell, state.heightmap);
      set({ tracks: newTracks, totalCost: Math.max(0, state.totalCost - cost) });
    } else {
      const cost = getTrackCost(cell, state.heightmap);
      if (state.totalCost + cost > state.budget) {
        set({ toast: 'Budget exceeded! Remove some tracks.' });
        return;
      }
      newTracks.add(cell);
      set({ tracks: newTracks, totalCost: state.totalCost + cost });
    }
  },

  removeTrack: (cell) => {
    const state = get();
    const newTracks = new Set(state.tracks);
    if (newTracks.has(cell)) {
      newTracks.delete(cell);
      const cost = getTrackCost(cell, state.heightmap);
      set({ tracks: newTracks, totalCost: Math.max(0, state.totalCost - cost) });
    }
  },

  setActiveTool: (tool) => set({ activeTool: tool }),
  setInvalidCells: (cells) => set({ invalidCells: new Set(cells) }),
  setTrainPath: (path) => set({ trainPath: path }),
  setTrainProgress: (p) => set({ trainProgress: p }),
  setTrainRunning: (running) => set({ trainRunning: running }),
  setGameMode: (mode) => set({ gameMode: mode }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setCurrentStationIndex: (idx) => set({ currentStationIndex: idx }),
  setStationConnected: (idx, connected) => {
    const stations = [...get().stations];
    stations[idx] = { ...stations[idx], connected };
    set({ stations });
  },
  setToast: (msg) => set({ toast: msg }),
  clearAllTracks: () => set({ tracks: new Set(), totalCost: 0, invalidCells: new Set() }),
  addFlashCell: (cell) => {
    const flashCells = new Map(get().flashCells);
    flashCells.set(cell, Date.now());
    set({ flashCells });
    setTimeout(() => {
      const current = new Map(get().flashCells);
      current.delete(cell);
      set({ flashCells: current });
    }, 500);
  },
}));
