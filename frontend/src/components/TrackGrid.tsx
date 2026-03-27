import { useCallback, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { useGameStore } from '../store';

function TrackPiece({ cell, gridWidth, gridHeight, heightmap, tracks, isInvalid, isFlash }: {
  cell: number;
  gridWidth: number;
  gridHeight: number;
  heightmap: Float32Array;
  tracks: Set<number>;
  isInvalid: boolean;
  isFlash: boolean;
}) {
  const row = Math.floor(cell / gridWidth);
  const col = cell % gridWidth;
  const elev = heightmap[row * gridWidth + col] || 0;
  const x = col - gridWidth / 2 + 0.5;
  const z = row - gridHeight / 2 + 0.5;
  const y = elev * 0.5 + 0.02;

  // Determine track orientation based on neighbors
  const hasTop = row > 0 && tracks.has((row - 1) * gridWidth + col);
  const hasBottom = row < gridHeight - 1 && tracks.has((row + 1) * gridWidth + col);
  const hasLeft = col > 0 && tracks.has(row * gridWidth + col - 1);
  const hasRight = col < gridWidth - 1 && tracks.has(row * gridWidth + col + 1);

  const isHorizontal = (hasLeft || hasRight) && !hasTop && !hasBottom;
  const isCurve = (hasTop || hasBottom) && (hasLeft || hasRight);

  let rotY = 0;
  if (isHorizontal) rotY = Math.PI / 2;
  else if (isCurve) {
    if (hasTop && hasRight) rotY = 0;
    else if (hasTop && hasLeft) rotY = Math.PI / 2;
    else if (hasBottom && hasLeft) rotY = Math.PI;
    else if (hasBottom && hasRight) rotY = -Math.PI / 2;
  }

  const color = isFlash ? '#FF1744' : isInvalid ? '#FF5722' : '#8D6E63';
  const railColor = isFlash ? '#FF1744' : '#90A4AE';

  return (
    <group position={[x, y, z]} rotation={[0, rotY, 0]}>
      {/* Ballast bed */}
      <mesh receiveShadow>
        <boxGeometry args={[0.9, 0.06, 0.9]} />
        <meshStandardMaterial color="#9E9E9E" />
      </mesh>

      {/* Wooden ties */}
      {[-0.3, -0.1, 0.1, 0.3].map((tz, i) => (
        <mesh key={i} position={[0, 0.04, tz]} castShadow>
          <boxGeometry args={[0.7, 0.04, 0.12]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}

      {/* Rails */}
      <mesh position={[-0.22, 0.08, 0]} castShadow>
        <boxGeometry args={[0.04, 0.04, 0.9]} />
        <meshStandardMaterial color={railColor} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.22, 0.08, 0]} castShadow>
        <boxGeometry args={[0.04, 0.04, 0.9]} />
        <meshStandardMaterial color={railColor} metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

export function TrackGrid() {
  const gridWidth = useGameStore((s) => s.gridWidth);
  const gridHeight = useGameStore((s) => s.gridHeight);
  const heightmap = useGameStore((s) => s.heightmap);
  const tracks = useGameStore((s) => s.tracks);
  const invalidCells = useGameStore((s) => s.invalidCells);
  const flashCells = useGameStore((s) => s.flashCells);
  const activeTool = useGameStore((s) => s.activeTool);
  const toggleTrack = useGameStore((s) => s.toggleTrack);
  const removeTrack = useGameStore((s) => s.removeTrack);
  const gameMode = useGameStore((s) => s.gameMode);

  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const planeRef = useRef<THREE.Mesh>(null);

  const cellFromPoint = useCallback((point: THREE.Vector3) => {
    const col = Math.floor(point.x + gridWidth / 2);
    const row = Math.floor(point.z + gridHeight / 2);
    if (col >= 0 && col < gridWidth && row >= 0 && row < gridHeight) {
      return row * gridWidth + col;
    }
    return null;
  }, [gridWidth, gridHeight]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (gameMode !== 'building') return;
    e.stopPropagation();
    const cell = cellFromPoint(e.point);
    if (cell === null) return;

    if (activeTool === 'place') {
      toggleTrack(cell);
    } else if (activeTool === 'remove') {
      removeTrack(cell);
    }
  }, [gameMode, activeTool, cellFromPoint, toggleTrack, removeTrack]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (gameMode !== 'building') return;
    const cell = cellFromPoint(e.point);
    setHoveredCell(cell);
  }, [gameMode, cellFromPoint]);

  // Create invisible clickable plane at y=0
  const planeGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(gridWidth, gridHeight);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [gridWidth, gridHeight]);

  if (!heightmap) return null;

  const trackArray = Array.from(tracks);

  return (
    <group>
      {/* Invisible click plane */}
      <mesh
        ref={planeRef}
        geometry={planeGeo}
        position={[0, 0.1, 0]}
        onClick={handleClick}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoveredCell(null)}
      >
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Hover indicator */}
      {hoveredCell !== null && gameMode === 'building' && (
        (() => {
          const row = Math.floor(hoveredCell / gridWidth);
          const col = hoveredCell % gridWidth;
          const elev = heightmap[row * gridWidth + col] || 0;
          const x = col - gridWidth / 2 + 0.5;
          const z = row - gridHeight / 2 + 0.5;
          const y = elev * 0.5 + 0.01;
          return (
            <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.95, 0.95]} />
              <meshBasicMaterial
                color={activeTool === 'remove' ? '#FF1744' : '#4FC3F7'}
                transparent
                opacity={0.4}
              />
            </mesh>
          );
        })()
      )}

      {/* Track pieces */}
      {trackArray.map((cell) => (
        <TrackPiece
          key={cell}
          cell={cell}
          gridWidth={gridWidth}
          gridHeight={gridHeight}
          heightmap={heightmap}
          tracks={tracks}
          isInvalid={invalidCells.has(cell)}
          isFlash={flashCells.has(cell)}
        />
      ))}
    </group>
  );
}
