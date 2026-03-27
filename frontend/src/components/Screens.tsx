// Menu, Results, Accident, Tutorial, and Pause overlay screens

import { useCallback, useMemo } from 'react';
import { useGameStore, STATIONS, parseTime } from '../store';
import { NPCEngine, NPC_LABELS } from '../engine/NPCEngine';
import { signalEngine, eventEngine, stationRenderer } from './GameCanvas';

const npcEngine = new NPCEngine();
export { npcEngine };

export function MenuScreen() {
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const setShowTutorial = useGameStore((s) => s.setShowTutorial);

  const handleStart = useCallback(() => {
    // Board initial passengers at New Delhi
    npcEngine.boardPassengers(0);
    setPhase('preDeparture');
  }, [setPhase]);

  if (phase !== 'menu') return null;

  return (
    <div className="screen menu-screen">
      <h1 className="title">WIZRAILS</h1>
      <p className="subtitle">New Delhi → Chandigarh Shatabdi Express</p>
      <div className="menu-buttons">
        <button className="btn btn-start" onClick={handleStart}>
          Start Journey
        </button>
        <button
          className="btn btn-tutorial"
          onClick={() => { setShowTutorial(true); handleStart(); }}
        >
          How to Play
        </button>
      </div>
      <p className="credit">A 2D Pixel Retro Train Simulator</p>
    </div>
  );
}

export function ResultsScreen() {
  const phase = useGameStore((s) => s.phase);
  const stationArrivals = useGameStore((s) => s.stationArrivals);
  const safetyViolations = useGameStore((s) => s.safetyViolations);
  const totalFuelUsed = useGameStore((s) => s.totalFuelUsed);
  const resetGame = useGameStore((s) => s.resetGame);

  const ratings = useMemo(() => {
    if (phase !== 'results') return null;
    return npcEngine.calculateFinalRatings();
  }, [phase]);

  if (phase !== 'results' || !ratings) return null;

  // Calculate punctuality
  let onTimeCount = 0;
  let totalStations = 0;
  for (let i = 1; i < STATIONS.length; i++) {
    const arrival = stationArrivals[i];
    if (arrival !== null) {
      totalStations++;
      const scheduled = parseTime(STATIONS[i].scheduledArrival);
      if (Math.abs(arrival - scheduled) <= 3) onTimeCount++;
    }
  }
  const punctuality = totalStations > 0 ? Math.round((onTimeCount / totalStations) * 100) : 0;

  const handleRestart = () => {
    resetGame();
    npcEngine.reset();
    signalEngine.reset();
    eventEngine.reset();
    stationRenderer.reset();
  };

  return (
    <div className="screen results-screen">
      <h1>Journey Complete!</h1>
      <h2>New Delhi → Chandigarh</h2>

      <div className="results-grid">
        <div className="result-card">
          <div className="result-label">Overall Rating</div>
          <div className="result-value stars">
            {'★'.repeat(Math.round(ratings.average))}
            {'☆'.repeat(5 - Math.round(ratings.average))}
          </div>
          <div className="result-sub">{ratings.average.toFixed(1)} / 5.0</div>
        </div>

        <div className="result-card">
          <div className="result-label">Punctuality</div>
          <div className="result-value">{punctuality}%</div>
        </div>

        <div className="result-card">
          <div className="result-label">Safety Record</div>
          <div className="result-value">
            {safetyViolations === 0 ? 'Perfect' : `${safetyViolations} violations`}
          </div>
        </div>

        <div className="result-card">
          <div className="result-label">Fuel Efficiency</div>
          <div className="result-value">{totalFuelUsed.toFixed(1)} units</div>
        </div>
      </div>

      <div className="results-passengers">
        <h3>Passenger Ratings</h3>
        {ratings.npcRatings.map((r, i) => (
          <div key={i} className="passenger-rating">
            <span className="pr-type">{NPC_LABELS[r.type]}</span>
            <span className="pr-stars">
              {'★'.repeat(Math.round(r.rating))}
              {'☆'.repeat(5 - Math.round(r.rating))}
            </span>
          </div>
        ))}
      </div>

      <button className="btn btn-start" onClick={handleRestart}>
        Play Again
      </button>
    </div>
  );
}

export function AccidentScreen() {
  const phase = useGameStore((s) => s.phase);
  const resetGame = useGameStore((s) => s.resetGame);

  if (phase !== 'accident') return null;

  const handleRestart = () => {
    resetGame();
    npcEngine.reset();
    signalEngine.reset();
    eventEngine.reset();
    stationRenderer.reset();
  };

  return (
    <div className="screen accident-screen">
      <h1>ACCIDENT!</h1>
      <p>You passed a red signal at speed. The train has been involved in a collision.</p>
      <p className="accident-sub">Safety is the top priority on Indian Railways.</p>
      <button className="btn btn-start" onClick={handleRestart}>
        Try Again
      </button>
    </div>
  );
}

export function TutorialOverlay() {
  const showTutorial = useGameStore((s) => s.showTutorial);
  const setShowTutorial = useGameStore((s) => s.setShowTutorial);

  if (!showTutorial) return null;

  return (
    <div className="screen tutorial-overlay" onClick={() => setShowTutorial(false)}>
      <div className="tutorial-card" onClick={(e) => e.stopPropagation()}>
        <h2>How to Play</h2>
        <ul>
          <li><b>Throttle:</b> Slide to accelerate. Higher = faster.</li>
          <li><b>Brake:</b> Hold to slow down. Release to coast.</li>
          <li><b>Signals:</b> Green = go. Yellow = slow to 60. Red = STOP!</li>
          <li><b>Stations:</b> Slow down and stop at each station. Depart on time.</li>
          <li><b>Speed Limits:</b> 130 km/h open track, 60 km/h near stations.</li>
          <li><b>Events:</b> Cattle, fog, emergencies — respond appropriately!</li>
          <li><b>Goal:</b> Deliver passengers safely and on time from Delhi to Chandigarh.</li>
        </ul>
        <button className="btn btn-tutorial" onClick={() => setShowTutorial(false)}>
          Got it!
        </button>
      </div>
    </div>
  );
}

export function PauseOverlay() {
  const phase = useGameStore((s) => s.phase);
  const previousPhase = useGameStore((s) => s.previousPhase);
  const setPhase = useGameStore((s) => s.setPhase);
  const resetGame = useGameStore((s) => s.resetGame);

  if (phase !== 'paused') return null;

  return (
    <div className="screen pause-overlay">
      <div className="pause-card">
        <h2>PAUSED</h2>
        <button className="btn" onClick={() => setPhase(previousPhase)}>
          Resume
        </button>
        <button className="btn" onClick={() => {
          resetGame();
          npcEngine.reset();
          signalEngine.reset();
          eventEngine.reset();
          stationRenderer.reset();
        }}>
          Restart
        </button>
        <button className="btn" onClick={() => {
          resetGame();
          npcEngine.reset();
          signalEngine.reset();
          eventEngine.reset();
          stationRenderer.reset();
        }}>
          Quit to Menu
        </button>
      </div>
    </div>
  );
}
