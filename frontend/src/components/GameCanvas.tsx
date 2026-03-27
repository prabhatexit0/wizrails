// Main game canvas — 480x270 pixel-art resolution, scaled up with CSS
// Manages the game loop and delegates to renderers

import { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../store';
import { GameLoop } from '../engine/GameLoop';
import { ParallaxRenderer } from '../engine/ParallaxRenderer';
import { TrainRenderer } from '../engine/TrainRenderer';
import { PhysicsEngine } from '../engine/PhysicsEngine';
import { SignalEngine } from '../engine/SignalEngine';
import { EventEngine } from '../engine/EventEngine';
import { StationRenderer } from '../engine/StationRenderer';
import { InteriorRenderer } from '../engine/InteriorRenderer';
import { AudioEngine } from '../engine/AudioEngine';

const CANVAS_W = 480;
const CANVAS_H = 270;

// Engine instances (persistent across re-renders)
const parallax = new ParallaxRenderer();
const train = new TrainRenderer();
const physics = new PhysicsEngine();
const signalEngine = new SignalEngine();
const eventEngine = new EventEngine();
const stationRenderer = new StationRenderer();
const interiorRenderer = new InteriorRenderer();
export const audioEngine = new AudioEngine();

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<GameLoop | null>(null);

  const onUpdate = useCallback((dt: number) => {
    const state = useGameStore.getState();

    if (state.phase === 'running') {
      physics.update(dt);
      signalEngine.update(dt);
      eventEngine.update(dt);
      train.update(dt);
      audioEngine.update(dt);
    } else if (state.phase === 'stationStop') {
      // Count down halt timer
      const remaining = state.haltTimeRemaining - dt;
      if (remaining <= 0) {
        state.setHaltTimeRemaining(0);
      } else {
        state.setHaltTimeRemaining(remaining);
      }
      stationRenderer.update(dt);
      signalEngine.update(dt);
    }
  }, []);

  const onRender = useCallback(
    (ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) => {
      const state = useGameStore.getState();

      if (state.phase === 'stationStop') {
        stationRenderer.render(ctx);
      } else if (
        state.phase === 'running' ||
        state.phase === 'preDeparture' ||
        state.phase === 'paused'
      ) {
        if (state.showInterior) {
          interiorRenderer.render(ctx);
        } else {
          parallax.render(ctx, _canvas);
          train.render(ctx);
        }

        // Fog overlay for fog events
        if (state.activeEvent?.type === 'fog' && state.activeEvent.active) {
          ctx.fillStyle = 'rgba(200,200,200,0.4)';
          ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        }

        // Cattle on tracks
        if (state.activeEvent?.type === 'cattle' && state.activeEvent.active) {
          drawCow(ctx);
        }
      } else if (state.phase === 'menu') {
        renderMenuBackground(ctx);
      }
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loop = new GameLoop(canvas, onUpdate, onRender);
    loopRef.current = loop;
    loop.start();

    return () => {
      loop.stop();
      audioEngine.cleanup();
    };
  }, [onUpdate, onRender]);

  // Initialize signals when game starts
  useEffect(() => {
    return useGameStore.subscribe((state, prev) => {
      if (state.phase === 'running' && prev.phase !== 'running') {
        signalEngine.initialize();
        audioEngine.init();
        audioEngine.playWhistle();
      }
      if (state.phase === 'stationStop' && prev.phase !== 'stationStop') {
        stationRenderer.initForStation(state.currentStationIndex);
        audioEngine.playBell();
      }
      if (state.activeEvent && !prev.activeEvent) {
        audioEngine.playAlert();
      }
    });
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{
        width: '100%',
        height: '100%',
        imageRendering: 'pixelated',
        display: 'block',
      }}
    />
  );
}

function drawCow(ctx: CanvasRenderingContext2D) {
  // Simple pixel cow on the tracks
  const x = CANVAS_W * 0.55;
  const y = CANVAS_H * 0.72 - 12;

  // Body
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(x, y, 16, 10);
  // Head
  ctx.fillStyle = '#A0522D';
  ctx.fillRect(x + 14, y - 2, 8, 8);
  // Legs
  ctx.fillStyle = '#5D3A1A';
  ctx.fillRect(x + 2, y + 10, 3, 5);
  ctx.fillRect(x + 11, y + 10, 3, 5);
  // Horns
  ctx.fillStyle = '#DDD';
  ctx.fillRect(x + 16, y - 4, 2, 3);
  ctx.fillRect(x + 20, y - 4, 2, 3);
}

function renderMenuBackground(ctx: CanvasRenderingContext2D) {
  // Animated gradient background for menu
  const time = performance.now() / 3000;

  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, '#1a1a2e');
  grad.addColorStop(0.5, '#16213e');
  grad.addColorStop(1, '#0f3460');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Stars
  ctx.fillStyle = '#FFF';
  for (let i = 0; i < 30; i++) {
    const sx = ((i * 73 + Math.sin(time + i) * 2) % CANVAS_W);
    const sy = ((i * 47) % (CANVAS_H * 0.5));
    const size = (i % 3 === 0) ? 2 : 1;
    ctx.fillRect(sx, sy, size, size);
  }

  // Ground silhouette
  ctx.fillStyle = '#0a0a15';
  ctx.fillRect(0, CANVAS_H * 0.7, CANVAS_W, CANVAS_H * 0.3);

  // Track
  ctx.fillStyle = '#333';
  ctx.fillRect(0, CANVAS_H * 0.72, CANVAS_W, 2);
  ctx.fillRect(0, CANVAS_H * 0.72 + 10, CANVAS_W, 2);

  // Simple train silhouette moving across
  const trainX = ((time * 30) % (CANVAS_W + 200)) - 100;
  ctx.fillStyle = '#1A3A6A';
  ctx.fillRect(trainX, CANVAS_H * 0.72 - 18, 80, 16);
  ctx.fillStyle = '#F5E6C8';
  ctx.fillRect(trainX, CANVAS_H * 0.72 - 10, 80, 3);
}

export { signalEngine, eventEngine, stationRenderer };
