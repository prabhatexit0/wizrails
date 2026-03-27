import { useMemo } from 'react';
import { useGameStore } from '../store';

function Tree({ position, scale, isPine }: {
  position: [number, number, number];
  scale: number;
  isPine: boolean;
}) {
  if (isPine) {
    return (
      <group position={position} scale={scale}>
        {/* Pine trunk */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.04, 0.3, 6]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>
        {/* Pine layers */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <coneGeometry args={[0.18, 0.3, 6]} />
          <meshStandardMaterial color="#1B5E20" />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow>
          <coneGeometry args={[0.14, 0.25, 6]} />
          <meshStandardMaterial color="#2E7D32" />
        </mesh>
        <mesh position={[0, 0.62, 0]} castShadow>
          <coneGeometry args={[0.1, 0.2, 6]} />
          <meshStandardMaterial color="#388E3C" />
        </mesh>
      </group>
    );
  }

  return (
    <group position={position} scale={scale}>
      {/* Deciduous trunk */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.05, 0.3, 6]} />
        <meshStandardMaterial color="#6D4C41" />
      </mesh>
      {/* Foliage */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <dodecahedronGeometry args={[0.2, 1]} />
        <meshStandardMaterial color="#4CAF50" />
      </mesh>
    </group>
  );
}

export function Trees() {
  const heightmap = useGameStore((s) => s.heightmap);
  const gridWidth = useGameStore((s) => s.gridWidth);
  const gridHeight = useGameStore((s) => s.gridHeight);
  const tracks = useGameStore((s) => s.tracks);
  const stations = useGameStore((s) => s.stations);

  const trees = useMemo(() => {
    if (!heightmap) return [];

    const stationCells = new Set(stations.map((s) => s.row * gridWidth + s.col));
    const result: { pos: [number, number, number]; scale: number; isPine: boolean }[] = [];

    // Seeded random
    let seed = 42;
    const rand = () => {
      seed = (seed * 16807 + 0) % 2147483647;
      return seed / 2147483647;
    };

    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        const cell = row * gridWidth + col;
        if (tracks.has(cell) || stationCells.has(cell)) continue;

        const elev = heightmap[cell] || 0;

        // Determine tree density by zone
        let density = 0;
        let isPine = false;
        if (row >= 30) {
          density = 0.05; // sparse in Delhi
        } else if (row >= 16) {
          density = 0.12; // farmland
        } else if (row >= 8) {
          density = 0.18; // foothills - denser
          isPine = rand() > 0.5;
        } else {
          density = 0.15; // mountains - pine
          isPine = true;
          if (elev > 10) density = 0.03; // sparse near peaks
        }

        if (rand() < density) {
          const x = col - gridWidth / 2 + 0.2 + rand() * 0.6;
          const z = row - gridHeight / 2 + 0.2 + rand() * 0.6;
          const y = elev * 0.5;
          const scale = 0.6 + rand() * 0.8;
          result.push({ pos: [x, y, z], scale, isPine });
        }
      }
    }
    return result;
  }, [heightmap, gridWidth, gridHeight, tracks, stations]);

  return (
    <group>
      {trees.map((tree, i) => (
        <Tree key={i} position={tree.pos} scale={tree.scale} isPine={tree.isPine} />
      ))}
    </group>
  );
}
