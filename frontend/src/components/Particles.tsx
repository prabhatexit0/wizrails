import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store';

export function DustParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const gridHeight = useGameStore((s) => s.gridHeight);

  const count = 200;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 24;
      arr[i * 3 + 1] = Math.random() * 3 + 0.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * gridHeight * 0.3 + gridHeight * 0.35; // bias toward Delhi
    }
    return arr;
  }, [gridHeight]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      // Gentle drift
      pos.array[i * 3] += Math.sin(Date.now() * 0.001 + i) * delta * 0.1;
      pos.array[i * 3 + 1] += Math.sin(Date.now() * 0.0005 + i * 0.5) * delta * 0.05;
    }
    pos.needsUpdate = true;
  });

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
        color="#D4C5A9"
        size={0.05}
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

export function MistParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const gridHeight = useGameStore((s) => s.gridHeight);

  const count = 150;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 24;
      arr[i * 3 + 1] = Math.random() * 4 + 2;
      arr[i * 3 + 2] = (Math.random() - 0.5) * gridHeight * 0.3 - gridHeight * 0.3; // bias toward Shimla
    }
    return arr;
  }, [gridHeight]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      pos.array[i * 3] += delta * 0.15;
      if (pos.array[i * 3] > 12) pos.array[i * 3] = -12;
      pos.array[i * 3 + 1] += Math.sin(Date.now() * 0.001 + i) * delta * 0.03;
    }
    pos.needsUpdate = true;
  });

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
        color="#B0BEC5"
        size={0.15}
        transparent
        opacity={0.25}
        sizeAttenuation
      />
    </points>
  );
}
