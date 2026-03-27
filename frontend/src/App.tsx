import { useEffect, useState } from 'react';
import './App.css';
import { useGameStore } from './store';
import initWasm from '../../wasm-engine/pkg/wasm_engine.js';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import {
  MenuScreen,
  ResultsScreen,
  AccidentScreen,
  TutorialOverlay,
  PauseOverlay,
  npcEngine,
} from './components/Screens';

function App() {
  const [_wasmReady, setWasmReady] = useState(false);
  const phase = useGameStore((s) => s.phase);
  const currentStationIndex = useGameStore((s) => s.currentStationIndex);

  // Initialize WASM
  useEffect(() => {
    initWasm().then(() => setWasmReady(true)).catch(console.error);
  }, []);

  // Pause on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const state = useGameStore.getState();
        if (state.phase === 'running' || state.phase === 'stationStop') {
          state.setPhase('paused');
        } else if (state.phase === 'paused') {
          state.setPhase(state.previousPhase);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Board passengers when entering station stop
  useEffect(() => {
    if (phase === 'stationStop') {
      npcEngine.boardPassengers(currentStationIndex);
    }
  }, [phase, currentStationIndex]);

  return (
    <div className="game-container">
      <div className="canvas-wrapper">
        <GameCanvas />
      </div>
      <HUD />
      <MenuScreen />
      <ResultsScreen />
      <AccidentScreen />
      <TutorialOverlay />
      <PauseOverlay />
    </div>
  );
}

export default App;
