// Signal system: generates block signals along the route and manages their state

import type { Signal, SignalColor } from '../store';
import { useGameStore } from '../store';

const SIGNAL_INTERVAL_KM = 7; // signal every ~7 km
const TOTAL_KM = 266;

export class SignalEngine {
  private lastUpdateTime = 0;
  private initialized = false;

  initialize() {
    if (this.initialized) return;
    this.initialized = true;

    const signals: Signal[] = [];
    let blockId = 0;
    for (let km = SIGNAL_INTERVAL_KM; km < TOTAL_KM; km += SIGNAL_INTERVAL_KM) {
      signals.push({
        km,
        color: 'green',
        blockId: blockId++,
      });
    }

    useGameStore.getState().setSignals(signals);
    useGameStore.getState().setNextSignalIndex(0);
  }

  update(dt: number) {
    const state = useGameStore.getState();
    if (state.phase !== 'running' && state.phase !== 'stationStop') return;

    this.lastUpdateTime += dt;
    if (this.lastUpdateTime < 2) return; // update every 2 seconds
    this.lastUpdateTime = 0;

    const km = state.positionKm;
    const signals = state.signals.map((s) => ({ ...s }));
    let changed = false;

    for (let i = 0; i < signals.length; i++) {
      const signal = signals[i];
      const distAhead = signal.km - km;

      // Simulate other train traffic
      // Signals well ahead are usually green
      // Occasionally a signal goes yellow or red to simulate block occupancy
      const prevColor = signal.color;
      let newColor: SignalColor = 'green';

      if (distAhead > 0 && distAhead < 30) {
        // Use deterministic pseudo-random based on block ID and time
        const seed = Math.sin(signal.blockId * 127.1 + Math.floor(state.currentTime / 3) * 43.7) * 43758.5453;
        const rand = seed - Math.floor(seed);

        if (rand < 0.08) {
          newColor = 'red';
        } else if (rand < 0.2) {
          newColor = 'yellow';
        }
      }

      if (newColor !== prevColor) {
        signal.color = newColor;
        changed = true;
      }
    }

    if (changed) {
      state.setSignals(signals);
    }
  }

  reset() {
    this.initialized = false;
    this.lastUpdateTime = 0;
  }
}
