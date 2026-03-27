// 4-layer parallax scrolling background renderer
// Layers: far sky/clouds, mid scenery, near trackside, foreground tracks

import { useGameStore } from '../store';

const CANVAS_W = 480;
const CANVAS_H = 270;

// Sky gradient stops for time-of-day progression
interface SkyGradient {
  top: string;
  bottom: string;
}

function lerpColor(a: string, b: string, t: number): string {
  const parseHex = (c: string) => {
    const hex = c.replace('#', '');
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  };
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

// Time-based sky gradients (golden afternoon → sunset → dusk)
function getSkyGradient(km: number): SkyGradient {
  const progress = km / 266;
  if (progress < 0.34) {
    // Delhi → Panipat: golden afternoon
    return {
      top: lerpColor('#4A90D9', '#E8963A', progress / 0.34 * 0.3),
      bottom: lerpColor('#87CEEB', '#F4D03F', progress / 0.34 * 0.4),
    };
  } else if (progress < 0.59) {
    // Panipat → Kurukshetra: approaching sunset
    const t = (progress - 0.34) / 0.25;
    return {
      top: lerpColor('#5A7DB5', '#C0392B', t * 0.5),
      bottom: lerpColor('#E8A63A', '#E74C3C', t * 0.4),
    };
  } else if (progress < 0.75) {
    // Kurukshetra → Ambala: sunset
    const t = (progress - 0.59) / 0.16;
    return {
      top: lerpColor('#7B3FA0', '#2C3E50', t * 0.6),
      bottom: lerpColor('#E74C3C', '#8E44AD', t * 0.5),
    };
  } else {
    // Ambala → Chandigarh: dusk
    const t = (progress - 0.75) / 0.25;
    return {
      top: lerpColor('#2C3E50', '#1a1a2e', t),
      bottom: lerpColor('#6C3483', '#2C3E50', t),
    };
  }
}

// ── Scenery Zone Definitions ──

interface SceneryElement {
  type: 'building' | 'tree' | 'field' | 'factory' | 'bridge' | 'pole' | 'signal' |
    'village' | 'temple' | 'mountain' | 'refinery' | 'river' | 'cantonment' | 'modern';
  x: number; // position within a repeating tile
  y: number;
  w: number;
  h: number;
  color: string;
  color2?: string;
}

type SceneryZone = {
  kmStart: number;
  kmEnd: number;
  groundColor: string;
  midElements: SceneryElement[];
  nearElements: SceneryElement[];
};

const SCENERY_ZONES: SceneryZone[] = [
  // Delhi urban (km 0-10)
  {
    kmStart: 0, kmEnd: 10,
    groundColor: '#7a7a7a',
    midElements: [
      { type: 'building', x: 0, y: 60, w: 40, h: 50, color: '#8B7355' },
      { type: 'building', x: 50, y: 50, w: 30, h: 60, color: '#A0937A' },
      { type: 'building', x: 90, y: 65, w: 35, h: 45, color: '#9B8B75' },
      { type: 'building', x: 140, y: 55, w: 25, h: 55, color: '#7B7265' },
      { type: 'building', x: 180, y: 70, w: 50, h: 40, color: '#8B8070' },
      { type: 'building', x: 250, y: 45, w: 20, h: 65, color: '#6B6255' },
      { type: 'building', x: 290, y: 60, w: 45, h: 50, color: '#9B9080' },
    ],
    nearElements: [
      { type: 'pole', x: 30, y: 130, w: 3, h: 30, color: '#555' },
      { type: 'pole', x: 120, y: 130, w: 3, h: 30, color: '#555' },
      { type: 'pole', x: 210, y: 130, w: 3, h: 30, color: '#555' },
      { type: 'pole', x: 300, y: 130, w: 3, h: 30, color: '#555' },
    ],
  },
  // Yamuna crossing (km 10-20)
  {
    kmStart: 10, kmEnd: 20,
    groundColor: '#C4B078',
    midElements: [
      { type: 'river', x: 0, y: 80, w: 400, h: 25, color: '#5B9BD5', color2: '#7AB8E0' },
    ],
    nearElements: [
      { type: 'bridge', x: 0, y: 135, w: 400, h: 8, color: '#888' },
      { type: 'pole', x: 60, y: 130, w: 3, h: 30, color: '#666' },
      { type: 'pole', x: 180, y: 130, w: 3, h: 30, color: '#666' },
      { type: 'pole', x: 300, y: 130, w: 3, h: 30, color: '#666' },
    ],
  },
  // Agricultural plains (km 20-50)
  {
    kmStart: 20, kmEnd: 50,
    groundColor: '#8B9B3E',
    midElements: [
      { type: 'field', x: 0, y: 80, w: 120, h: 30, color: '#C4A935' }, // wheat
      { type: 'field', x: 130, y: 80, w: 100, h: 30, color: '#D4C422' }, // mustard
      { type: 'factory', x: 250, y: 60, w: 15, h: 50, color: '#8B4513' }, // brick kiln chimney
      { type: 'field', x: 280, y: 80, w: 120, h: 30, color: '#C4A935' },
    ],
    nearElements: [
      { type: 'pole', x: 50, y: 130, w: 3, h: 25, color: '#666' },
      { type: 'pole', x: 150, y: 130, w: 3, h: 25, color: '#666' },
      { type: 'tree', x: 250, y: 120, w: 12, h: 20, color: '#3D6B35' },
      { type: 'pole', x: 350, y: 130, w: 3, h: 25, color: '#666' },
    ],
  },
  // GT Road area (km 50-70)
  {
    kmStart: 50, kmEnd: 70,
    groundColor: '#8FAD4A',
    midElements: [
      { type: 'field', x: 0, y: 80, w: 150, h: 30, color: '#BCA830' },
      { type: 'village', x: 170, y: 65, w: 60, h: 35, color: '#C4956A' },
      { type: 'field', x: 250, y: 80, w: 150, h: 30, color: '#D4C422' },
    ],
    nearElements: [
      { type: 'pole', x: 40, y: 130, w: 3, h: 25, color: '#666' },
      { type: 'tree', x: 120, y: 118, w: 14, h: 22, color: '#4A7A3A' },
      { type: 'pole', x: 200, y: 130, w: 3, h: 25, color: '#666' },
      { type: 'pole', x: 320, y: 130, w: 3, h: 25, color: '#666' },
    ],
  },
  // Canal area (km 70-85)
  {
    kmStart: 70, kmEnd: 85,
    groundColor: '#7AA04A',
    midElements: [
      { type: 'river', x: 80, y: 85, w: 60, h: 12, color: '#4A8AB5' },
      { type: 'field', x: 0, y: 80, w: 70, h: 30, color: '#A4C435' },
      { type: 'village', x: 180, y: 70, w: 50, h: 30, color: '#B8956A' },
      { type: 'field', x: 250, y: 80, w: 150, h: 30, color: '#A4C435' },
    ],
    nearElements: [
      { type: 'pole', x: 60, y: 130, w: 3, h: 25, color: '#666' },
      { type: 'pole', x: 180, y: 130, w: 3, h: 25, color: '#666' },
      { type: 'tree', x: 280, y: 120, w: 12, h: 20, color: '#4A7A3A' },
    ],
  },
  // Panipat Refinery (km 85-90)
  {
    kmStart: 85, kmEnd: 90,
    groundColor: '#6B6B5B',
    midElements: [
      { type: 'refinery', x: 20, y: 40, w: 80, h: 70, color: '#777', color2: '#999' },
      { type: 'factory', x: 120, y: 50, w: 12, h: 60, color: '#888' },
      { type: 'refinery', x: 160, y: 45, w: 60, h: 65, color: '#707070', color2: '#8A8A8A' },
      { type: 'factory', x: 240, y: 55, w: 10, h: 55, color: '#777' },
    ],
    nearElements: [
      { type: 'pole', x: 50, y: 130, w: 4, h: 30, color: '#555' },
      { type: 'pole', x: 150, y: 130, w: 4, h: 30, color: '#555' },
      { type: 'pole', x: 280, y: 130, w: 4, h: 30, color: '#555' },
    ],
  },
  // Green farmland (km 90-110)
  {
    kmStart: 90, kmEnd: 110,
    groundColor: '#5A9B3A',
    midElements: [
      { type: 'field', x: 0, y: 75, w: 130, h: 35, color: '#3A8B2A' }, // sugarcane
      { type: 'field', x: 140, y: 80, w: 120, h: 30, color: '#6AAB4A' },
      { type: 'tree', x: 280, y: 60, w: 20, h: 35, color: '#2D7A22' },
      { type: 'field', x: 310, y: 80, w: 90, h: 30, color: '#3A8B2A' },
    ],
    nearElements: [
      { type: 'pole', x: 70, y: 130, w: 3, h: 25, color: '#666' },
      { type: 'tree', x: 160, y: 115, w: 16, h: 25, color: '#3D7B30' },
      { type: 'pole', x: 260, y: 130, w: 3, h: 25, color: '#666' },
    ],
  },
  // Markanda River area (km 110-130)
  {
    kmStart: 110, kmEnd: 130,
    groundColor: '#7A9544',
    midElements: [
      { type: 'river', x: 60, y: 82, w: 80, h: 15, color: '#6BA4C0' },
      { type: 'village', x: 180, y: 68, w: 70, h: 35, color: '#C49B6A' },
      { type: 'field', x: 270, y: 80, w: 130, h: 30, color: '#7AAB4A' },
    ],
    nearElements: [
      { type: 'pole', x: 40, y: 130, w: 3, h: 25, color: '#666' },
      { type: 'tree', x: 140, y: 118, w: 14, h: 22, color: '#4D8535' },
      { type: 'pole', x: 250, y: 130, w: 3, h: 25, color: '#666' },
    ],
  },
  // Dharamshalas area (km 130-157)
  {
    kmStart: 130, kmEnd: 157,
    groundColor: '#6A8840',
    midElements: [
      { type: 'temple', x: 30, y: 55, w: 30, h: 45, color: '#D4A060', color2: '#E8C070' },
      { type: 'village', x: 100, y: 70, w: 60, h: 30, color: '#C49B6A' },
      { type: 'temple', x: 200, y: 60, w: 25, h: 40, color: '#D4A060', color2: '#E8C070' },
      { type: 'field', x: 260, y: 80, w: 140, h: 30, color: '#7AAB4A' },
    ],
    nearElements: [
      { type: 'pole', x: 60, y: 130, w: 3, h: 25, color: '#666' },
      { type: 'tree', x: 170, y: 115, w: 16, h: 25, color: '#3D7B30' },
      { type: 'pole', x: 300, y: 130, w: 3, h: 25, color: '#666' },
    ],
  },
  // Reddish soil / Ghaggar River (km 157-180)
  {
    kmStart: 157, kmEnd: 180,
    groundColor: '#9B7044',
    midElements: [
      { type: 'river', x: 40, y: 82, w: 90, h: 18, color: '#6B9AB5' },
      { type: 'tree', x: 160, y: 60, w: 20, h: 35, color: '#3A7030' },
      { type: 'tree', x: 200, y: 65, w: 18, h: 30, color: '#4A8040' },
      { type: 'tree', x: 280, y: 58, w: 22, h: 38, color: '#3A7030' },
    ],
    nearElements: [
      { type: 'pole', x: 50, y: 130, w: 3, h: 25, color: '#666' },
      { type: 'tree', x: 130, y: 118, w: 14, h: 22, color: '#4D7530' },
      { type: 'pole', x: 240, y: 130, w: 3, h: 25, color: '#666' },
    ],
  },
  // Military cantonment (km 180-199)
  {
    kmStart: 180, kmEnd: 199,
    groundColor: '#7A8855',
    midElements: [
      { type: 'cantonment', x: 20, y: 60, w: 60, h: 40, color: '#8B7B55', color2: '#6B5B35' },
      { type: 'tree', x: 100, y: 62, w: 18, h: 32, color: '#4A8040' },
      { type: 'cantonment', x: 150, y: 65, w: 50, h: 35, color: '#7B6B45', color2: '#6B5B35' },
      { type: 'tree', x: 230, y: 58, w: 20, h: 36, color: '#3A7030' },
      { type: 'tree', x: 280, y: 64, w: 16, h: 28, color: '#4A8040' },
    ],
    nearElements: [
      { type: 'pole', x: 50, y: 130, w: 3, h: 25, color: '#555' },
      { type: 'pole', x: 170, y: 130, w: 3, h: 25, color: '#555' },
      { type: 'pole', x: 310, y: 130, w: 3, h: 25, color: '#555' },
    ],
  },
  // Undulating terrain (km 199-230)
  {
    kmStart: 199, kmEnd: 230,
    groundColor: '#5A8A3A',
    midElements: [
      { type: 'tree', x: 20, y: 60, w: 22, h: 38, color: '#2D7A22' },
      { type: 'tree', x: 70, y: 55, w: 18, h: 42, color: '#3A8B2A' },
      { type: 'tree', x: 130, y: 62, w: 20, h: 35, color: '#2D7A22' },
      { type: 'field', x: 170, y: 80, w: 80, h: 30, color: '#5A9B3A' },
      { type: 'tree', x: 270, y: 58, w: 24, h: 40, color: '#3A8B2A' },
      { type: 'tree', x: 330, y: 65, w: 16, h: 30, color: '#2D7A22' },
    ],
    nearElements: [
      { type: 'pole', x: 80, y: 130, w: 3, h: 25, color: '#666' },
      { type: 'tree', x: 190, y: 115, w: 16, h: 25, color: '#3D8030' },
      { type: 'pole', x: 310, y: 130, w: 3, h: 25, color: '#666' },
    ],
  },
  // Shivalik foothills (km 230-260)
  {
    kmStart: 230, kmEnd: 260,
    groundColor: '#4A8A3A',
    midElements: [
      { type: 'mountain', x: 0, y: 30, w: 150, h: 55, color: '#4A6B80', color2: '#5A8B70' },
      { type: 'mountain', x: 120, y: 35, w: 130, h: 50, color: '#3A5B70', color2: '#4A7B60' },
      { type: 'mountain', x: 230, y: 32, w: 170, h: 53, color: '#4A6B80', color2: '#5A8B70' },
      { type: 'tree', x: 60, y: 70, w: 18, h: 30, color: '#2D7A22' },
      { type: 'tree', x: 180, y: 65, w: 20, h: 35, color: '#3A8B2A' },
      { type: 'tree', x: 320, y: 68, w: 16, h: 28, color: '#2D7A22' },
    ],
    nearElements: [
      { type: 'pole', x: 60, y: 130, w: 3, h: 25, color: '#666' },
      { type: 'tree', x: 160, y: 115, w: 16, h: 25, color: '#3D8030' },
      { type: 'pole', x: 280, y: 130, w: 3, h: 25, color: '#666' },
    ],
  },
  // Chandigarh modern (km 260-266)
  {
    kmStart: 260, kmEnd: 266,
    groundColor: '#5A8A4A',
    midElements: [
      { type: 'modern', x: 20, y: 50, w: 50, h: 55, color: '#DADADA', color2: '#B0BEC5' },
      { type: 'tree', x: 85, y: 68, w: 16, h: 28, color: '#3A8B2A' },
      { type: 'modern', x: 120, y: 45, w: 40, h: 60, color: '#CFD8DC', color2: '#ECEFF1' },
      { type: 'tree', x: 175, y: 65, w: 18, h: 32, color: '#2D7A22' },
      { type: 'modern', x: 210, y: 55, w: 55, h: 50, color: '#E0E0E0', color2: '#B0BEC5' },
      { type: 'tree', x: 280, y: 62, w: 20, h: 35, color: '#3A8B2A' },
    ],
    nearElements: [
      { type: 'pole', x: 50, y: 130, w: 3, h: 25, color: '#666' },
      { type: 'pole', x: 170, y: 130, w: 3, h: 25, color: '#666' },
      { type: 'pole', x: 300, y: 130, w: 3, h: 25, color: '#666' },
    ],
  },
];

function getZone(km: number): SceneryZone {
  for (const zone of SCENERY_ZONES) {
    if (km >= zone.kmStart && km < zone.kmEnd) return zone;
  }
  return SCENERY_ZONES[SCENERY_ZONES.length - 1];
}

// ── Draw Helpers ──

function drawElement(ctx: CanvasRenderingContext2D, el: SceneryElement, ox: number, oy: number) {
  const x = el.x + ox;
  const y = el.y + oy;

  switch (el.type) {
    case 'building':
      ctx.fillStyle = el.color;
      ctx.fillRect(x, y, el.w, el.h);
      // windows
      ctx.fillStyle = '#FFE082';
      for (let wy = y + 5; wy < y + el.h - 5; wy += 10) {
        for (let wx = x + 4; wx < x + el.w - 4; wx += 8) {
          ctx.fillRect(wx, wy, 4, 5);
        }
      }
      break;

    case 'tree':
      // trunk
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(x + el.w / 2 - 2, y + el.h * 0.5, 4, el.h * 0.5);
      // canopy
      ctx.fillStyle = el.color;
      ctx.beginPath();
      ctx.arc(x + el.w / 2, y + el.h * 0.35, el.w / 2, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'field':
      ctx.fillStyle = el.color;
      ctx.fillRect(x, y, el.w, el.h);
      // texture lines
      ctx.strokeStyle = el.color2 || lerpColor(el.color, '#000000', 0.15);
      ctx.lineWidth = 1;
      for (let lx = x; lx < x + el.w; lx += 6) {
        ctx.beginPath();
        ctx.moveTo(lx, y);
        ctx.lineTo(lx, y + el.h);
        ctx.stroke();
      }
      break;

    case 'factory':
      ctx.fillStyle = el.color;
      ctx.fillRect(x, y, el.w, el.h);
      // smoke
      ctx.fillStyle = 'rgba(180,180,180,0.5)';
      ctx.beginPath();
      ctx.arc(x + el.w / 2, y - 5, 6, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'bridge':
      ctx.fillStyle = el.color;
      ctx.fillRect(x, y, el.w, el.h);
      // railings
      ctx.fillStyle = '#666';
      for (let bx = x; bx < x + el.w; bx += 20) {
        ctx.fillRect(bx, y - 8, 2, 8);
      }
      break;

    case 'pole':
      ctx.fillStyle = el.color;
      ctx.fillRect(x, y - el.h, el.w, el.h);
      // wire
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 20, y - el.h + 3);
      ctx.lineTo(x + 20, y - el.h + 3);
      ctx.stroke();
      break;

    case 'village':
      // cluster of small houses
      ctx.fillStyle = el.color;
      ctx.fillRect(x, y + 10, el.w * 0.4, el.h - 10);
      ctx.fillRect(x + el.w * 0.5, y + 5, el.w * 0.35, el.h - 5);
      // roofs
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(x - 2, y + 8, el.w * 0.4 + 4, 4);
      ctx.fillRect(x + el.w * 0.5 - 2, y + 3, el.w * 0.35 + 4, 4);
      break;

    case 'temple':
      ctx.fillStyle = el.color;
      ctx.fillRect(x, y + 15, el.w, el.h - 15);
      // spire
      ctx.fillStyle = el.color2 || '#E8C070';
      ctx.beginPath();
      ctx.moveTo(x + el.w / 2, y);
      ctx.lineTo(x + el.w * 0.2, y + 15);
      ctx.lineTo(x + el.w * 0.8, y + 15);
      ctx.closePath();
      ctx.fill();
      break;

    case 'mountain':
      ctx.fillStyle = el.color;
      ctx.beginPath();
      ctx.moveTo(x, y + el.h);
      ctx.lineTo(x + el.w * 0.3, y);
      ctx.lineTo(x + el.w * 0.5, y + el.h * 0.2);
      ctx.lineTo(x + el.w * 0.7, y + 5);
      ctx.lineTo(x + el.w, y + el.h);
      ctx.closePath();
      ctx.fill();
      // snow caps
      if (el.color2) {
        ctx.fillStyle = el.color2;
        ctx.beginPath();
        ctx.moveTo(x + el.w * 0.25, y + 8);
        ctx.lineTo(x + el.w * 0.3, y);
        ctx.lineTo(x + el.w * 0.35, y + 8);
        ctx.closePath();
        ctx.fill();
      }
      break;

    case 'refinery':
      ctx.fillStyle = el.color;
      ctx.fillRect(x, y + 20, el.w, el.h - 20);
      // storage tanks (circles)
      ctx.fillStyle = el.color2 || '#999';
      ctx.beginPath();
      ctx.arc(x + 15, y + 25, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + el.w - 15, y + 28, 10, 0, Math.PI * 2);
      ctx.fill();
      // flare stack
      ctx.fillStyle = '#555';
      ctx.fillRect(x + el.w / 2 - 3, y, 6, 25);
      ctx.fillStyle = '#FF6600';
      ctx.beginPath();
      ctx.arc(x + el.w / 2, y - 3, 5, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'river':
      ctx.fillStyle = el.color;
      ctx.fillRect(x, y, el.w, el.h);
      // ripple highlights
      ctx.strokeStyle = el.color2 || 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      for (let rx = x + 10; rx < x + el.w; rx += 20) {
        ctx.beginPath();
        ctx.moveTo(rx, y + el.h / 2 - 2);
        ctx.lineTo(rx + 8, y + el.h / 2);
        ctx.stroke();
      }
      break;

    case 'cantonment':
      ctx.fillStyle = el.color;
      ctx.fillRect(x, y + 10, el.w, el.h - 10);
      ctx.fillStyle = el.color2 || '#6B5B35';
      ctx.fillRect(x - 2, y + 8, el.w + 4, 4);
      // flag
      ctx.fillStyle = '#FF9933';
      ctx.fillRect(x + el.w / 2, y, 1, 10);
      ctx.fillRect(x + el.w / 2 + 1, y, 6, 4);
      break;

    case 'modern':
      ctx.fillStyle = el.color;
      ctx.fillRect(x, y, el.w, el.h);
      // glass windows
      ctx.fillStyle = el.color2 || '#90CAF9';
      for (let wy = y + 4; wy < y + el.h - 4; wy += 8) {
        ctx.fillRect(x + 3, wy, el.w - 6, 5);
      }
      break;

    case 'signal':
      // handled separately
      break;
  }
}

// ── Clouds ──

interface Cloud {
  x: number;
  y: number;
  w: number;
  h: number;
}

const CLOUDS: Cloud[] = [
  { x: 50, y: 15, w: 40, h: 14 },
  { x: 180, y: 25, w: 55, h: 16 },
  { x: 320, y: 10, w: 45, h: 12 },
  { x: 420, y: 30, w: 35, h: 10 },
];

// ── Main Renderer ──

export class ParallaxRenderer {
  private scrollOffset = 0;

  render(ctx: CanvasRenderingContext2D, _canvas: HTMLCanvasElement) {
    const state = useGameStore.getState();
    const km = state.positionKm;
    const speed = state.speedKmh;

    // Scroll offset accumulates based on speed
    // We use km position directly for zone-based rendering
    this.scrollOffset = km * 50; // pixels per km

    const zone = getZone(km);
    const sky = getSkyGradient(km);

    // ── Layer 0: Sky (no scroll) ──
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H * 0.55);
    skyGrad.addColorStop(0, sky.top);
    skyGrad.addColorStop(1, sky.bottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H * 0.55);

    // Clouds (very slow scroll)
    const cloudOffset = this.scrollOffset * 0.02;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (const cloud of CLOUDS) {
      const cx = ((cloud.x - cloudOffset) % (CANVAS_W + 60)) - 30;
      const adjustedCx = cx < -60 ? cx + CANVAS_W + 60 : cx;
      ctx.beginPath();
      ctx.ellipse(adjustedCx, cloud.y, cloud.w / 2, cloud.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Layer 1: Mid background (slow scroll) ──
    const midOffset = this.scrollOffset * 0.15;
    const tileW = 400;
    const ox = -(midOffset % tileW);

    for (let t = -1; t <= 2; t++) {
      const tileX = ox + t * tileW;
      for (const el of zone.midElements) {
        drawElement(ctx, el, tileX, 40);
      }
    }

    // ── Ground fill ──
    ctx.fillStyle = zone.groundColor;
    ctx.fillRect(0, CANVAS_H * 0.55, CANVAS_W, CANVAS_H * 0.15);

    // ── Layer 2: Near trackside (medium scroll) ──
    const nearOffset = this.scrollOffset * 0.4;
    const nearTileW = 400;
    const nearOx = -(nearOffset % nearTileW);

    for (let t = -1; t <= 2; t++) {
      const tileX = nearOx + t * nearTileW;
      for (const el of zone.nearElements) {
        drawElement(ctx, el, tileX, 30);
      }
    }

    // ── Draw signals in near layer ──
    this.drawSignals(ctx, km, speed);

    // ── Layer 3: Track bed (fast scroll — tied to actual movement) ──
    const trackY = CANVAS_H * 0.75;
    // Ballast
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, trackY - 2, CANVAS_W, 16);
    // Rails
    ctx.fillStyle = '#555';
    ctx.fillRect(0, trackY, CANVAS_W, 2);
    ctx.fillRect(0, trackY + 10, CANVAS_W, 2);
    // Sleepers (ties) — scroll with train
    const tieOffset = this.scrollOffset * 0.8;
    ctx.fillStyle = '#5D4037';
    const tieStart = -(tieOffset % 12);
    for (let tx = tieStart; tx < CANVAS_W; tx += 12) {
      ctx.fillRect(tx, trackY - 1, 8, 14);
    }
    // Re-draw rails on top of sleepers
    ctx.fillStyle = '#888';
    ctx.fillRect(0, trackY, CANVAS_W, 2);
    ctx.fillRect(0, trackY + 10, CANVAS_W, 2);

    // Ground below tracks
    ctx.fillStyle = '#5A4A3A';
    ctx.fillRect(0, trackY + 14, CANVAS_W, CANVAS_H - trackY - 14);
  }

  private drawSignals(ctx: CanvasRenderingContext2D, km: number, _speed: number) {
    const state = useGameStore.getState();
    const signals = state.signals;

    for (const signal of signals) {
      // Only draw signals within visible range (2 km ahead, 0.5 km behind)
      const relKm = signal.km - km;
      if (relKm < -0.5 || relKm > 2) continue;

      // Map relative km to screen x position
      const screenX = CANVAS_W * 0.3 + relKm * 150;
      const signalY = CANVAS_H * 0.55;

      // Signal post
      ctx.fillStyle = '#333';
      ctx.fillRect(screenX, signalY - 30, 3, 30);

      // Signal head
      ctx.fillStyle = '#222';
      ctx.fillRect(screenX - 4, signalY - 42, 11, 15);

      // Signal light
      const colors: Record<string, string> = {
        green: '#00FF00',
        yellow: '#FFFF00',
        red: '#FF0000',
      };
      ctx.fillStyle = colors[signal.color] || '#888';
      ctx.beginPath();
      ctx.arc(screenX + 1.5, signalY - 35, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
