// Train physics: acceleration, braking, speed zones, position advancement, game clock

import { useGameStore, STATIONS, TOTAL_ROUTE_KM } from '../store';

const ACCELERATION = 15; // km/h per second at full throttle
const BRAKE_DECEL = 25; // km/h per second when braking
const COAST_DECEL = 2; // km/h per second natural deceleration
const STATION_ZONE_KM = 2; // slow zone radius around stations
const STATION_SPEED_LIMIT = 60;
const OPEN_TRACK_SPEED = 130;

// Time mapping: real route is 3h15m (195 min) for 266 km
// We map game time so that the clock advances proportionally
const ROUTE_DURATION_MINUTES = 195;

export class PhysicsEngine {
  private overspeedWarning = false;
  private lastOverspeedNotify = 0;

  update(dt: number) {
    const state = useGameStore.getState();

    if (state.phase !== 'running') return;

    const { throttle, isBraking, speedKmh, positionKm } = state;

    // ── Determine speed limit for current position ──
    let speedLimit = OPEN_TRACK_SPEED;
    for (const station of STATIONS) {
      const dist = Math.abs(positionKm - station.km);
      if (dist < STATION_ZONE_KM && station.km > 0 && station.km < TOTAL_ROUTE_KM) {
        speedLimit = STATION_SPEED_LIMIT;
        break;
      }
    }

    // Check active event speed restrictions
    if (state.activeEvent) {
      if (state.activeEvent.type === 'fog') speedLimit = Math.min(speedLimit, 40);
      if (state.activeEvent.type === 'signalFailure') speedLimit = Math.min(speedLimit, 15);
    }

    // Check signal-based speed restriction
    if (state.signals.length > 0 && state.nextSignalIndex < state.signals.length) {
      const nextSignal = state.signals[state.nextSignalIndex];
      const distToSignal = nextSignal.km - positionKm;
      if (distToSignal > 0 && distToSignal < 1) {
        if (nextSignal.color === 'yellow') {
          speedLimit = Math.min(speedLimit, 60);
        } else if (nextSignal.color === 'red') {
          speedLimit = Math.min(speedLimit, 0);
        }
      }
    }

    state.setMaxSpeed(speedLimit);

    // ── Calculate new speed ──
    let newSpeed = speedKmh;

    if (isBraking) {
      newSpeed -= BRAKE_DECEL * dt;
      if (speedKmh > 30 && newSpeed < 30) {
        state.incrementHardBrake();
      }
    } else if (throttle > 0) {
      newSpeed += ACCELERATION * throttle * dt;
    } else {
      newSpeed -= COAST_DECEL * dt;
    }

    newSpeed = Math.max(0, newSpeed);

    // Overspeed warning (but don't clamp — let player get penalized)
    if (newSpeed > speedLimit + 5) {
      if (!this.overspeedWarning) {
        this.overspeedWarning = true;
        const now = Date.now();
        if (now - this.lastOverspeedNotify > 5000) {
          state.setToast(`OVERSPEED! Limit: ${speedLimit} km/h`);
          setTimeout(() => state.setToast(null), 2000);
          state.incrementOverspeed();
          this.lastOverspeedNotify = now;
        }
      }
    } else {
      this.overspeedWarning = false;
    }

    // Soft clamp: gradually reduce if over limit (drag)
    if (newSpeed > speedLimit) {
      newSpeed -= (newSpeed - speedLimit) * 0.5 * dt;
    }

    state.setSpeedKmh(newSpeed);

    // ── Advance position ──
    const kmPerSecond = newSpeed / 3600;
    const newPosition = Math.min(positionKm + kmPerSecond * dt, TOTAL_ROUTE_KM);
    state.setPositionKm(newPosition);

    // ── Advance game clock ──
    // Map distance to time: proportional to route
    const progressRatio = kmPerSecond * dt / TOTAL_ROUTE_KM;
    const timeAdvance = progressRatio * ROUTE_DURATION_MINUTES;
    state.setCurrentTime(state.currentTime + timeAdvance);

    // ── Fuel consumption ──
    if (throttle > 0) {
      state.addFuel(throttle * newSpeed * 0.001 * dt);
    }

    // ── Check station arrival ──
    this.checkStationArrival(newPosition, newSpeed);

    // ── Check signal violations ──
    this.checkSignalViolations(newPosition, newSpeed);

    // ── Check journey end ──
    if (newPosition >= TOTAL_ROUTE_KM - 0.1 && newSpeed < 1) {
      state.setPhase('results');
    }
  }

  private checkStationArrival(km: number, speed: number) {
    const state = useGameStore.getState();
    const stIdx = state.currentStationIndex;

    // Find next station to stop at (skip New Delhi which is index 0 — we already started there)
    const nextStationIdx = stIdx + 1;
    if (nextStationIdx >= STATIONS.length) return;

    const station = STATIONS[nextStationIdx];
    const dist = Math.abs(km - station.km);

    if (dist < 0.5 && speed < 5) {
      // Arrived at station
      state.setCurrentStationIndex(nextStationIdx);
      state.recordStationArrival(nextStationIdx, state.currentTime);
      state.setSpeedKmh(0);
      state.setThrottle(0);

      if (nextStationIdx < STATIONS.length - 1) {
        // Intermediate station — enter station stop
        state.setHaltTimeRemaining(station.haltMinutes * 60);
        state.setPhase('stationStop');
      } else {
        // Chandigarh — end of journey
        state.setPhase('results');
      }
    }
  }

  private checkSignalViolations(km: number, speed: number) {
    const state = useGameStore.getState();
    if (state.nextSignalIndex >= state.signals.length) return;

    const signal = state.signals[state.nextSignalIndex];

    // Passed the signal
    if (km > signal.km + 0.1) {
      if (signal.color === 'red' && speed > 5) {
        // Signal violation!
        state.incrementSignalViolation();
        state.incrementSafetyViolation();

        if (state.signalViolationsCount >= 1) {
          state.setPhase('accident');
          return;
        }
      }
      state.setNextSignalIndex(state.nextSignalIndex + 1);
    }
  }
}
