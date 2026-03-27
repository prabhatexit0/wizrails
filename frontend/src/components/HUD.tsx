// Retro-styled HUD control panel — React overlay on top of canvas

import { useCallback } from 'react';
import { useGameStore, STATIONS, TOTAL_ROUTE_KM, formatTime } from '../store';
import { audioEngine } from './GameCanvas';
import { calculate_eta } from '../../../wasm-engine/pkg/wasm_engine.js';

export function HUD() {
  const phase = useGameStore((s) => s.phase);

  if (phase === 'menu' || phase === 'results' || phase === 'accident') return null;

  return (
    <div className="hud">
      <TopBar />
      {phase === 'running' && <SignalIndicator />}
      {phase === 'running' && <MiniMap />}
      <BottomPanel />
      <EventOverlay />
      <Toast />
    </div>
  );
}

function TopBar() {
  const currentTime = useGameStore((s) => s.currentTime);
  const speedKmh = useGameStore((s) => s.speedKmh);
  const maxSpeed = useGameStore((s) => s.maxSpeed);
  const positionKm = useGameStore((s) => s.positionKm);
  const reputationScore = useGameStore((s) => s.reputationScore);
  // Find next station
  const currentStationIndex = useGameStore((s) => s.currentStationIndex);
  const nextIdx = Math.min(currentStationIndex + 1, STATIONS.length - 1);
  const nextStation = STATIONS[nextIdx];
  const distToNext = Math.max(0, nextStation.km - positionKm);

  // ETA calculation via WASM
  let etaMinutes = 0;
  try {
    etaMinutes = speedKmh > 0 ? calculate_eta(positionKm, speedKmh, nextStation.km) : 0;
  } catch {
    etaMinutes = speedKmh > 0 ? (distToNext / speedKmh) * 60 : 0;
  }

  const overspeed = speedKmh > maxSpeed + 5;

  return (
    <div className="hud-top">
      <div className="hud-clock">{formatTime(currentTime)}</div>
      <div className="hud-speed-group">
        <span className={`hud-speed ${overspeed ? 'overspeed' : ''}`}>
          {Math.round(speedKmh)} km/h
        </span>
        <span className="hud-limit">/ {maxSpeed}</span>
      </div>
      <div className="hud-station-info">
        <span className="hud-next-station">{nextStation.name}</span>
        <span className="hud-distance">{distToNext.toFixed(1)} km</span>
        {speedKmh > 0 && (
          <span className="hud-eta">ETA {Math.ceil(etaMinutes)}m</span>
        )}
      </div>
      <div className="hud-reputation">
        {'★'.repeat(Math.round(reputationScore))}{'☆'.repeat(5 - Math.round(reputationScore))}
      </div>
    </div>
  );
}

function SignalIndicator() {
  const signals = useGameStore((s) => s.signals);
  const nextSignalIndex = useGameStore((s) => s.nextSignalIndex);
  const positionKm = useGameStore((s) => s.positionKm);

  if (nextSignalIndex >= signals.length) return null;

  const signal = signals[nextSignalIndex];
  const dist = signal.km - positionKm;

  if (dist < 0 || dist > 15) return null;

  const colorMap = { green: '#00FF00', yellow: '#FFFF00', red: '#FF0000' };

  return (
    <div className="hud-signal">
      <div
        className="signal-light"
        style={{ backgroundColor: colorMap[signal.color] }}
      />
      <span>{dist.toFixed(1)} km</span>
    </div>
  );
}

function MiniMap() {
  const positionKm = useGameStore((s) => s.positionKm);

  return (
    <div className="hud-minimap">
      <div className="minimap-track">
        {STATIONS.map((s, i) => (
          <div
            key={i}
            className="minimap-station"
            style={{ left: `${(s.km / TOTAL_ROUTE_KM) * 100}%` }}
            title={s.name}
          >
            <div className="minimap-dot" />
            <span className="minimap-label">{s.code}</span>
          </div>
        ))}
        <div
          className="minimap-train"
          style={{ left: `${(positionKm / TOTAL_ROUTE_KM) * 100}%` }}
        />
      </div>
    </div>
  );
}

function BottomPanel() {
  const phase = useGameStore((s) => s.phase);
  const throttle = useGameStore((s) => s.throttle);
  const isBraking = useGameStore((s) => s.isBraking);
  const setThrottle = useGameStore((s) => s.setThrottle);
  const setBraking = useGameStore((s) => s.setBraking);
  const setPhase = useGameStore((s) => s.setPhase);
  const haltTimeRemaining = useGameStore((s) => s.haltTimeRemaining);
  const showInterior = useGameStore((s) => s.showInterior);
  const setShowInterior = useGameStore((s) => s.setShowInterior);

  const handleDepart = useCallback(() => {
    setPhase('running');
    audioEngine.playWhistle();
  }, [setPhase]);

  if (phase === 'stationStop') {
    return (
      <div className="hud-bottom">
        <div className="halt-timer">
          Halt: {Math.floor(haltTimeRemaining / 60)}:
          {Math.floor(haltTimeRemaining % 60).toString().padStart(2, '0')}
        </div>
        <button className="btn btn-depart" onClick={handleDepart}>
          Depart
        </button>
      </div>
    );
  }

  if (phase === 'preDeparture') {
    return (
      <div className="hud-bottom">
        <button className="btn btn-depart" onClick={handleDepart}>
          Start Journey
        </button>
      </div>
    );
  }

  return (
    <div className="hud-bottom">
      <div className="throttle-group">
        <label>Throttle</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={throttle}
          onChange={(e) => {
            setThrottle(parseFloat(e.target.value));
            if (parseFloat(e.target.value) > 0) setBraking(false);
          }}
          className="throttle-slider"
        />
        <span>{Math.round(throttle * 100)}%</span>
      </div>
      <button
        className={`btn btn-brake ${isBraking ? 'active' : ''}`}
        onMouseDown={() => { setBraking(true); setThrottle(0); }}
        onMouseUp={() => setBraking(false)}
        onMouseLeave={() => setBraking(false)}
      >
        BRAKE
      </button>
      <button
        className="btn btn-view"
        onClick={() => setShowInterior(!showInterior)}
      >
        {showInterior ? 'Exterior' : 'Interior'}
      </button>
    </div>
  );
}

function EventOverlay() {
  const activeEvent = useGameStore((s) => s.activeEvent);
  if (!activeEvent || !activeEvent.active) return null;

  return (
    <div className="hud-event">
      <div className="event-title">{activeEvent.title}</div>
      <div className="event-desc">{activeEvent.description}</div>
    </div>
  );
}

function Toast() {
  const toast = useGameStore((s) => s.toast);
  if (!toast) return null;

  return <div className="hud-toast">{toast}</div>;
}
