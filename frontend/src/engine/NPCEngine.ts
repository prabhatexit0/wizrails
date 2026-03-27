// NPC passenger system — manages boarding, preferences, moods, and ratings

import type { NPCType } from '../store';
import { useGameStore, STATIONS } from '../store';

interface NPCTemplate {
  type: NPCType;
  label: string;
  boardsAt: number[]; // station indices where they can board
  preferences: { punctuality: number; safety: number; comfort: number; food: number };
}

const NPC_TEMPLATES: NPCTemplate[] = [
  {
    type: 'business',
    label: 'Business Traveler',
    boardsAt: [0, 1],
    preferences: { punctuality: 0.5, safety: 0.2, comfort: 0.2, food: 0.1 },
  },
  {
    type: 'family',
    label: 'Family with Kids',
    boardsAt: [0, 1, 2],
    preferences: { punctuality: 0.1, safety: 0.3, comfort: 0.3, food: 0.3 },
  },
  {
    type: 'pilgrim',
    label: 'Elderly Pilgrim',
    boardsAt: [2],
    preferences: { punctuality: 0.1, safety: 0.2, comfort: 0.5, food: 0.2 },
  },
  {
    type: 'student',
    label: 'College Students',
    boardsAt: [0, 1, 3],
    preferences: { punctuality: 0.2, safety: 0.1, comfort: 0.2, food: 0.5 },
  },
  {
    type: 'army',
    label: 'Army Officer',
    boardsAt: [3],
    preferences: { punctuality: 0.4, safety: 0.3, comfort: 0.2, food: 0.1 },
  },
  {
    type: 'foodBlogger',
    label: 'Food Blogger',
    boardsAt: [0],
    preferences: { punctuality: 0.1, safety: 0.1, comfort: 0.1, food: 0.7 },
  },
  {
    type: 'tourist',
    label: 'Foreign Tourist',
    boardsAt: [0],
    preferences: { punctuality: 0.1, safety: 0.3, comfort: 0.4, food: 0.2 },
  },
];

export class NPCEngine {
  private boardedAtStations: Set<number> = new Set();

  boardPassengers(stationIndex: number) {
    if (this.boardedAtStations.has(stationIndex)) return;
    this.boardedAtStations.add(stationIndex);

    const state = useGameStore.getState();
    const eligible = NPC_TEMPLATES.filter((t) => t.boardsAt.includes(stationIndex));

    // Board 2-4 random passengers per station
    const count = 2 + Math.floor(Math.random() * 3);
    let seatIndex = state.passengers.length;

    for (let i = 0; i < count && eligible.length > 0; i++) {
      const template = eligible[Math.floor(Math.random() * eligible.length)];
      state.addPassenger({
        type: template.type,
        boardingStation: stationIndex,
        seatIndex: seatIndex++,
        mood: 'neutral',
        rating: 3,
        preferences: { ...template.preferences },
      });
    }
  }

  calculateFinalRatings(): { npcRatings: { type: NPCType; rating: number }[]; average: number } {
    const state = useGameStore.getState();
    const passengers = state.passengers;

    // Scoring factors
    const punctualityScore = this.calculatePunctualityScore();
    const safetyScore = Math.max(0, 5 - state.safetyViolations * 1.5 - state.overspeedCount * 0.3);
    const comfortScore = Math.max(1, 5 - state.hardBrakeCount * 0.5);
    const foodScore = 3.5 + Math.random(); // base food score

    const npcRatings = passengers.map((p) => {
      const prefs = p.preferences;
      const raw =
        prefs.punctuality * punctualityScore +
        prefs.safety * safetyScore +
        prefs.comfort * comfortScore +
        prefs.food * foodScore;
      const rating = Math.max(1, Math.min(5, Math.round(raw * 10) / 10));
      return { type: p.type, rating };
    });

    const average = npcRatings.length > 0
      ? npcRatings.reduce((sum, r) => sum + r.rating, 0) / npcRatings.length
      : 3;

    return { npcRatings, average };
  }

  private calculatePunctualityScore(): number {
    const state = useGameStore.getState();
    let totalDelay = 0;
    let count = 0;

    for (let i = 1; i < STATIONS.length; i++) {
      const arrival = state.stationArrivals[i];
      if (arrival !== null) {
        const scheduled = parseTimeToMinutes(STATIONS[i].scheduledArrival);
        const delay = arrival - scheduled;
        totalDelay += Math.abs(delay);
        count++;
      }
    }

    if (count === 0) return 3;
    const avgDelay = totalDelay / count;
    // 0 min delay = 5 stars, 10+ min = 1 star
    return Math.max(1, 5 - avgDelay * 0.4);
  }

  reset() {
    this.boardedAtStations.clear();
  }
}

function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export const NPC_LABELS: Record<NPCType, string> = {
  business: 'Business',
  family: 'Family',
  pilgrim: 'Pilgrim',
  student: 'Student',
  army: 'Army Officer',
  foodBlogger: 'Food Blogger',
  tourist: 'Tourist',
};

export const NPC_COLORS: Record<NPCType, string> = {
  business: '#1565C0',
  family: '#E65100',
  pilgrim: '#F57F17',
  student: '#2E7D32',
  army: '#4E342E',
  foodBlogger: '#C62828',
  tourist: '#6A1B9A',
};
