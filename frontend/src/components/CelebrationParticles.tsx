import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store';

export function CelebrationParticles() {
  const currentStationIndex = useGameStore((s) => s.currentStationIndex);
  const stations = useGameStore((s) => s.stations);
  const heightmap = useGameStore((s) => s.heightmap);
  const gridWidth = useGameStore((s) => s.gridWidth);
  const gridHeight = useGameStore((s) => s.gridHeight);
  const trainRunning = useGameStore((s) => s.trainRunning);

  const [activeStation, setActiveStation] = useState(-1);
  const [startTime, setStartTime] = useState(0);
  const pointsRef = useRef<THREE.Points>(null);

  useEffect(() => {
    if (trainRunning && currentStationIndex !== activeStation && currentStationIndex >= 0) {
      setActiveStation(currentStationIndex);
      setStartTime(Date.now());
    }
  }, [currentStationIndex, trainRunning, activeStation]);

  const count = 60;
  const { positions, velocities, center } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    let cx = 0, cy = 1, cz = 0;
    if (activeStation >= 0 && activeStation < stations.length && heightmap) {
      const s = stations[activeStation];
      const elev = heightmap[s.row * gridWidth + s.col] || 0;
      cx = s.col - gridWidth / 2 + 0.5;
      cy = elev * 0.5 + 1;
      cz = s.row - gridHeight / 2 + 0.5;
    }

    for (let i = 0; i < count; i++) {
      pos[i * 3] = cx;
      pos[i * 3 + 1] = cy;
      pos[i * 3 + 2] = cz;
      vel[i * 3] = (Math.random() - 0.5) * 3;
      vel[i * 3 + 1] = Math.random() * 4 + 1;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }

    return { positions: pos, velocities: vel, center: [cx, cy, cz] };
  }, [activeStation, stations, heightmap, gridWidth, gridHeight]);

  useFrame((_, delta) => {
    if (!pointsRef.current || activeStation < 0) return;

    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed > 2.5) return; // particles last 2.5 seconds

    const pos = pointsRef.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      pos.array[i * 3] += velocities[i * 3] * delta;
      pos.array[i * 3 + 1] += velocities[i * 3 + 1] * delta - 3 * delta * elapsed;
      pos.array[i * 3 + 2] += velocities[i * 3 + 2] * delta;
    }
    pos.needsUpdate = true;

    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = Math.max(0, 1 - elapsed / 2.5);
  });

  if (activeStation < 0 || !trainRunning) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#FF6F00"
        size={0.12}
        transparent
        opacity={1}
        sizeAttenuation
      />
    </points>
  );
}
