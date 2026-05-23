'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useMotionValue, useSpring } from 'framer-motion';
import * as THREE from 'three';

// Heavy spring config for weighty parallax tracking
const SPRING_CONFIG = { stiffness: 35, damping: 18, mass: 2.5 };

// Materials styled after the white wood-paneled "PHOTOPLACE" booth
const whitePaintMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#fafafa'), // off-white matte paint
  metalness: 0.05,
  roughness: 0.55,
});

const darkTrimMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#1c1c1f'), // off-black screen frame/slots
  metalness: 0.3,
  roughness: 0.4,
});

const activeLedMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#ffffff'), // glowing white stadium/side bars
});

const lensGlassMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#0a0a20'),
  metalness: 0.9,
  roughness: 0.05,
  envMapIntensity: 4,
});

const polishedChromeMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#d0d6e2'), // shiny metal lens ring & coin reader plate
  metalness: 0.95,
  roughness: 0.12,
  envMapIntensity: 2.5,
});

// A component representing a single pleated fold of the fabric curtain
function CurtainPleat({ index, total = 12, progressRef }: { index: number; total?: number; progressRef: React.MutableRefObject<number> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Curved path parameters centered at x = 0, z = 0.28
  const rCurtain = 0.50;
  const zCenter = 0.28;
  
  const thetaStart = -1.85;    // Wraps cleanly around the left edge of the kiosk
  const thetaEndClosed = 0.40; // Spans across center to cover screen and camera lens
  const thetaEndOpen = -1.45;  // Compresses tightly to the far left corner

  useFrame(() => {
    if (!meshRef.current) return;
    const progress = progressRef.current;
    
    // Smoothly calculate angle position along the curve
    const currentThetaEnd = THREE.MathUtils.lerp(thetaEndClosed, thetaEndOpen, progress);
    const theta = thetaStart + (index / (total - 1)) * (currentThetaEnd - thetaStart);
    
    // Position on the circular arc in the XZ plane
    const x = rCurtain * Math.sin(theta);
    const z = zCenter + rCurtain * Math.cos(theta);
    
    // Scale on X axis squashes when open to represent folded fabric
    const scaleX = THREE.MathUtils.lerp(1.0, 0.15, progress);
    
    meshRef.current.position.set(x, 0.34, z);
    
    // Set rotation so each pleat faces outwards (radial to the curve)
    // plus alternate rotation slightly to create beautiful 3D pleated accordion-wave folds
    const pleatWaveAngle = index % 2 === 0 ? 0.35 : -0.35;
    const currentWaveAngle = pleatWaveAngle * (1.0 - progress * 0.6);
    
    meshRef.current.rotation.set(0, theta + currentWaveAngle, 0);
    meshRef.current.scale.set(scaleX, 1, 1);
  });

  return (
    <mesh ref={meshRef} castShadow>
      <boxGeometry args={[0.11, 1.28, 0.03]} />
      <meshStandardMaterial color="#f0ede6" roughness={0.95} metalness={0.0} />
    </mesh>
  );
}

interface PhotoBoothModelProps {
  onBoothClick: () => void;
  isZooming: boolean;
  isCurtainOpen: boolean;
}

export default function PhotoBoothModel({ onBoothClick, isZooming, isCurtainOpen }: PhotoBoothModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { size } = useThree();
  const curtainProgressRef = useRef(0);

  // Procedural canvas texture for the round dome canopy header ("PHOTOPLACE")
  const photoplaceHeaderTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // White glossy background
      ctx.fillStyle = '#fafafa';
      ctx.fillRect(0, 0, 512, 128);

      // Draw elegant bold font "PHOTOPLACE" (retro serif matching the reference photo)
      ctx.fillStyle = '#0f1118';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 54px "Didot", "Georgia", serif';
      ctx.fillText('PHOTOPLACE', 256, 64);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // Procedural red horizontal screen display texture ("PHOTO PLACE")
  const photoPlaceRedScreenTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 340;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Red background
      ctx.fillStyle = '#d61c1c';
      ctx.fillRect(0, 0, 512, 340);

      // Yellow/orange decorative border lines
      ctx.strokeStyle = '#fca311';
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, 492, 320);

      // Main logo "PHOTO PLACE"
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 56px "Didot", "Georgia", serif';
      ctx.fillText('PHOTO', 256, 110);
      ctx.fillText('PLACE', 256, 175);

      // Click to start button subtext
      ctx.fillStyle = '#fca311';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('CLICK HERE TO START PHOTO', 256, 250);

      // Draw a cute small pointer hand icon pointing at the button
      ctx.fillStyle = '#ffffff';
      const hx = 256;
      const hy = 280;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx - 8, hy + 15);
      ctx.lineTo(hx - 3, hy + 15);
      ctx.lineTo(hx - 3, hy + 25);
      ctx.lineTo(hx + 3, hy + 25);
      ctx.lineTo(hx + 3, hy + 15);
      ctx.lineTo(hx + 8, hy + 15);
      ctx.closePath();
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // Procedural dynamic texture for the hanging printed photo strip
  const hangingStripTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // White polaroid paper
      ctx.fillStyle = '#faf8f2';
      ctx.fillRect(0, 0, 128, 512);

      // Draw 4 mini vertical photos
      const photoW = 100;
      const photoH = 75;
      const startY = 20;
      const gap = 15;

      for (let i = 0; i < 4; i++) {
        const y = startY + i * (photoH + gap);
        // Photo grey background
        ctx.fillStyle = '#2d2d2d';
        ctx.fillRect(14, y, photoW, photoH);

        // Draw cute retro outline figure inside each shot
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Head
        ctx.arc(64, y + 25, 12, 0, Math.PI * 2);
        // Body shoulders
        ctx.arc(64, y + 55, 18, Math.PI, 0);
        ctx.stroke();

        ctx.fillStyle = '#ffe8a0';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`SNAP ${i+1}`, 64, y + 42);
      }

      // Barcode at bottom
      ctx.fillStyle = '#111111';
      let bx = 20;
      while (bx < 108) {
        const w = Math.floor(Math.random() * 3) + 1;
        ctx.fillRect(bx, 480, w, 15);
        bx += w + Math.floor(Math.random() * 3) + 1;
      }

      ctx.fillStyle = '#ff00cc';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('waterbean', 64, 470);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // Framer Motion values for magnetic mouse tracking
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);
  const springX = useSpring(rawMouseX, SPRING_CONFIG);
  const springY = useSpring(rawMouseY, SPRING_CONFIG);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isZooming) return;
    rawMouseX.set(((e.clientX / size.width) - 0.5) * 2);
    rawMouseY.set(((e.clientY / size.height) - 0.5) * 2);
  }, [rawMouseX, rawMouseY, size, isZooming]);

  // Mobile: gyro / touch
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isZooming || !e.touches[0]) return;
    rawMouseX.set(((e.touches[0].clientX / size.width) - 0.5) * 2);
    rawMouseY.set(((e.touches[0].clientY / size.height) - 0.5) * 2);
  }, [rawMouseX, rawMouseY, size, isZooming]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      document.body.style.cursor = 'auto';
    };
  }, [handleMouseMove, handleTouchMove]);

  useFrame((state) => {
    // Smooth lerp curtain open progress: 1.0 when open, 0.0 when closed
    const targetProgress = isCurtainOpen ? 1.0 : 0.0;
    curtainProgressRef.current = THREE.MathUtils.lerp(
      curtainProgressRef.current,
      targetProgress,
      0.08
    );

    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    if (!isZooming) {
      // Idle float — gentle sine bob
      groupRef.current.position.y = Math.sin(t * 0.65) * 0.05;

      // Magnetic mouse rotation with spring physics
      groupRef.current.rotation.y = springX.get() * 0.22;
      groupRef.current.rotation.x = -springY.get() * 0.10;

      // Subtle roll oscillation for liveliness
      groupRef.current.rotation.z = Math.sin(t * 0.3) * 0.008;
    } else {
      // Align perfect rotation when zoomed
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 0.1);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.1);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.1);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1);
    }
  });

  return (
    <group
      onPointerOver={() => {
        if (!isZooming) document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* ── STATIC ENVIRONMENT BACKGROUNDS ── */}
      {/* Forest Green Wood Panel Backdrop Wall */}
      <group position={[0, 0.3, -0.9]}>
        {Array.from({ length: 14 }).map((_, i) => {
          const xPos = (i - 6.5) * 0.44;
          return (
            <mesh key={`plank-${i}`} position={[xPos, 0.1, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.41, 3.4, 0.05]} />
              <meshStandardMaterial color="#1a3b2b" roughness={0.75} metalness={0.05} />
            </mesh>
          );
        })}
        {/* Dark backboard support to block any light leaks between cracks */}
        <mesh position={[0, 0.1, -0.04]}>
          <boxGeometry args={[6.2, 3.4, 0.02]} />
          <meshStandardMaterial color="#0b1b13" roughness={0.9} />
        </mesh>
      </group>

      {/* Checkerboard Tiled Floor */}
      <group position={[0, -1.35, 0.6]}>
        {Array.from({ length: 12 }).map((_, ix) => 
          Array.from({ length: 12 }).map((_, iz) => {
            const xPos = (ix - 5.5) * 0.45;
            const zPos = (iz - 5.5) * 0.45;
            const isWhite = (ix + iz) % 2 === 0;
            return (
              <mesh key={`tile-${ix}-${iz}`} position={[xPos, 0, zPos]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[0.44, 0.44]} />
                <meshStandardMaterial
                  color={isWhite ? '#eeeeee' : '#141416'}
                  roughness={0.25}
                  metalness={0.05}
                />
              </mesh>
            );
          })
        )}
      </group>

      {/* Wicker Props Basket & Red Heart Glasses Frame */}
      <group position={[-0.68, -1.19, 0.65]}>
        {/* Basket container */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.18, 0.13, 0.32, 16]} />
          <meshStandardMaterial color="#bfa37a" roughness={0.9} />
        </mesh>
        {/* Rim overlay */}
        <mesh position={[0, 0.16, 0]}>
          <torusGeometry args={[0.18, 0.015, 8, 24]} />
          <meshStandardMaterial color="#a68453" roughness={0.9} />
        </mesh>

        {/* Heart Glasses inside the props basket */}
        <group position={[0, 0.165, 0.02]} rotation={[0.4, 0.3, 0.1]}>
          {/* Glass frame left eye */}
          <mesh position={[-0.045, 0, 0]} castShadow>
            <torusGeometry args={[0.038, 0.007, 8, 24]} />
            <meshStandardMaterial color="#e63946" roughness={0.15} metalness={0.1} />
          </mesh>
          {/* Glass frame right eye */}
          <mesh position={[0.045, 0, 0]} castShadow>
            <torusGeometry args={[0.038, 0.007, 8, 24]} />
            <meshStandardMaterial color="#e63946" roughness={0.15} metalness={0.1} />
          </mesh>
          {/* Glasses bridge */}
          <mesh position={[0, 0.005, 0]} castShadow>
            <boxGeometry args={[0.02, 0.008, 0.005]} />
            <meshStandardMaterial color="#e63946" roughness={0.15} metalness={0.1} />
          </mesh>
        </group>
      </group>


      {/* ── INTERACTIVE FLOATING KIOSK CABINET ── */}
      <group ref={groupRef} onClick={onBoothClick}>
        
        {/* Kiosk Main Stand (Matte White Wood Paint) */}
        <mesh position={[0, -0.2, 0]} material={whitePaintMaterial} castShadow receiveShadow>
          <boxGeometry args={[0.94, 2.3, 0.54]} />
        </mesh>

        {/* Round Dome Canopy Roof Back Support */}
        <mesh position={[0, 1.05, 0.05]} material={whitePaintMaterial} castShadow>
          <boxGeometry args={[0.94, 0.3, 0.54]} />
        </mesh>

        {/* Curved Fascia Front Dome Header */}
        <mesh position={[0, 1.12, 0.28]} material={whitePaintMaterial} castShadow>
          <cylinderGeometry args={[0.54, 0.54, 0.3, 24, 1, false, -Math.PI/2, Math.PI]} />
        </mesh>
        {/* Branding text "PHOTOPLACE" mapped to curved cylinder fascia */}
        <mesh position={[0, 1.12, 0.282]}>
          <cylinderGeometry args={[0.542, 0.542, 0.3, 24, 1, true, -Math.PI/3, Math.PI/1.5]} />
          <meshBasicMaterial map={photoplaceHeaderTexture || undefined} side={THREE.DoubleSide} transparent />
        </mesh>

        {/* Display Screen Zone */}
        {/* Monitor Bezel Frame */}
        <mesh position={[0, 0.05, 0.275]} material={darkTrimMaterial} castShadow>
          <boxGeometry args={[0.74, 0.52, 0.02]} />
        </mesh>
        {/* Screen glass display map (Reference red screen) */}
        <mesh position={[0, 0.05, 0.286]}>
          <planeGeometry args={[0.7, 0.48]} />
          <meshBasicMaterial map={photoPlaceRedScreenTexture || undefined} />
        </mesh>

        {/* Camera Lens Zone (positioned above the display screen) */}
        <mesh position={[0, 0.35, 0.275]} material={darkTrimMaterial} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
        </mesh>
        <mesh position={[0, 0.35, 0.286]} rotation={[Math.PI / 2, 0, 0]} material={polishedChromeMaterial}>
          <torusGeometry args={[0.06, 0.015, 8, 24]} />
        </mesh>
        <mesh position={[0, 0.35, 0.292]} rotation={[Math.PI / 2, 0, 0]} material={lensGlassMaterial}>
          <circleGeometry args={[0.05, 24]} />
        </mesh>
        {/* Live Active LED Indicator (Soft Green Blink) */}
        <mesh position={[0.035, 0.38, 0.295]} material={new THREE.MeshBasicMaterial({ color: '#00ff33' })}>
          <sphereGeometry args={[0.008, 8, 8]} />
        </mesh>

        {/* Dual Arched horizontal LED Stadium Lights (Smile shape above screen/lens) */}
        {/* Left LED Stadium Light */}
        <mesh position={[-0.14, 0.48, 0.28]} rotation={[0, 0, Math.PI / 2]} material={activeLedMaterial}>
          <capsuleGeometry args={[0.03, 0.18, 4, 8]} />
        </mesh>
        <mesh position={[-0.14, 0.48, 0.274]} rotation={[0, 0, Math.PI / 2]} material={polishedChromeMaterial}>
          <capsuleGeometry args={[0.035, 0.2, 4, 8]} />
        </mesh>
        {/* Right LED Stadium Light */}
        <mesh position={[0.14, 0.48, 0.28]} rotation={[0, 0, Math.PI / 2]} material={activeLedMaterial}>
          <capsuleGeometry args={[0.03, 0.18, 4, 8]} />
        </mesh>
        <mesh position={[0.14, 0.48, 0.274]} rotation={[0, 0, Math.PI / 2]} material={polishedChromeMaterial}>
          <capsuleGeometry args={[0.035, 0.2, 4, 8]} />
        </mesh>

        {/* ── PLEATED CREAM FABRIC CURTAIN (Slides open when kiosk is clicked/zoomed) ── */}
        {/* Curved Curtain rail track bar built out of circular cylinder segments */}
        {Array.from({ length: 20 }).map((_, i) => {
          const tStart = -1.85;
          const tEnd = 0.40;
          const t1 = tStart + (i / 20) * (tEnd - tStart);
          const t2 = tStart + ((i + 1) / 20) * (tEnd - tStart);
          const rCurtain = 0.50;
          const zCenter = 0.28;
          
          const x1 = rCurtain * Math.sin(t1);
          const z1 = zCenter + rCurtain * Math.cos(t1);
          const x2 = rCurtain * Math.sin(t2);
          const z2 = zCenter + rCurtain * Math.cos(t2);
          
          const dx = x2 - x1;
          const dz = z2 - z1;
          const len = Math.sqrt(dx * dx + dz * dz);
          const angle = Math.atan2(dx, dz);
          
          return (
            <mesh
              key={`rail-${i}`}
              position={[(x1 + x2) / 2, 0.98, (z1 + z2) / 2]}
              rotation={[0, angle, Math.PI / 2]}
              material={polishedChromeMaterial}
            >
              <cylinderGeometry args={[0.008, 0.008, len + 0.002, 8]} />
            </mesh>
          );
        })}
        
        {Array.from({ length: 12 }).map((_, i) => (
          <CurtainPleat key={`pleat-${i}`} index={i} progressRef={curtainProgressRef} />
        ))}

        {/* Slanted Console Shelf Desk Ledger */}
        <mesh position={[0, -0.32, 0.36]} rotation={[0.18, 0, 0]} material={whitePaintMaterial} castShadow>
          <boxGeometry args={[0.94, 0.06, 0.24]} />
        </mesh>
        {/* Trim line on console desk */}
        <mesh position={[0, -0.3, 0.47]} rotation={[0.18, 0, 0]} material={darkTrimMaterial}>
          <boxGeometry args={[0.94, 0.012, 0.02]} />
        </mesh>

        {/* Lower Console Plate Elements */}
        {/* Left side: Coin Slot Collector */}
        <mesh position={[-0.22, -0.85, 0.275]} material={polishedChromeMaterial} castShadow>
          <boxGeometry args={[0.16, 0.22, 0.01]} />
        </mesh>
        <mesh position={[-0.22, -0.85, 0.281]} material={darkTrimMaterial}>
          <boxGeometry args={[0.02, 0.12, 0.005]} />
        </mesh>
        <mesh position={[-0.22, -0.85, 0.284]} material={new THREE.MeshBasicMaterial({ color: '#00ffee' })}>
          <boxGeometry args={[0.005, 0.08, 0.002]} />
        </mesh>

        {/* Right side: Printed output slot with physical strip hanging out */}
        <mesh position={[0.22, -0.85, 0.275]} material={darkTrimMaterial} castShadow>
          <boxGeometry args={[0.24, 0.12, 0.01]} />
        </mesh>
        <mesh position={[0.22, -0.85, 0.281]} material={new THREE.MeshBasicMaterial({ color: '#050508' })}>
          <boxGeometry args={[0.18, 0.018, 0.005]} />
        </mesh>

        {/* Hanging Printed Photo Strip Ribbon */}
        <mesh position={[0.22, -1.25, 0.32]} rotation={[0.08, -0.08, -0.05]} castShadow>
          <planeGeometry args={[0.18, 0.75]} />
          <meshStandardMaterial map={hangingStripTexture || undefined} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>

      </group>
    </group>
  );
}
