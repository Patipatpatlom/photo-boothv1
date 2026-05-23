'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 200;

export default function FloatingParticles() {
  const meshRef = useRef<THREE.Points>(null);

  const { positions, speeds, colors } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    const neonColors = [
      new THREE.Color('hsl(315, 100%, 65%)'), // pink
      new THREE.Color('hsl(185, 100%, 60%)'), // cyan
      new THREE.Color('hsl(270, 100%, 70%)'), // purple
      new THREE.Color('hsl(45, 100%, 60%)'),  // gold
      new THREE.Color('hsl(220, 15%, 80%)'),  // silver
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 20; // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 3; // z (behind booth)

      speeds[i] = 0.15 + Math.random() * 0.35;

      const col = neonColors[Math.floor(Math.random() * neonColors.length)];
      colors[i * 3]     = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    return { positions, speeds, colors };
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const pos = geo.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Gentle upward drift + sinusoidal sway
      pos[i * 3 + 1] += speeds[i] * 0.008;
      pos[i * 3]     += Math.sin(t * 0.3 + i * 0.1) * 0.002;

      // Wrap around vertically
      if (pos[i * 3 + 1] > 7) {
        pos[i * 3 + 1] = -7;
      }
    }

    geo.attributes.position.needsUpdate = true;
    meshRef.current.rotation.y = t * 0.02;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        vertexColors
        transparent
        opacity={0.75}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
