'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import PhotoBoothModel from './PhotoBoothModel';
import FloatingParticles from './FloatingParticles';

interface SceneContainerProps {
  isZooming: boolean;
  isCurtainOpen: boolean;
  onBoothClick: () => void;
  onZoomComplete: () => void;
}

// Camera Rig component to handle smooth zoom and drift
function CameraRig({ isZooming, onZoomComplete }: { isZooming: boolean; onZoomComplete: () => void }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0.2, 5.2));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));
  const currentLook = useRef(new THREE.Vector3(0, 0, 0));
  const hasTriggeredComplete = useRef(false);

  // Mouse parallax values
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isZooming) return;
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 0.5;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 0.3;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isZooming]);

  useEffect(() => {
    if (isZooming) {
      // Zoom directly into the camera lens and screen area of the kiosk
      targetPos.current.set(0, 0.35, 1.0); 
      targetLook.current.set(0, 0.35, 0.3);
      hasTriggeredComplete.current = false;
    } else {
      targetPos.current.set(0, 0.2, 5.2);
      targetLook.current.set(0, 0, 0);
    }
  }, [isZooming]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const lerpSpeed = isZooming ? 0.08 : 0.04;

    // Standard floating camera position in lobby
    const currentTargetPos = targetPos.current.clone();
    if (!isZooming) {
      // Gentle slow orbit bobbing + mouse parallax
      currentTargetPos.x += Math.sin(t * 0.4) * 0.15 + mouse.current.x;
      currentTargetPos.y += Math.cos(t * 0.3) * 0.08 - mouse.current.y;
    }

    // Lerp camera position
    camera.position.lerp(currentTargetPos, lerpSpeed);

    // Lerp lookAt target
    currentLook.current.lerp(targetLook.current, lerpSpeed);
    camera.lookAt(currentLook.current);

    // Check if zoom is complete
    if (isZooming && !hasTriggeredComplete.current) {
      const distance = camera.position.distanceTo(targetPos.current);
      if (distance < 0.08) {
        hasTriggeredComplete.current = true;
        // Trigger completion callback
        setTimeout(onZoomComplete, 100);
      }
    }
  });

  return null;
}

export default function SceneContainer({ isZooming, isCurtainOpen, onBoothClick, onZoomComplete }: SceneContainerProps) {
  return (
    <div className="w-full h-full relative overflow-hidden select-none">
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        className="w-full h-full bg-[#05050c]"
      >
        <PerspectiveCamera makeDefault fov={50} far={100} near={0.1} />
        
        {/* Ambient base lighting */}
        <ambientLight intensity={0.4} />

        {/* Dynamic Studio Spotlighting to showcase metal reflections */}
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        {/* Soft fill light */}
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />

        {/* Neon accent glows */}
        <pointLight
          position={[-2.5, 1.8, 1.5]}
          color="#ff00cc"
          intensity={6.0}
          distance={8}
          decay={1.8}
        />
        <pointLight
          position={[2.5, 1.8, 1.5]}
          color="#00ffee"
          intensity={5.0}
          distance={8}
          decay={1.8}
        />
        
        {/* Glow light at base */}
        <pointLight
          position={[0, -2.2, 2.0]}
          color="#aa00ff"
          intensity={4.0}
          distance={6}
          decay={2.0}
        />

        {/* 3D Elements */}
        <FloatingParticles />
        <PhotoBoothModel onBoothClick={onBoothClick} isZooming={isZooming} isCurtainOpen={isCurtainOpen} />

        {/* Controls: only enable OrbitControls in lobby for freedom, disable when zooming */}
        {!isZooming && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI / 2 + 0.1}
            minPolarAngle={Math.PI / 3}
            maxAzimuthAngle={Math.PI / 4}
            minAzimuthAngle={-Math.PI / 4}
            rotateSpeed={0.6}
          />
        )}

        <CameraRig isZooming={isZooming} onZoomComplete={onZoomComplete} />
      </Canvas>
    </div>
  );
}
