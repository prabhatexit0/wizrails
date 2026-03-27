// Train interior cross-section view — side-view of Shatabdi carriages

import { useGameStore } from '../store';
import { NPC_COLORS } from './NPCEngine';
import type { NPCType } from '../store';

const CANVAS_W = 480;
const CANVAS_H = 270;

const CARRIAGE_Y = 60;
const CARRIAGE_H = 120;
const CARRIAGE_W = 140;
const SEAT_W = 12;
const SEAT_H = 14;
const AISLE_Y = CARRIAGE_Y + CARRIAGE_H / 2;

export class InteriorRenderer {
  private scrollX = 0;

  render(ctx: CanvasRenderingContext2D) {
    // Background (ceiling/walls)
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw 3 carriages side-scrollable
    const carriages = ['AC Chair Car 1', 'Pantry Car', 'AC Chair Car 2'];

    for (let c = 0; c < carriages.length; c++) {
      const cx = c * (CARRIAGE_W + 8) - this.scrollX + 20;
      if (cx > CANVAS_W + 10 || cx + CARRIAGE_W < -10) continue;

      this.renderCarriage(ctx, cx, carriages[c], c === 1, c);
    }

    // Windows showing parallax scenery (simplified)
    this.renderWindows(ctx);

    // Floor
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(0, CARRIAGE_Y + CARRIAGE_H, CANVAS_W, 4);

    // Bottom area — under-carriage
    ctx.fillStyle = '#111';
    ctx.fillRect(0, CARRIAGE_Y + CARRIAGE_H + 4, CANVAS_W, CANVAS_H - CARRIAGE_Y - CARRIAGE_H - 4);

    // Tracks
    const trackY = CANVAS_H - 30;
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(0, trackY, CANVAS_W, 20);
    ctx.fillStyle = '#888';
    ctx.fillRect(0, trackY + 2, CANVAS_W, 2);
    ctx.fillRect(0, trackY + 14, CANVAS_W, 2);

    // Render passengers in seats
    this.renderPassengers(ctx);
  }

  private renderCarriage(
    ctx: CanvasRenderingContext2D,
    x: number,
    name: string,
    isPantry: boolean,
    _carriageIndex: number
  ) {
    // Outer shell
    ctx.fillStyle = '#263238';
    ctx.fillRect(x - 2, CARRIAGE_Y - 4, CARRIAGE_W + 4, CARRIAGE_H + 8);

    // Interior walls
    ctx.fillStyle = isPantry ? '#4E342E' : '#ECEFF1';
    ctx.fillRect(x, CARRIAGE_Y, CARRIAGE_W, CARRIAGE_H);

    // Ceiling
    ctx.fillStyle = '#CFD8DC';
    ctx.fillRect(x, CARRIAGE_Y, CARRIAGE_W, 8);

    // Luggage rack
    ctx.fillStyle = '#90A4AE';
    ctx.fillRect(x + 4, CARRIAGE_Y + 10, CARRIAGE_W - 8, 4);

    // Aisle floor
    ctx.fillStyle = '#795548';
    ctx.fillRect(x, AISLE_Y - 2, CARRIAGE_W, 4);

    if (isPantry) {
      // Pantry equipment
      ctx.fillStyle = '#888';
      ctx.fillRect(x + 10, CARRIAGE_Y + 30, 30, 25);
      ctx.fillRect(x + 50, CARRIAGE_Y + 35, 25, 20);
      ctx.fillRect(x + 90, CARRIAGE_Y + 30, 35, 25);

      // Counter
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(x + 5, AISLE_Y + 10, CARRIAGE_W - 10, 6);
    } else {
      // Seats (2+2 layout)
      // Upper row
      for (let s = 0; s < 5; s++) {
        const sx = x + 10 + s * 26;
        // Left pair
        this.renderSeat(ctx, sx, CARRIAGE_Y + 18);
        this.renderSeat(ctx, sx + SEAT_W + 2, CARRIAGE_Y + 18);
      }
      // Lower row
      for (let s = 0; s < 5; s++) {
        const sx = x + 10 + s * 26;
        this.renderSeat(ctx, sx, AISLE_Y + 8);
        this.renderSeat(ctx, sx + SEAT_W + 2, AISLE_Y + 8);
      }
    }

    // Carriage label
    ctx.fillStyle = '#333';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(name, x + CARRIAGE_W / 2, CARRIAGE_Y + CARRIAGE_H - 5);

    // Vestibule
    ctx.fillStyle = '#37474F';
    ctx.fillRect(x + CARRIAGE_W, CARRIAGE_Y, 8, CARRIAGE_H);
    ctx.fillStyle = '#455A64';
    ctx.fillRect(x + CARRIAGE_W + 2, CARRIAGE_Y + 20, 4, CARRIAGE_H - 40);
  }

  private renderSeat(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // Seat cushion
    ctx.fillStyle = '#1565C0';
    ctx.fillRect(x, y, SEAT_W, SEAT_H);
    // Back
    ctx.fillStyle = '#0D47A1';
    ctx.fillRect(x, y, SEAT_W, 3);
    // Armrest
    ctx.fillStyle = '#546E7A';
    ctx.fillRect(x - 1, y + SEAT_H - 2, SEAT_W + 2, 2);
  }

  private renderWindows(ctx: CanvasRenderingContext2D) {
    // Simple window strips showing sky
    const windowY = CARRIAGE_Y + 14;
    const windowH = 15;

    for (let wx = 20; wx < CANVAS_W - 20; wx += 30) {
      ctx.fillStyle = '#4A90D9';
      ctx.fillRect(wx, windowY, 18, windowH);
      // Window frame
      ctx.strokeStyle = '#263238';
      ctx.lineWidth = 1;
      ctx.strokeRect(wx, windowY, 18, windowH);
    }
  }

  private renderPassengers(ctx: CanvasRenderingContext2D) {
    const state = useGameStore.getState();

    for (const passenger of state.passengers) {
      // Place in seat based on index
      const carriageIdx = passenger.seatIndex < 10 ? 0 : 2;
      const seatInCarriage = passenger.seatIndex % 10;
      const row = seatInCarriage < 5 ? 0 : 1;
      const col = seatInCarriage % 5;

      const cx = carriageIdx * (CARRIAGE_W + 8) - this.scrollX + 20;
      const sx = cx + 10 + col * 26 + 2;
      const sy = row === 0 ? CARRIAGE_Y + 18 : AISLE_Y + 8;

      // Draw tiny person in seat
      const color = NPC_COLORS[passenger.type as NPCType] || '#888';

      // Head
      ctx.fillStyle = '#FFD1A4';
      ctx.fillRect(sx + 3, sy - 3, 4, 4);

      // Body
      ctx.fillStyle = color;
      ctx.fillRect(sx + 2, sy + 1, 6, 6);

      // Mood indicator
      const moodColor =
        passenger.mood === 'happy' ? '#4CAF50' :
        passenger.mood === 'unhappy' ? '#F44336' : '#FFB300';
      ctx.fillStyle = moodColor;
      ctx.fillRect(sx + 3, sy - 6, 3, 2);
    }
  }
}
