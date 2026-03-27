import { useEffect, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, DepthOfField } from '@react-three/postprocessing';
import './App.css';
import { useGameStore } from './store';
import { Terrain } from './components/Terrain';
import { TrackGrid } from './components/TrackGrid';
import { Stations } from './components/Stations';
import { Trees } from './components/Trees';
import { Train } from './components/Train';
import { DustParticles, MistParticles } from './components/Particles';
import { CelebrationParticles } from './components/CelebrationParticles';

import initWasm, {
  generate_terrain,
  find_path,
  validate_track,
} from '../../wasm-engine/pkg/wasm_engine.js';

function HUD() {
  const tracks = useGameStore((s) => s.tracks);
  const budget = useGameStore((s) => s.budget);
  const totalCost = useGameStore((s) => s.totalCost);
  const stations = useGameStore((s) => s.stations);
  const activeTool = useGameStore((s) => s.activeTool);
  const setActiveTool = useGameStore((s) => s.setActiveTool);
  const gameMode = useGameStore((s) => s.gameMode);
  const setGameMode = useGameStore((s) => s.setGameMode);
  const trainRunning = useGameStore((s) => s.trainRunning);
  const trainProgress = useGameStore((s) => s.trainProgress);
  const setTrainRunning = useGameStore((s) => s.setTrainRunning);
  const setTrainProgress = useGameStore((s) => s.setTrainProgress);
  const setTrainPath = useGameStore((s) => s.setTrainPath);
  const setInvalidCells = useGameStore((s) => s.setInvalidCells);
  const setCurrentStationIndex = useGameStore((s) => s.setCurrentStationIndex);
  const heightmap = useGameStore((s) => s.heightmap);
  const gridWidth = useGameStore((s) => s.gridWidth);
  const gridHeight = useGameStore((s) => s.gridHeight);
  const toast = useGameStore((s) => s.toast);
  const setToast = useGameStore((s) => s.setToast);
  const clearAllTracks = useGameStore((s) => s.clearAllTracks);
  const setStationConnected = useGameStore((s) => s.setStationConnected);

  const handleDepart = useCallback(() => {
    if (!heightmap || trainRunning) return;

    // Validate tracks first
    const trackArray = new Uint32Array(Array.from(tracks));
    const validationResult = validate_track(trackArray, heightmap, gridWidth, 3.0);
    const validation = JSON.parse(validationResult);

    if (!validation.valid) {
      setInvalidCells(validation.invalid_cells);
      setToast('Some tracks are too steep! Fix the red cells.');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setInvalidCells([]);

    // Find path through all stations
    const stationCells = new Uint32Array(
      stations.map((s) => s.row * gridWidth + s.col)
    );
    const path = find_path(trackArray, stationCells, gridWidth, gridHeight, heightmap);

    if (path.length === 0) {
      setToast('Track incomplete! Connect all stations.');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    // Mark stations as connected
    stations.forEach((_, i) => setStationConnected(i, true));

    setTrainPath(Array.from(path));
    setTrainProgress(0);
    setCurrentStationIndex(-1);
    setTrainRunning(true);
    setGameMode('riding');
  }, [
    heightmap, trainRunning, tracks, stations, gridWidth, gridHeight,
    setInvalidCells, setToast, setTrainPath, setTrainProgress,
    setCurrentStationIndex, setTrainRunning, setGameMode, setStationConnected,
  ]);

  const handleStop = useCallback(() => {
    setTrainRunning(false);
    setGameMode('building');
    setTrainProgress(0);
    setCurrentStationIndex(-1);
  }, [setTrainRunning, setGameMode, setTrainProgress, setCurrentStationIndex]);

  return (
    <div className="hud">
      {/* Top bar */}
      <div className="top-bar">
        <h1>WIZRAILS</h1>
        <div className="stats">
          <span>Tracks: {tracks.size}</span>
          <span>Budget: {(budget - totalCost).toFixed(1)} / {budget} Cr</span>
        </div>
      </div>

      {/* Station checklist */}
      <div className="sidebar">
        <h3>Stations</h3>
        {stations.map((station, i) => (
          <div key={i} className="station-item">
            <div
              className="station-dot"
              style={{ background: station.connected ? '#4CAF50' : station.color }}
            />
            <span>{station.connected ? '\u2705' : '\u2B1C'} {station.name}</span>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      {/* Progress bar during ride */}
      {trainRunning && (
        <div className="progress-bar">
          <span>Delhi</span>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${trainProgress * 100}%` }}
            />
          </div>
          <span>Shimla</span>
        </div>
      )}

      {/* Bottom bar */}
      <div className="bottom-bar">
        {gameMode === 'building' ? (
          <>
            <button
              className={`tool-btn ${activeTool === 'place' ? 'active' : ''}`}
              onClick={() => setActiveTool('place')}
            >
              Place Track
            </button>
            <button
              className={`tool-btn ${activeTool === 'remove' ? 'active' : ''}`}
              onClick={() => setActiveTool('remove')}
            >
              Remove
            </button>
            <button className="depart-btn" onClick={handleDepart}>
              Depart
            </button>
            <button className="clear-btn" onClick={clearAllTracks}>
              Clear All
            </button>
          </>
        ) : (
          <button className="clear-btn" onClick={handleStop}>
            Stop & Edit
          </button>
        )}
      </div>
    </div>
  );
}

function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 15, 8]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        color="#FFF3E0"
      />
      <directionalLight position={[-5, 8, -5]} intensity={0.3} color="#B3E5FC" />

      {/* Sky */}
      <mesh>
        <sphereGeometry args={[80, 16, 16]} />
        <meshBasicMaterial color="#87CEEB" side={1} />
      </mesh>

      {/* Scene objects */}
      <Terrain />
      <TrackGrid />
      <Stations />
      <Trees />
      <Train />
      <DustParticles />
      <MistParticles />
      <CelebrationParticles />

      {/* Camera controls */}
      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={40}
      />

      {/* Post-processing */}
      <EffectComposer>
        <DepthOfField
          focusDistance={0.02}
          focalLength={0.05}
          bokehScale={2}
        />
      </EffectComposer>
    </>
  );
}

function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setHeightmap = useGameStore((s) => s.setHeightmap);

  useEffect(() => {
    async function load() {
      try {
        await initWasm();
        const hm = generate_terrain(24, 40, 42);
        setHeightmap(hm);
        setReady(true);
      } catch (e) {
        console.error('Failed to initialize WASM:', e);
        setError(String(e));
      }
    }
    load();
  }, [setHeightmap]);

  if (error) {
    return (
      <div className="loading-screen">
        <h1>WIZRAILS</h1>
        <p style={{ color: '#ef4444' }}>Failed to load: {error}</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="loading-screen">
        <h1>WIZRAILS</h1>
        <p>Loading terrain...</p>
      </div>
    );
  }

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 18, 22], fov: 50 }}
        style={{ width: '100vw', height: '100vh' }}
      >
        <Scene />
      </Canvas>
      <HUD />
    </>
  );
}

export default App;
