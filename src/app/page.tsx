'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SceneContainer from '@/components/scene/SceneContainer';
import LoadingScreen from '@/components/ui/LoadingScreen';
import CameraViewfinder from '@/components/ui/CameraViewfinder';
import PhotoStripResult, { PHOTO_LAYOUTS } from '@/components/ui/PhotoStripResult';
import { audio } from '@/components/ui/AudioEngine';

type AppState = 'LOBBY' | 'ZOOMING_IN' | 'INSIDE_BOOTH' | 'PRINTING' | 'RESULT';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('LOBBY');
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('vintage-warm');
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>('layout-c');
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [credits, setCredits] = useState<number>(4);
  const [insertAnim, setInsertAnim] = useState<boolean>(false);

  const currentLayout = PHOTO_LAYOUTS.find((l) => l.id === selectedLayoutId) || PHOTO_LAYOUTS[0];

  // Capture sequence state
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [countdownNumber, setCountdownNumber] = useState<number | null>(null);
  const templateScrollRef = useRef<HTMLDivElement>(null);

  // Initialize application and load resources
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Play lobby startup chime once loading screen finishes fading
      setTimeout(() => {
        audio.playLobbyChime();
      }, 500);
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  // Simulate printing time before showing result strip
  useEffect(() => {
    if (appState === 'PRINTING') {
      const timer = setTimeout(() => {
        setAppState('RESULT');
      }, 3500); // 3.5 seconds printing delay
      return () => clearTimeout(timer);
    }
  }, [appState]);

  // Enter sequence trigger (Insert Coin / Zoom in)
  const handleInsertCoin = () => {
    if (appState !== 'LOBBY' || credits <= 0) return;
    
    audio.playCoinInsert();
    setInsertAnim(true);
    
    // Animate coin drop, then trigger camera zoom swoosh
    setTimeout(() => {
      setCredits((prev) => Math.max(0, prev - 1));
      setAppState('ZOOMING_IN');
      audio.playZoomSwoop();
      setInsertAnim(false);
    }, 450);
  };

  // Click on the 3D booth triggers zoom as well
  const handleBoothClick = () => {
    if (appState === 'LOBBY') {
      handleInsertCoin();
    }
  };

  // Frame capture recursion sequence
  const startCaptureSequence = () => {
    if (isCapturing) return;
    audio.playClick();
    setIsCapturing(true);
    
    let currentShot = 0;
    const totalShots = currentLayout.poses;
    const accumulatedPhotos: string[] = [];

    const runShotSequence = () => {
      if (currentShot >= totalShots) {
        // Complete captures, transition to compiling/printing
        setTimeout(() => {
          setIsCapturing(false);
          setCountdownNumber(null);
          setAppState('PRINTING');
        }, 1000);
        return;
      }

      // 3-second countdown per shot
      let count = 3;
      setCountdownNumber(count);

      const countInterval = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setCountdownNumber(count);
        } else if (count === 0) {
          setCountdownNumber(0);
          clearInterval(countInterval);
          
          // Wait briefly after flash to queue next shot
          setTimeout(() => {
            currentShot += 1;
            runShotSequence();
          }, 1800);
        }
      }, 1000);
    };

    runShotSequence();
  };

  // Photos captured callback from viewfinder
  const handlePhotosCaptured = (photos: string[]) => {
    setCapturedPhotos(photos);
  };

  return (
    <main className="w-full h-full relative overflow-hidden select-none bg-[hsl(232,28%,4%)] flex items-center justify-center">
      
      {/* ── INIT LOADING SCREEN ── */}
      <LoadingScreen isLoading={isLoading} />

      {/* ── 3D CANVAS BACKGROUND ── */}
      <div className={`absolute inset-0 transition-opacity duration-[1500ms] ${
        appState === 'INSIDE_BOOTH' || appState === 'PRINTING' || appState === 'RESULT' ? 'opacity-25 pointer-events-none' : 'opacity-100'
      }`}>
        <SceneContainer
          isZooming={appState === 'ZOOMING_IN'}
          isCurtainOpen={appState !== 'LOBBY'}
          onBoothClick={handleBoothClick}
          onZoomComplete={() => setAppState('INSIDE_BOOTH')}
        />
      </div>

      {/* ── LOBBY GLASSMORPHISM HUD OVERLAY ── */}
      <AnimatePresence>
        {appState === 'LOBBY' && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-6 md:p-8"
          >
            {/* Header Telemetry bar */}
            <div className="w-full flex justify-between items-center pointer-events-auto">
              <div className="flex flex-col">
                <h1 className="chrome-text text-2xl md:text-3xl font-extrabold tracking-[0.2em]">
                  THEBESTFILM
                </h1>
                <span className="text-[9px] font-mono text-neon-cyan tracking-[0.4em] glow-cyan">
                  CHROME_PORTAL_ACTIVE
                </span>
              </div>
              
              {/* Telemetry log boxes */}
              <div className="hidden sm:flex items-center gap-6 font-mono text-[9px] text-neutral-400">
                <div className="border border-white/5 bg-black/40 px-3 py-1.5 rounded flex flex-col">
                  <span className="text-white/50 text-[7px] uppercase tracking-widest">System</span>
                  <span className="text-neon-cyan font-bold glow-cyan uppercase">Secure.OK</span>
                </div>
                <div className="border border-white/5 bg-black/40 px-3 py-1.5 rounded flex flex-col">
                  <span className="text-white/50 text-[7px] uppercase tracking-widest">Environment</span>
                  <span className="text-neon-gold font-bold glow-gold uppercase">R3F_GL.HIFI</span>
                </div>
              </div>
            </div>

            {/* Instruction Ledger & Credits Panel */}
            <div className="w-full flex flex-col md:flex-row justify-between items-stretch md:items-end gap-6 pointer-events-auto">
              {/* Instructions ledger (Left) */}
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="w-full md:w-[320px] glass-panel rounded-xl p-5 border border-white/10 flex flex-col gap-4 shadow-xl"
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="font-mono text-[9px] text-neon-pink tracking-widest uppercase glow-pink">
                    PORTAL OPERATION LEDGER
                  </span>
                  <span className="text-xs">💾</span>
                </div>
                
                <div className="flex flex-col gap-3 font-mono text-[10px] text-neutral-300">
                  <div className="flex gap-3">
                    <span className="text-neon-cyan">01 //</span>
                    <p>CLICK DIRECTLY ON THE 3D MODEL OR USE COIN SLOTS.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-neon-cyan">02 //</span>
                    <p>GRANT WEBCAM PERMISSIONS WHEN INSIDE (OR FALLBACK TO AI SYNTH).</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-neon-cyan">03 //</span>
                    <p>STRIKE A POSE FOR 4 SEQUENTIAL HIGH-CONTRAST SNAPS.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-neon-cyan">04 //</span>
                    <p>DOWNLOAD & PRINT YOUR CUSTOMIZED CHROME PHOTOMEMORY.</p>
                  </div>
                </div>
              </motion.div>

              {/* Coins / Start console panel (Right) */}
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="w-full md:w-[320px] glass-panel rounded-xl p-5 border border-white/10 flex flex-col justify-between gap-5 shadow-xl align-bottom"
              >
                <div className="flex justify-between items-center font-mono">
                  <span className="text-[9px] tracking-widest text-neutral-500 uppercase">
                    CREDIT ACCUMULATOR
                  </span>
                  <span className="text-neon-gold font-bold glow-gold">
                    {credits.toString().padStart(2, '0')} CREDITS
                  </span>
                </div>

                {/* Coin Slot Animation */}
                <div className="relative h-14 bg-black/40 border border-white/5 rounded-lg flex items-center justify-center overflow-hidden">
                  {insertAnim ? (
                    <motion.div
                      initial={{ y: -50, scale: 0.8 }}
                      animate={{ y: 80, scale: 0.5 }}
                      transition={{ duration: 0.45, ease: "easeIn" }}
                      className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 border-2 border-yellow-600 flex items-center justify-center font-bold text-yellow-800 text-[10px]"
                    >
                      $
                    </motion.div>
                  ) : (
                    <div className="text-[10px] font-mono text-neutral-500 animate-pulse tracking-widest">
                      [ COIN SLOT READY ]
                    </div>
                  )}
                </div>

                <button
                  onClick={handleInsertCoin}
                  className="w-full py-3.5 bg-gradient-to-r from-neon-pink to-neon-cyan hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 rounded-full font-bold text-xs tracking-[0.2em] text-black uppercase cursor-pointer shadow-[0_0_20px_rgba(255,0,204,0.3)]"
                >
                  INSERT COIN & ENTER
                </button>
              </motion.div>
            </div>
            
            {/* Cyber Ticker Footer Marquee */}
            <div className="w-full pointer-events-auto border-t border-white/5 pt-4 overflow-hidden relative">
              <div 
                className="whitespace-nowrap font-mono text-[9px] text-neon-cyan tracking-[0.3em] uppercase glow-cyan flex gap-20 animate-[marquee_25s_linear_infinite]"
                style={{ animationName: 'marquee' }}
              >
                <span>* INITIALIZE CHROMATIC PORTAL * STEP INSIDE THE THEBESTFILM * SYSTEM: SECURE *</span>
                <span>* PRESERVE MEMORIES IN 4-SHOT HIGH-FIDELITY PRINT STRIPS * SELECT RETRO Y2K FILTERS *</span>
                <span>* SYNTHESIZED ENTIRELY IN CHROME DIGITAL CONTEXT * ENTER THE PORTAL NOW *</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STATE: ZOOMING TELEPORTING SCREEN SCAN ── */}
      <AnimatePresence>
        {appState === 'ZOOMING_IN' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-[#0a0a18] pointer-events-none z-30 flex flex-col items-center justify-center"
          >
            {/* Holographic matrix grids flashing during teleport */}
            <div className="w-48 h-1 flex flex-col gap-1 items-center justify-center">
              <div className="w-full h-[2px] bg-neon-cyan shadow-[0_0_10px_#00ffee] animate-pulse" />
              <span className="font-mono text-[8px] tracking-[0.5em] text-neon-cyan uppercase mt-3">
                ZOOMING_PORTAL...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STATE: CAPTURE INTERIOR VIEW DECK ── */}
      <AnimatePresence>
        {appState === 'INSIDE_BOOTH' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 z-20 overflow-y-auto flex justify-center bg-black/40 backdrop-blur-sm px-4 py-8 md:py-12"
          >
            <div className="w-full max-w-[640px] flex flex-col gap-5 my-auto">
              
              {/* Telemetry Header Deck (Sits nicely above viewfinder) */}
              <div className="flex justify-between items-end font-mono w-full">
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold tracking-wider text-white">PORTAL CONSOLE</h2>
                  <span className="text-[9px] text-neon-pink tracking-widest uppercase glow-pink">
                    CAMERA_VIEWPORT_STREAMING
                  </span>
                </div>
                
                <div className="text-[10px] text-neutral-400 font-semibold tracking-wider">
                  CREDITS: <span className="text-neon-gold glow-gold">{credits}</span> // ACTIVE
                </div>
              </div>

              {/* Centered Camera Viewfinder */}
              <CameraViewfinder
                activeFilter={activeFilter}
                isCapturing={isCapturing}
                countdownNumber={countdownNumber}
                totalPoses={currentLayout.poses}
                onPhotosCaptured={handlePhotosCaptured}
                playBeepSound={(isFinal) => audio.playBeep(isFinal)}
                playShutterSound={() => audio.playShutter()}
              />

              {/* Controls Console Deck (Film Stock & Template Selectors side-by-side) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-1">
                
                {/* 1. SELECT FILM STOCK / เลือกชนิดฟิล์ม */}
                <div className="flex flex-col gap-3">
                  <span className="font-mono text-[9px] tracking-widest text-neutral-500 uppercase flex justify-between items-center border-b border-white/5 pb-1">
                    <span>SELECT FILM STOCK</span>
                    <span className="text-neon-cyan">เลือกชนิดฟิล์ม</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                    {/* KODAK GOLD 200 */}
                    <button
                      onClick={() => { audio.playClick(); setActiveFilter('vintage-warm'); }}
                      disabled={isCapturing}
                      className={`py-2.5 px-3 border rounded-lg text-left transition-all duration-200 cursor-pointer ${
                        activeFilter === 'vintage-warm'
                          ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan shadow-[0_0_10px_rgba(0,255,238,0.1)]'
                          : 'border-white/10 bg-black/20 text-neutral-400 hover:border-white/20'
                      }`}
                    >
                      <div className="font-bold">🎞️ KODAK GOLD 200</div>
                      <div className="text-[7px] text-neutral-500">Vintage Warmth</div>
                    </button>

                    {/* FUJIFILM SUPERIA */}
                    <button
                      onClick={() => { audio.playClick(); setActiveFilter('cyber-neon'); }}
                      disabled={isCapturing}
                      className={`py-2.5 px-3 border rounded-lg text-left transition-all duration-200 cursor-pointer ${
                        activeFilter === 'cyber-neon'
                          ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan shadow-[0_0_10px_rgba(0,255,238,0.1)]'
                          : 'border-white/10 bg-black/20 text-neutral-400 hover:border-white/20'
                      }`}
                    >
                      <div className="font-bold">🧪 FUJIFILM SUPERIA</div>
                      <div className="text-[7px] text-neutral-500">Cyber Cyan/Pink</div>
                    </button>

                    {/* ILFORD HP5 MONO */}
                    <button
                      onClick={() => { audio.playClick(); setActiveFilter('chrome-silver'); }}
                      disabled={isCapturing}
                      className={`py-2.5 px-3 border rounded-lg text-left transition-all duration-200 cursor-pointer ${
                        activeFilter === 'chrome-silver'
                          ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan shadow-[0_0_10px_rgba(0,255,238,0.1)]'
                          : 'border-white/10 bg-black/20 text-neutral-400 hover:border-white/20'
                      }`}
                    >
                      <div className="font-bold">🐼 ILFORD HP5 MONO</div>
                      <div className="text-[7px] text-neutral-500">High-Contrast B&W</div>
                    </button>

                    {/* POLAROID COOL */}
                    <button
                      onClick={() => { audio.playClick(); setActiveFilter('dreamy-aura'); }}
                      disabled={isCapturing}
                      className={`py-2.5 px-3 border rounded-lg text-left transition-all duration-200 cursor-pointer ${
                        activeFilter === 'dreamy-aura'
                          ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan shadow-[0_0_10px_rgba(0,255,238,0.1)]'
                          : 'border-white/10 bg-black/20 text-neutral-400 hover:border-white/20'
                      }`}
                    >
                      <div className="font-bold">📸 POLAROID COOL</div>
                      <div className="text-[7px] text-neutral-500">Dreamy Aura Glow</div>
                    </button>
                  </div>
                </div>

                {/* 2. SELECT PHOTO TEMPLATE / เลือกรูปแบบรูปภาพ */}
                <div className="flex flex-col gap-3">
                  <span className="font-mono text-[9px] tracking-widest text-neutral-500 uppercase flex justify-between items-center border-b border-white/5 pb-1">
                    <span className="flex items-center gap-2">
                      <span>SELECT TEMPLATE</span>
                      {/* Nav buttons for desktop */}
                      <span className="hidden md:flex items-center gap-1.5 ml-2 border-l border-white/10 pl-2">
                        <button
                          onClick={() => {
                            audio.playClick();
                            templateScrollRef.current?.scrollBy({ left: -150, behavior: 'smooth' });
                          }}
                          className="hover:text-neon-cyan transition-colors cursor-pointer p-0.5 text-[8px]"
                          title="Scroll Left"
                        >
                          ◀
                        </button>
                        <button
                          onClick={() => {
                            audio.playClick();
                            templateScrollRef.current?.scrollBy({ left: 150, behavior: 'smooth' });
                          }}
                          className="hover:text-neon-cyan transition-colors cursor-pointer p-0.5 text-[8px]"
                          title="Scroll Right"
                        >
                          ▶
                        </button>
                      </span>
                    </span>
                    <span className="text-neon-cyan">เลือกรูปแบบ</span>
                  </span>

                  <div
                    ref={templateScrollRef}
                    onWheel={(e) => {
                      if (e.deltaY !== 0) {
                        e.currentTarget.scrollLeft += e.deltaY;
                      }
                    }}
                    className="flex gap-2 pb-2 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x w-full">
                    {PHOTO_LAYOUTS.map((layout) => (
                      <button
                        key={layout.id}
                        onClick={() => {
                          audio.playClick();
                          setSelectedLayoutId(layout.id);
                        }}
                        disabled={isCapturing}
                        className={`flex-shrink-0 w-[145px] snap-start p-2 border rounded-xl flex items-center gap-2.5 transition-all duration-200 cursor-pointer ${
                          selectedLayoutId === layout.id
                            ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan shadow-[0_0_15px_rgba(0,255,238,0.15)]'
                            : 'border-white/10 bg-black/20 text-neutral-400 hover:border-white/20'
                        }`}
                      >
                        {/* Mini layout schematic preview */}
                        {(() => {
                          let renderW = 20;
                          let renderH = 30;
                          if (layout.type === 'grid-landscape') {
                            renderW = 30;
                            renderH = 20;
                          }
                          return (
                            <div 
                              className="border border-white/20 bg-black/40 rounded flex items-center justify-center p-0.5 relative overflow-hidden"
                              style={{ width: '38px', height: '38px' }}
                            >
                              <div 
                                className="relative bg-neutral-900 border border-white/10 rounded flex-shrink-0"
                                style={{ width: `${renderW}px`, height: `${renderH}px` }}
                              >
                                {layout.placements.map((placement, i) => {
                                  const px = (placement.x / layout.width) * renderW;
                                  const py = (placement.y / layout.height) * renderH;
                                  const pw = (placement.w / layout.width) * renderW;
                                  const ph = (placement.h / layout.height) * renderH;
                                  return (
                                    <div 
                                      key={i}
                                      className="absolute bg-white/70 border border-black/30 rounded-[0.5px]"
                                      style={{
                                        left: `${px}px`,
                                        top: `${py}px`,
                                        width: `${pw}px`,
                                        height: `${ph}px`,
                                      }}
                                    />
                                  );
                                })}
                                {layout.id === 'layout-h' && (
                                  <div 
                                    className="absolute border border-neon-cyan/40 bg-neon-cyan/10 flex items-center justify-center text-[3px] leading-none text-neon-cyan"
                                    style={{
                                      left: `${(620 / 1200) * renderW}px`,
                                      top: `${(50 / 800) * renderH}px`,
                                      width: `${(530 / 1200) * renderW}px`,
                                      height: `${(330 / 800) * renderH}px`,
                                    }}
                                  >
                                    ✏️
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        <div className="flex-1 text-left min-w-0 font-mono">
                          <div className="font-bold text-[9px] leading-tight truncate">{layout.name.split(' (')[0]}</div>
                          <div className="text-[7px] text-neutral-500 font-semibold uppercase mt-0.5">{layout.poses} Poses</div>
                          <div className="text-[6px] text-neutral-600 truncate">{layout.subDescription.split(' (')[1].replace(')', '')}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Action buttons at bottom center */}
              <div className="flex flex-col sm:flex-row gap-3 w-full mt-1">
                <button
                  onClick={startCaptureSequence}
                  disabled={isCapturing}
                  className={`flex-1 py-4 rounded-full font-bold text-xs tracking-[0.25em] uppercase text-black transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg ${
                    isCapturing
                      ? 'bg-neutral-500 shadow-none cursor-not-allowed opacity-50 text-neutral-800'
                      : 'bg-neon-pink shadow-[0_0_20px_rgba(255,0,204,0.4)]'
                  }`}
                >
                  {isCapturing ? 'SEQUENCE RUNNING...' : `START ${currentLayout.poses}-SHOT SEQUENCE`}
                </button>

                <button
                  onClick={() => {
                    audio.playClick();
                    setAppState('LOBBY');
                    audio.playLobbyChime();
                  }}
                  disabled={isCapturing}
                  className="sm:px-8 py-4 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white rounded-full font-bold text-[10px] tracking-widest uppercase transition-all duration-200 cursor-pointer"
                >
                  Exit Portal
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STATE: PRINTING RASTER COMPILE EFFECT ── */}
      <AnimatePresence>
        {appState === 'PRINTING' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#06060c] z-30 flex flex-col items-center justify-center font-mono select-none"
          >
            {/* CRT scanning light effect */}
            <div className="absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-neon-cyan/15 to-transparent blur-md pointer-events-none animate-[scan-line_2.5s_ease-in-out_infinite]" />
            
            {/* Spinning chrome loader */}
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-neon-cyan animate-spin" />
            </div>

            <h2 className="text-neon-cyan glow-cyan text-sm font-bold tracking-[0.4em] mb-2 uppercase">
              PRINTING_PHOTOMEMORY
            </h2>
            <p className="text-[9px] text-neutral-500 tracking-[0.2em] uppercase">
              Compiling raster grids and barcode signatures...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STATE: PHOTO STRIP RESULT & DOWNLOADS ── */}
      <AnimatePresence>
        {appState === 'RESULT' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto p-4 md:p-8"
          >
            <PhotoStripResult
              photos={capturedPhotos}
              layoutId={selectedLayoutId}
              playPrinterSound={(dur) => audio.playPrinter(dur)}
              playClickSound={() => audio.playClick()}
              onRestart={() => {
                setCapturedPhotos([]);
                setAppState('INSIDE_BOOTH');
              }}
              onExit={() => {
                setCapturedPhotos([]);
                setAppState('LOBBY');
                audio.playLobbyChime();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Dynamic Keyframes injected for specific CSS animation requirements */}
      <style jsx global>{`
        @keyframes scan-line {
          0% { top: -20%; }
          100% { top: 120%; }
        }
      `}</style>
    </main>
  );
}
