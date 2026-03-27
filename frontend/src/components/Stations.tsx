import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store';

function StationBuilding({ name, row, col, color, heightmap, gridWidth, gridHeight }: {
  name: string;
  row: number;
  col: number;
  color: string;
  heightmap: Float32Array;
  gridWidth: number;
  gridHeight: number;
}) {
  const elev = heightmap[row * gridWidth + col] || 0;
  const x = col - gridWidth / 2 + 0.5;
  const z = row - gridHeight / 2 + 0.5;
  const y = elev * 0.5;

  const isDelhi = name === 'New Delhi';
  const isShimla = name === 'Shimla';

  return (
    <group position={[x, y, z]}>
      {/* Main building */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.4, 0.6, 0.8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.5, 0.15, 0.9]} />
        <meshStandardMaterial color="#8D6E63" />
      </mesh>

      {/* Dome (Delhi gets a larger dome) */}
      {isDelhi && (
        <mesh position={[0, 1.0, 0]} castShadow>
          <sphereGeometry args={[0.3, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#FF6F00" />
        </mesh>
      )}

      {/* Shimla peak decoration */}
      {isShimla && (
        <mesh position={[0, 0.95, 0]} castShadow>
          <coneGeometry args={[0.25, 0.4, 6]} />
          <meshStandardMaterial color="#455A64" />
        </mesh>
      )}

      {/* Platform */}
      <mesh position={[0, 0.02, 0.6]} receiveShadow>
        <boxGeometry args={[1.8, 0.04, 0.4]} />
        <meshStandardMaterial color="#9E9E9E" />
      </mesh>

      {/* Platform pillars */}
      {[-0.6, 0, 0.6].map((px, i) => (
        <mesh key={i} position={[px, 0.2, 0.6]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.35, 6]} />
          <meshStandardMaterial color="#757575" />
        </mesh>
      ))}

      {/* Platform roof */}
      <mesh position={[0, 0.4, 0.6]}>
        <boxGeometry args={[1.6, 0.03, 0.5]} />
        <meshStandardMaterial color="#795548" />
      </mesh>

      {/* Label */}
      <Html
        position={[0, 1.5, 0]}
        center
        distanceFactor={15}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div style={{
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          border: `2px solid ${color}`,
          fontFamily: 'sans-serif',
        }}>
          {name === 'New Delhi' ? '🏛️' : name === 'Chandigarh' ? '🌳' : '🏔️'} {name}
        </div>
      </Html>
    </group>
  );
}

export function Stations() {
  const stations = useGameStore((s) => s.stations);
  const heightmap = useGameStore((s) => s.heightmap);
  const gridWidth = useGameStore((s) => s.gridWidth);
  const gridHeight = useGameStore((s) => s.gridHeight);

  if (!heightmap) return null;

  return (
    <group>
      {stations.map((station, i) => (
        <StationBuilding
          key={i}
          name={station.name}
          row={station.row}
          col={station.col}
          color={station.color}
          heightmap={heightmap}
          gridWidth={gridWidth}
          gridHeight={gridHeight}
        />
      ))}
    </group>
  );
}
