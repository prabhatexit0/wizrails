// Station platform view renderer — shown during station stops

import { STATIONS, useGameStore } from '../store';

const CANVAS_W = 480;
const CANVAS_H = 270;

// Station visual styles per station
const STATION_STYLES: {
  buildingColor: string;
  roofColor: string;
  platformColor: string;
  details: string;
}[] = [
  // New Delhi
  { buildingColor: '#C49B6A', roofColor: '#8B1A1A', platformColor: '#999', details: 'arch' },
  // Panipat
  { buildingColor: '#B8A070', roofColor: '#6B4423', platformColor: '#888', details: 'colonial' },
  // Kurukshetra
  { buildingColor: '#D4A060', roofColor: '#8B4513', platformColor: '#888', details: 'temple' },
  // Ambala
  { buildingColor: '#A09070', roofColor: '#5B3A13', platformColor: '#999', details: 'colonial' },
  // Chandigarh
  { buildingColor: '#DADADA', roofColor: '#607D8B', platformColor: '#AAA', details: 'modern' },
];

// NPC sprites (simple pixel characters)
interface PlatformNPC {
  x: number;
  targetX: number;
  y: number;
  color: string;
  boarding: boolean;
  speed: number;
}

export class StationRenderer {
  private npcs: PlatformNPC[] = [];
  initForStation(_stationIndex: number) {
    this.npcs = [];

    // Generate NPCs on platform
    const numNPCs = 8 + Math.floor(Math.random() * 8);
    for (let i = 0; i < numNPCs; i++) {
      const boarding = i < numNPCs / 2;
      this.npcs.push({
        x: boarding ? 50 + Math.random() * 380 : 180 + Math.random() * 120,
        targetX: boarding ? 180 + Math.random() * 120 : 50 + Math.random() * 380,
        y: CANVAS_H * 0.65 - 12,
        color: this.randomNPCColor(),
        boarding,
        speed: 15 + Math.random() * 10,
      });
    }
  }

  private randomNPCColor(): string {
    const colors = ['#E65100', '#1565C0', '#2E7D32', '#6A1B9A', '#C62828', '#00838F', '#F57F17'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update(dt: number) {
    for (const npc of this.npcs) {
      const dx = npc.targetX - npc.x;
      if (Math.abs(dx) > 1) {
        npc.x += Math.sign(dx) * npc.speed * dt;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    const state = useGameStore.getState();
    const stIdx = state.currentStationIndex;
    if (stIdx < 0 || stIdx >= STATIONS.length) return;

    const station = STATIONS[stIdx];
    const style = STATION_STYLES[stIdx] || STATION_STYLES[0];

    // Sky
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H * 0.35);

    // Station building
    const bldgY = CANVAS_H * 0.15;
    const bldgH = CANVAS_H * 0.35;
    const bldgW = CANVAS_W * 0.6;
    const bldgX = (CANVAS_W - bldgW) / 2;

    ctx.fillStyle = style.buildingColor;
    ctx.fillRect(bldgX, bldgY, bldgW, bldgH);

    // Roof
    ctx.fillStyle = style.roofColor;
    ctx.fillRect(bldgX - 5, bldgY - 8, bldgW + 10, 12);

    // Station name board
    ctx.fillStyle = '#1A237E';
    ctx.fillRect(bldgX + bldgW * 0.2, bldgY + 5, bldgW * 0.6, 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(station.name.toUpperCase(), CANVAS_W / 2, bldgY + 18);
    ctx.fillText(station.code, CANVAS_W / 2, bldgY + 30);

    // Windows
    ctx.fillStyle = '#FFE082';
    for (let wx = bldgX + 15; wx < bldgX + bldgW - 15; wx += 20) {
      ctx.fillRect(wx, bldgY + 35, 10, 12);
    }

    // Doors
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(bldgX + bldgW * 0.3, bldgY + bldgH - 25, 12, 25);
    ctx.fillRect(bldgX + bldgW * 0.65, bldgY + bldgH - 25, 12, 25);

    // Platform
    const platY = CANVAS_H * 0.55;
    ctx.fillStyle = style.platformColor;
    ctx.fillRect(0, platY, CANVAS_W, CANVAS_H * 0.15);

    // Platform edge markings
    ctx.fillStyle = '#FFD600';
    ctx.fillRect(0, platY + CANVAS_H * 0.15 - 3, CANVAS_W, 3);

    // Track area
    ctx.fillStyle = '#5A4A3A';
    ctx.fillRect(0, CANVAS_H * 0.7, CANVAS_W, CANVAS_H * 0.3);

    // Rails
    ctx.fillStyle = '#888';
    ctx.fillRect(0, CANVAS_H * 0.72, CANVAS_W, 2);
    ctx.fillRect(0, CANVAS_H * 0.72 + 10, CANVAS_W, 2);

    // Sleepers
    ctx.fillStyle = '#5D4037';
    for (let tx = 0; tx < CANVAS_W; tx += 12) {
      ctx.fillRect(tx, CANVAS_H * 0.72 - 1, 8, 14);
    }

    // Platform furniture
    // Benches
    ctx.fillStyle = '#795548';
    ctx.fillRect(50, platY + 15, 25, 8);
    ctx.fillRect(350, platY + 15, 25, 8);

    // Platform number sign
    ctx.fillStyle = '#FFF';
    ctx.fillRect(20, platY - 15, 24, 14);
    ctx.fillStyle = '#000';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`P${stIdx + 1}`, 32, platY - 4);

    // NPCs
    this.renderNPCs(ctx, platY);

    // Station info overlay
    this.renderStationInfo(ctx, station, state.haltTimeRemaining);
  }

  private renderNPCs(ctx: CanvasRenderingContext2D, platformY: number) {
    for (const npc of this.npcs) {
      // Simple pixel character: 4x8 body, 4x4 head
      const x = Math.floor(npc.x);
      const y = Math.floor(platformY + 5);

      // Head
      ctx.fillStyle = '#FFD1A4';
      ctx.fillRect(x, y, 4, 4);

      // Body
      ctx.fillStyle = npc.color;
      ctx.fillRect(x - 1, y + 4, 6, 8);

      // Legs
      ctx.fillStyle = '#333';
      ctx.fillRect(x, y + 12, 2, 4);
      ctx.fillRect(x + 2, y + 12, 2, 4);
    }
  }

  private renderStationInfo(
    ctx: CanvasRenderingContext2D,
    _station: typeof STATIONS[number],
    haltRemaining: number
  ) {
    // Halt timer
    const timerX = CANVAS_W - 80;
    const timerY = 10;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(timerX, timerY, 70, 25);
    ctx.fillStyle = haltRemaining < 30 ? '#FF5252' : '#FFF';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    const mins = Math.floor(haltRemaining / 60);
    const secs = Math.floor(haltRemaining % 60);
    ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, timerX + 35, timerY + 16);
  }

  reset() {
    this.npcs = [];
  }
}
