// Random events system: cattle, fog, signal failure, chain pull, medical emergency

import type { GameEvent, EventType } from '../store';
import { useGameStore } from '../store';

interface EventTemplate {
  type: EventType;
  title: string;
  description: string;
  minKm: number;
  maxKm: number;
  duration: number; // seconds before auto-resolve
}

const EVENT_TEMPLATES: EventTemplate[] = [
  {
    type: 'cattle',
    title: 'Cattle on Tracks!',
    description: 'A cow is blocking the tracks. Brake immediately!',
    minKm: 20,
    maxKm: 200,
    duration: 8,
  },
  {
    type: 'fog',
    title: 'Dense Fog Patch',
    description: 'Visibility reduced. Slow down to 40 km/h.',
    minKm: 30,
    maxKm: 180,
    duration: 15,
  },
  {
    type: 'signalFailure',
    title: 'Signal Failure',
    description: 'Signal equipment malfunction. Proceed at 15 km/h with caution.',
    minKm: 40,
    maxKm: 230,
    duration: 20,
  },
  {
    type: 'chainPull',
    title: 'Chain Pulling!',
    description: 'Someone pulled the emergency chain. Train auto-stopping. Investigate.',
    minKm: 60,
    maxKm: 240,
    duration: 12,
  },
  {
    type: 'medical',
    title: 'Medical Emergency',
    description: 'A passenger needs medical attention. Prepare for next station stop.',
    minKm: 50,
    maxKm: 250,
    duration: 25,
  },
];

export class EventEngine {
  private lastEventKm = 0;
  private nextEventKm = 0;
  private eventTimer = 0;
  private eventsTriggered = 0;

  constructor() {
    this.scheduleNextEvent();
  }

  private scheduleNextEvent() {
    // Random gap between events: 25-50 km
    this.nextEventKm = this.lastEventKm + 25 + Math.random() * 25;
  }

  update(dt: number) {
    const state = useGameStore.getState();
    if (state.phase !== 'running') return;

    const km = state.positionKm;

    // Handle active event
    if (state.activeEvent && state.activeEvent.active) {
      this.eventTimer += dt;

      // Auto-resolve chain pull: stop the train
      if (state.activeEvent.type === 'chainPull' && state.speedKmh > 0) {
        state.setBraking(true);
      }

      // Check if event should resolve
      const template = EVENT_TEMPLATES.find((t) => t.type === state.activeEvent!.type);
      if (template && this.eventTimer >= template.duration) {
        state.setActiveEvent({
          ...state.activeEvent,
          active: false,
          resolved: true,
        });
        state.setToast(null);
        this.eventTimer = 0;
        this.scheduleNextEvent();
      }
      return;
    }

    // Check if we should trigger a new event
    if (km >= this.nextEventKm && this.eventsTriggered < 6) {
      this.triggerRandomEvent(km);
    }
  }

  private triggerRandomEvent(km: number) {
    const eligible = EVENT_TEMPLATES.filter(
      (t) => km >= t.minKm && km <= t.maxKm
    );
    if (eligible.length === 0) return;

    const template = eligible[Math.floor(Math.random() * eligible.length)];
    const event: GameEvent = {
      type: template.type,
      title: template.title,
      description: template.description,
      active: true,
      resolved: false,
      startKm: km,
    };

    const state = useGameStore.getState();
    state.setActiveEvent(event);
    state.setToast(`${template.title} — ${template.description}`);
    this.lastEventKm = km;
    this.eventsTriggered++;
    this.eventTimer = 0;
  }

  reset() {
    this.lastEventKm = 0;
    this.eventsTriggered = 0;
    this.eventTimer = 0;
    this.scheduleNextEvent();
  }
}
