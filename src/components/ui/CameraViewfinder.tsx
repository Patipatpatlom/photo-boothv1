'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CameraViewfinderProps {
  activeFilter: string;
  isCapturing: boolean;
  countdownNumber: number | null;
  totalPoses: number;
  onPhotosCaptured: (photos: string[]) => void;
  playBeepSound: (isFinal: boolean) => void;
  playShutterSound: () => void;
}

export default function CameraViewfinder({
  activeFilter,
  isCapturing,
  countdownNumber,
  totalPoses,
  onPhotosCaptured,
  playBeepSound,
  playShutterSound,
}: CameraViewfinderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedThumbnails, setCapturedThumbnails] = useState<string[]>([]);
  const [flash, setFlash] = useState<boolean>(false);
  const [currentShotNumber, setCurrentShotNumber] = useState<number>(0);
  const [systemTime, setSystemTime] = useState<string>('00:00:00');

  // Synchronize date-time text in viewfinder
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Web camera activation
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    async function startCamera() {
      try {
        setErrorMessage(null);
        const constraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
        };
        
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (initialErr) {
          console.warn("Retrying with simple video constraints due to initial failure:", initialErr);
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          activeStream = stream;
          
          const playVideo = () => {
            videoRef.current?.play()
              .then(() => {
                setStreamActive(true);
              })
              .catch((playErr) => {
                console.warn("Explicit video play caught by browser policies:", playErr);
                setStreamActive(true);
              });
          };

          videoRef.current.onloadedmetadata = playVideo;
          // Trigger play immediately as well to cover all browser event variations
          playVideo();
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setErrorMessage("CAMERA UNAVAILABLE — INITIATING RETRO DIGITAL VISUALIZER MODE");
        setStreamActive(false);
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Real-time canvas processing loop
  useEffect(() => {
    const video = videoRef.current;
    const liveCanvas = liveCanvasRef.current;
    if (!liveCanvas) return;
    const ctx = liveCanvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    // Fallback animation variables (e.g. rotating elements, bouncing dots)
    let angle = 0;
    const dots: Array<{ x: number; y: number; vx: number; vy: number; r: number }> = [];
    for (let i = 0; i < 15; i++) {
      dots.push({
        x: Math.random() * 640,
        y: Math.random() * 480,
        vx: (Math.random() - 0.5) * 2.5,
        vy: (Math.random() - 0.5) * 2.5,
        r: Math.random() * 4 + 2,
      });
    }

    const processFrame = () => {
      if (!liveCanvas || !ctx) return;

      const w = liveCanvas.width;
      const h = liveCanvas.height;

      // Check if webcam is actively streaming and feeding frames
      const isVideoReady = streamActive && video && video.readyState >= 2 && video.videoWidth > 0;

      // ── STEP 1: RENDER CAMERA BACKGROUND WITH FILTERS ──
      ctx.save();
      
      // Apply gorgeous high-end photographic filters to 2D Context natively
      let canvasFilter = 'none';
      if (activeFilter === 'vintage-warm') {
        canvasFilter = 'contrast(1.08) brightness(1.02) saturate(1.15) sepia(0.2) hue-rotate(5deg)';
      } else if (activeFilter === 'cyber-neon') {
        canvasFilter = 'contrast(1.12) saturate(1.35) hue-rotate(-15deg) brightness(0.98)';
      } else if (activeFilter === 'chrome-silver') {
        canvasFilter = 'contrast(1.35) grayscale(1) brightness(0.95)';
      } else if (activeFilter === 'dreamy-aura') {
        canvasFilter = 'contrast(0.98) brightness(1.04) saturate(1.2) sepia(0.06) hue-rotate(330deg)';
      }
      ctx.filter = canvasFilter;

      if (isVideoReady) {
        // Draw raw webcam feed mirrored & high resolution! (Zero ugly pixelation)
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, w, h);
      } else {
        // Draw gorgeous fallback retro digital visualizer
        ctx.fillStyle = '#070712';
        ctx.fillRect(0, 0, w, h);

        // Draw dynamic grid lines
        ctx.strokeStyle = 'rgba(0, 255, 238, 0.08)';
        ctx.lineWidth = 1;
        const grid = 40;
        for (let gx = 0; gx < w; gx += grid) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, h);
          ctx.stroke();
        }
        for (let gy = 0; gy < h; gy += grid) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(w, gy);
          ctx.stroke();
        }

        // Draw animated rotating scanner star/circle
        ctx.translate(w / 2, h / 2);
        ctx.rotate(angle);
        angle += 0.02;

        ctx.strokeStyle = 'rgba(255, 0, 204, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const r = 90 + Math.sin(angle * 3) * 12;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Draw bouncing digital vector dots
        ctx.restore();
        ctx.save();
        ctx.fillStyle = '#00ffee';
        dots.forEach((dot) => {
          dot.x += dot.vx;
          dot.y += dot.vy;
          if (dot.x < 0 || dot.x > w) dot.vx *= -1;
          if (dot.y < 0 || dot.y > h) dot.vy *= -1;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      ctx.restore();

      // ── STEP 2: SCANLINE CRT LINES OVERLAY ──
      ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
      for (let sy = 0; sy < h; sy += 3) {
        ctx.fillRect(0, sy, w, 1);
      }

      animId = requestAnimationFrame(processFrame);
    };

    animId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animId);
  }, [streamActive, activeFilter]);

  // Audio countdown beep triggers
  useEffect(() => {
    if (countdownNumber !== null) {
      if (countdownNumber > 0) {
        playBeepSound(false);
      } else if (countdownNumber === 0) {
        playBeepSound(true);
      }
    }
  }, [countdownNumber, playBeepSound]);

  // Photo-capture sequence initialization
  useEffect(() => {
    if (isCapturing) {
      setCapturedThumbnails([]);
      setCurrentShotNumber(1);
    }
  }, [isCapturing]);

  // Perform snapshot capture directly from processed live canvas
  const captureSnapshot = () => {
    const liveCanvas = liveCanvasRef.current;
    if (!liveCanvas) return;

    playShutterSound();
    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    // Grab the exact processed, face-concealing visual frame
    const imgData = liveCanvas.toDataURL('image/png');
    
    setCapturedThumbnails((prev) => {
      const updated = [...prev, imgData];
      if (updated.length === totalPoses) {
        setTimeout(() => onPhotosCaptured(updated), 800);
      } else {
        setCurrentShotNumber((num) => num + 1);
      }
      return updated;
    });
  };

  // Capture snapshot when countdown reaches zero
  useEffect(() => {
    if (countdownNumber === 0) {
      captureSnapshot();
    }
  }, [countdownNumber]);

  return (
    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden glass-panel border border-white/20 select-none shadow-[0_0_40px_rgba(0,0,0,0.8)]">
      
      {/* ── ACTIVE WEBCAM ELEMENT POSITIONED OFFSCREEN (Bypasses browser pause blocks!) ── */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '1px',
          height: '1px',
          opacity: 0.0001,
          pointerEvents: 'none',
        }}
      />

      {/* ── MAIN PROCESSED SECURE LIVE CANVAS (Shows only cyber face outlines) ── */}
      <canvas
        ref={liveCanvasRef}
        width={640}
        height={480}
        className="w-full h-full object-cover"
      />

      {/* ── RETRO VIEW-FINDER UI OVERLAYS ── */}
      <div className="absolute inset-0 p-5 flex flex-col justify-between pointer-events-none z-10 font-mono text-[10px] text-neon-cyan tracking-wider glow-cyan">
        {/* Top Header Deck */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-red-600 rounded-full animate-[pulse_1s_infinite]" />
            <span className="font-bold text-red-500 glow-pink">REC</span>
          </div>
          <div>THEBESTFILM LIVE // SECURE_PORTAL_{systemTime}</div>
          <div className="text-right">
            <div>ISO 400</div>
            <div>SHUTTER: 1/60</div>
          </div>
        </div>

        {/* Viewfinder Exposure Corner Cropmarks */}
        <div className="absolute inset-8 border border-white/5 flex flex-col justify-between">
          <div className="flex justify-between">
            <div className="w-4 h-4 border-t border-l border-neon-cyan" />
            <div className="w-4 h-4 border-t border-r border-neon-cyan" />
          </div>
          <div className="flex justify-between">
            <div className="w-4 h-4 border-b border-l border-neon-cyan" />
            <div className="w-4 h-4 border-b border-r border-neon-cyan" />
          </div>
        </div>

        {/* Center Grid Matrix Reticle */}
        <div className="absolute inset-0 flex items-center justify-center opacity-25">
          <div className="w-8 h-[1px] bg-neon-cyan" />
          <div className="h-8 w-[1px] bg-neon-cyan mx-3" />
          <div className="w-8 h-[1px] bg-neon-cyan" />
        </div>

        {/* Bottom Footer Deck */}
        <div className="flex justify-between items-end">
          <div>
            <div className="text-neon-pink glow-pink font-bold">
              FRAME_{currentShotNumber > 0 ? `0${currentShotNumber}` : 'READY'} / 0{totalPoses}
            </div>
            <div className="text-[9px] opacity-75">TAPE 003:SNAP{totalPoses}</div>
          </div>
          
          {/* Animated Y2K Cyber Battery bar */}
          <div className="flex items-center gap-1.5">
            <span>BATT</span>
            <div className="w-12 h-2.5 border border-neon-cyan p-0.5 flex gap-0.5">
              <div className="flex-1 bg-neon-cyan" />
              <div className="flex-1 bg-neon-cyan animate-[pulse_1.5s_infinite]" />
              <div className="flex-1 bg-neon-cyan animate-[pulse_2s_infinite]" />
            </div>
          </div>
        </div>
      </div>

      {/* ── WEBCAM DENIAL WARNING INDICATOR ── */}
      {errorMessage && (
        <div className="absolute top-4 left-4 right-4 z-20 glass-panel border border-neon-pink/40 p-2 text-center text-neon-pink text-[9px] font-mono tracking-widest bg-black/70 rounded flex items-center justify-center gap-2">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── INTERPOLATING LOBBY OR SHOT TRANSITIONS ── */}
      <AnimatePresence>
        {isCapturing && countdownNumber !== null && countdownNumber > 0 && (
          <motion.div
            key="countdown"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          >
            <div
              className="text-8xl font-bold font-display select-none glow-pink text-neon-pink animate-pulse"
              style={{ filter: 'drop-shadow(0 0 25px hsl(315, 100%, 60%))' }}
            >
              {countdownNumber}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MECHANICAL SHUTTER FLASH EFFECT ── */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-0 bg-white z-40 flex items-center justify-center pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* ── SIDE PANEL SLIDING SNAPSHOT THUMBNAILS ── */}
      <div className="absolute right-3 top-16 bottom-16 flex flex-col justify-center gap-3 z-20">
        {Array.from({ length: totalPoses }).map((_, idx) => {
          const photo = capturedThumbnails[idx];
          return (
            <div
              key={idx}
              className={`w-12 h-16 border rounded bg-black/40 overflow-hidden shadow-md flex items-center justify-center font-mono text-[8px] transition-all duration-300 ${
                photo ? 'border-neon-cyan' : 'border-white/10'
              }`}
            >
              {photo ? (
                <img src={photo} alt={`shot ${idx + 1}`} className="w-full h-full object-cover" />
              ) : (
                <span className="opacity-45 text-white/50">{`SHOT ${idx + 1}`}</span>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}

// Cleaned up Y2K stickers helper functions

