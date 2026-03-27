// Pixel-art Shatabdi Express train renderer
// Blue body with cream/white stripe, visible windows, wheel animation

import { useGameStore } from '../store';

const CANVAS_W = 480;
const CANVAS_H = 270;

const TRAIN_Y = CANVAS_H * 0.75 - 28; // sits just above track
const CARRIAGE_W = 90;
const CARRIAGE_H = 26;
const CARRIAGE_GAP = 2;
const LOCO_W = 50;
const NUM_CARRIAGES = 3;

export class TrainRenderer {
  private wheelAngle = 0;
  private smokeParticles: { x: number; y: number; age: number; size: number }[] = [];

  update(dt: number) {
    const speed = useGameStore.getState().speedKmh;

    // Wheel rotation
    this.wheelAngle += speed * dt * 0.5;

    // Smoke particles
    if (speed > 5) {
      if (Math.random() < speed / 50 * dt * 10) {
        this.smokeParticles.push({
          x: 0,
          y: 0,
          age: 0,
          size: 2 + Math.random() * 3,
        });
      }
    }

    // Update smoke
    this.smokeParticles = this.smokeParticles
      .map((p) => ({
        ...p,
        x: p.x - (20 + speed * 0.3) * dt,
        y: p.y - 15 * dt,
        age: p.age + dt,
      }))
      .filter((p) => p.age < 1.5);
  }

  render(ctx: CanvasRenderingContext2D) {
    const speed = useGameStore.getState().speedKmh;
    const bounce = speed > 0 ? Math.sin(performance.now() / 80) * 0.5 : 0;

    // Calculate train start position (centered)
    const totalTrainW = LOCO_W + NUM_CARRIAGES * (CARRIAGE_W + CARRIAGE_GAP);
    const startX = (CANVAS_W - totalTrainW) / 2;

    // ── Smoke ──
    this.renderSmoke(ctx, startX + LOCO_W - 5, TRAIN_Y - 5 + bounce);

    // ── Locomotive ──
    this.renderLocomotive(ctx, startX, TRAIN_Y + bounce);

    // ── Carriages ──
    for (let i = 0; i < NUM_CARRIAGES; i++) {
      const cx = startX + LOCO_W + CARRIAGE_GAP + i * (CARRIAGE_W + CARRIAGE_GAP);
      this.renderCarriage(ctx, cx, TRAIN_Y + bounce, i === 1); // middle is pantry
    }

    // ── Wheels ──
    this.renderWheels(ctx, startX, TRAIN_Y + CARRIAGE_H + bounce - 2);
  }

  private renderLocomotive(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // Main body — dark blue
    ctx.fillStyle = '#1A3A6A';
    ctx.fillRect(x, y, LOCO_W, CARRIAGE_H);

    // Nose taper
    ctx.fillStyle = '#1A3A6A';
    ctx.beginPath();
    ctx.moveTo(x + LOCO_W, y);
    ctx.lineTo(x + LOCO_W + 8, y + 4);
    ctx.lineTo(x + LOCO_W + 8, y + CARRIAGE_H - 2);
    ctx.lineTo(x + LOCO_W, y + CARRIAGE_H);
    ctx.closePath();
    ctx.fill();

    // Cream stripe
    ctx.fillStyle = '#F5E6C8';
    ctx.fillRect(x, y + 10, LOCO_W + 8, 4);

    // Headlight
    ctx.fillStyle = '#FFEB3B';
    ctx.fillRect(x + LOCO_W + 5, y + 8, 3, 3);

    // Roof
    ctx.fillStyle = '#263238';
    ctx.fillRect(x + 2, y - 2, LOCO_W - 4, 3);

    // Indian Railways logo area
    ctx.fillStyle = '#F5E6C8';
    ctx.fillRect(x + 5, y + 4, 8, 5);

    // Cab windows
    ctx.fillStyle = '#81D4FA';
    ctx.fillRect(x + LOCO_W - 12, y + 3, 8, 6);
  }

  private renderCarriage(ctx: CanvasRenderingContext2D, x: number, y: number, isPantry: boolean) {
    // Main body — blue
    ctx.fillStyle = isPantry ? '#1E4470' : '#1A3A6A';
    ctx.fillRect(x, y, CARRIAGE_W, CARRIAGE_H);

    // Cream stripe
    ctx.fillStyle = '#F5E6C8';
    ctx.fillRect(x, y + 10, CARRIAGE_W, 4);

    // Roof
    ctx.fillStyle = '#263238';
    ctx.fillRect(x + 2, y - 2, CARRIAGE_W - 4, 3);

    // Windows
    if (isPantry) {
      // Pantry — fewer, smaller windows
      ctx.fillStyle = '#FFE082';
      for (let wx = x + 8; wx < x + CARRIAGE_W - 8; wx += 18) {
        ctx.fillRect(wx, y + 3, 6, 6);
      }
    } else {
      // Passenger — regular windows
      ctx.fillStyle = '#81D4FA';
      for (let wx = x + 6; wx < x + CARRIAGE_W - 6; wx += 12) {
        ctx.fillRect(wx, y + 3, 8, 6);
      }
    }

    // Door
    ctx.fillStyle = '#0D47A1';
    ctx.fillRect(x + CARRIAGE_W / 2 - 3, y + 2, 6, CARRIAGE_H - 4);

    // Bottom detail
    ctx.fillStyle = '#263238';
    ctx.fillRect(x, y + CARRIAGE_H - 2, CARRIAGE_W, 2);

    // Vestibule connection
    ctx.fillStyle = '#333';
    ctx.fillRect(x - CARRIAGE_GAP, y + 4, CARRIAGE_GAP, CARRIAGE_H - 8);
  }

  private renderWheels(ctx: CanvasRenderingContext2D, startX: number, y: number) {
    const wheelPositions: number[] = [];

    // Loco wheels
    wheelPositions.push(startX + 8, startX + 22, startX + LOCO_W - 8);

    // Carriage wheels (bogies at each end)
    for (let i = 0; i < NUM_CARRIAGES; i++) {
      const cx = startX + LOCO_W + CARRIAGE_GAP + i * (CARRIAGE_W + CARRIAGE_GAP);
      wheelPositions.push(cx + 10, cx + CARRIAGE_W - 10);
    }

    const wheelR = 3;
    for (const wx of wheelPositions) {
      // Wheel
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(wx, y + 1, wheelR, 0, Math.PI * 2);
      ctx.fill();

      // Spoke (shows rotation)
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const sx = Math.cos(this.wheelAngle) * wheelR * 0.7;
      const sy = Math.sin(this.wheelAngle) * wheelR * 0.7;
      ctx.moveTo(wx - sx, y + 1 - sy);
      ctx.lineTo(wx + sx, y + 1 + sy);
      ctx.stroke();
    }
  }

  private renderSmoke(ctx: CanvasRenderingContext2D, baseX: number, baseY: number) {
    for (const p of this.smokeParticles) {
      const alpha = Math.max(0, 1 - p.age / 1.5) * 0.4;
      ctx.fillStyle = `rgba(200,200,200,${alpha})`;
      ctx.beginPath();
      ctx.arc(baseX + p.x, baseY + p.y, p.size + p.age * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
