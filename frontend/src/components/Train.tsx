import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store';

function TrainModel({ position, rotation }: { position: THREE.Vector3; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Engine body - dark blue with saffron stripe */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.5, 0.35, 0.8]} />
        <meshStandardMaterial color="#1A237E" />
      </mesh>

      {/* Saffron stripe */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.52, 0.08, 0.82]} />
        <meshStandardMaterial color="#FF6F00" />
      </mesh>

      {/* Chimney */}
      <mesh position={[0, 0.5, -0.2]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.2, 8]} />
        <meshStandardMaterial color="#37474F" />
      </mesh>

      {/* Cabin */}
      <mesh position={[0, 0.4, 0.25]} castShadow>
        <boxGeometry args={[0.45, 0.2, 0.3]} />
        <meshStandardMaterial color="#283593" />
      </mesh>

      {/* Front buffer */}
      <mesh position={[0, 0.12, -0.45]}>
        <boxGeometry args={[0.4, 0.1, 0.08]} />
        <meshStandardMaterial color="#455A64" metalness={0.6} />
      </mesh>

      {/* Wheels */}
      {[-0.2, 0.2].map((wz, i) => (
        <group key={i}>
          <mesh position={[-0.28, 0.08, wz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 0.04, 12]} />
            <meshStandardMaterial color="#212121" />
          </mesh>
          <mesh position={[0.28, 0.08, wz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 0.04, 12]} />
            <meshStandardMaterial color="#212121" />
          </mesh>
        </group>
      ))}

      {/* Carriage 1 */}
      <group position={[0, 0, 0.9]}>
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[0.45, 0.3, 0.7]} />
          <meshStandardMaterial color="#C62828" />
        </mesh>
        {/* Windows */}
        {[-0.15, 0.05, 0.2].map((wz, i) => (
          <mesh key={i} position={[0.24, 0.28, wz]}>
            <boxGeometry args={[0.02, 0.1, 0.1]} />
            <meshStandardMaterial color="#B3E5FC" />
          </mesh>
        ))}
        {/* Wheels */}
        {[-0.2, 0.2].map((wz, i) => (
          <group key={i}>
            <mesh position={[-0.25, 0.08, wz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.07, 0.07, 0.04, 12]} />
              <meshStandardMaterial color="#212121" />
            </mesh>
            <mesh position={[0.25, 0.08, wz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.07, 0.07, 0.04, 12]} />
              <meshStandardMaterial color="#212121" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Carriage 2 */}
      <group position={[0, 0, 1.7]}>
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[0.45, 0.3, 0.7]} />
          <meshStandardMaterial color="#1565C0" />
        </mesh>
        {[-0.15, 0.05, 0.2].map((wz, i) => (
          <mesh key={i} position={[0.24, 0.28, wz]}>
            <boxGeometry args={[0.02, 0.1, 0.1]} />
            <meshStandardMaterial color="#B3E5FC" />
          </mesh>
        ))}
        {[-0.2, 0.2].map((wz, i) => (
          <group key={i}>
            <mesh position={[-0.25, 0.08, wz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.07, 0.07, 0.04, 12]} />
              <meshStandardMaterial color="#212121" />
            </mesh>
            <mesh position={[0.25, 0.08, wz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.07, 0.07, 0.04, 12]} />
              <meshStandardMaterial color="#212121" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export function Train() {
  const trainPath = useGameStore((s) => s.trainPath);
  const trainRunning = useGameStore((s) => s.trainRunning);
  const trainProgress = useGameStore((s) => s.trainProgress);
  const setTrainProgress = useGameStore((s) => s.setTrainProgress);
  const setTrainRunning = useGameStore((s) => s.setTrainRunning);
  const setGameMode = useGameStore((s) => s.setGameMode);
  const setCurrentStationIndex = useGameStore((s) => s.setCurrentStationIndex);
  const heightmap = useGameStore((s) => s.heightmap);
  const gridWidth = useGameStore((s) => s.gridWidth);
  const gridHeight = useGameStore((s) => s.gridHeight);
  const stations = useGameStore((s) => s.stations);

  const groupRef = useRef<THREE.Group>(null);

  // Pre-compute world positions for the path
  const pathPositions = useMemo(() => {
    if (!heightmap || trainPath.length === 0) return [];
    return trainPath.map((cell) => {
      const row = Math.floor(cell / gridWidth);
      const col = cell % gridWidth;
      const elev = heightmap[row * gridWidth + col] || 0;
      return new THREE.Vector3(
        col - gridWidth / 2 + 0.5,
        elev * 0.5 + 0.12,
        row - gridHeight / 2 + 0.5
      );
    });
  }, [trainPath, heightmap, gridWidth, gridHeight]);

  // Station cell indices for progress tracking
  const stationCells = useMemo(() => {
    return stations.map((s) => s.row * gridWidth + s.col);
  }, [stations, gridWidth]);

  useFrame((_, delta) => {
    if (!trainRunning || pathPositions.length < 2) return;

    const speed = 0.15; // progress per second
    const newProgress = Math.min(trainProgress + delta * speed / pathPositions.length * 30, 1);
    setTrainProgress(newProgress);

    // Check which station we've passed
    const currentIdx = Math.floor(newProgress * (pathPositions.length - 1));
    const currentCell = trainPath[Math.min(currentIdx, trainPath.length - 1)];
    for (let i = 0; i < stationCells.length; i++) {
      if (currentCell === stationCells[i]) {
        setCurrentStationIndex(i);
      }
    }

    if (newProgress >= 1) {
      setTrainRunning(false);
      setCurrentStationIndex(stations.length - 1);
    }
  });

  if (!trainRunning || pathPositions.length < 2 || !heightmap) return null;

  // Interpolate position
  const t = trainProgress * (pathPositions.length - 1);
  const idx = Math.floor(t);
  const frac = t - idx;
  const idx0 = Math.min(idx, pathPositions.length - 1);
  const idx1 = Math.min(idx + 1, pathPositions.length - 1);

  const pos = new THREE.Vector3().lerpVectors(pathPositions[idx0], pathPositions[idx1], frac);

  // Calculate rotation from direction
  const dir = new THREE.Vector3().subVectors(pathPositions[idx1], pathPositions[idx0]);
  const rotation = dir.length() > 0.001 ? Math.atan2(dir.x, dir.z) : 0;

  return (
    <group ref={groupRef}>
      <TrainModel position={pos} rotation={rotation} />
    </group>
  );
}
