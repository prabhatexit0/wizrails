import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../store';

function getTerrainColor(elevation: number, row: number): THREE.Color {
  if (row >= 30) {
    // Delhi: dusty golden-green
    const t = Math.min(elevation / 1.0, 1);
    return new THREE.Color().lerpColors(
      new THREE.Color(0.76, 0.7, 0.42), // dusty gold
      new THREE.Color(0.55, 0.65, 0.35), // muted green
      t
    );
  } else if (row >= 16) {
    // Punjab: lush green farmland
    const t = Math.min(elevation / 2.5, 1);
    return new THREE.Color().lerpColors(
      new THREE.Color(0.35, 0.65, 0.2), // bright green
      new THREE.Color(0.45, 0.55, 0.25), // darker green
      t
    );
  } else if (row >= 8) {
    // Foothills: green to rocky brown
    const t = Math.min(elevation / 5.0, 1);
    return new THREE.Color().lerpColors(
      new THREE.Color(0.4, 0.55, 0.25), // green
      new THREE.Color(0.55, 0.45, 0.3), // rocky brown
      t
    );
  } else {
    // Mountains: rocky grey-brown to snow
    const t = Math.min(elevation / 12.0, 1);
    return new THREE.Color().lerpColors(
      new THREE.Color(0.5, 0.42, 0.32), // brown rock
      new THREE.Color(0.85, 0.88, 0.92), // snow white
      t
    );
  }
}

export function Terrain() {
  const heightmap = useGameStore((s) => s.heightmap);
  const gridWidth = useGameStore((s) => s.gridWidth);
  const gridHeight = useGameStore((s) => s.gridHeight);
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      gridWidth,
      gridHeight,
      gridWidth - 1,
      gridHeight - 1
    );
    geo.rotateX(-Math.PI / 2);

    if (heightmap) {
      const pos = geo.attributes.position;
      const colors = new Float32Array(pos.count * 3);

      for (let i = 0; i < pos.count; i++) {
        const col = i % gridWidth;
        const row = Math.floor(i / gridWidth);
        const elev = heightmap[row * gridWidth + col] || 0;

        // Y is up after rotation
        pos.setY(i, elev * 0.5); // scale down for visual

        const color = getTerrainColor(elev, row);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.computeVertexNormals();
    }

    return geo;
  }, [heightmap, gridWidth, gridHeight]);

  if (!heightmap) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} flatShading />
    </mesh>
  );
}
