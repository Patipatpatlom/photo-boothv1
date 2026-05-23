'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  isLoading: boolean;
}

export default function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    setProgress(0);
    const startTime = Date.now();
    const duration = 2400; // 2.4 seconds

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(newProgress);
      if (newProgress >= 100) {
        clearInterval(timer);
      }
    }, 16); // ~60fps

    return () => clearInterval(timer);
  }, [isLoading]);

  const isComplete = progress === 100;
  const totalBlocks = 16;
  const filledBlocks = Math.floor((progress / 100) * totalBlocks);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none"
          style={{
            backgroundColor: '#000000',
            fontFamily: "'Courier New', Courier, monospace",
          }}
        >
          {/* CRT Screen Scanline overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: `linear-gradient(
                rgba(18, 16, 16, 0) 50%, 
                rgba(0, 0, 0, 0.25) 50%
              )`,
              backgroundSize: '100% 4px',
            }}
          />

          {/* Micro-flicker overlay for CRT sensation */}
          <div
            className="absolute inset-0 pointer-events-none z-10 opacity-[0.02] animate-pulse"
            style={{
              backgroundColor: '#ffffff',
            }}
          />

          <div className="flex flex-col items-center max-w-sm w-full px-8 text-center z-20">
            {/* Retro title / header state */}
            {!isComplete ? (
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-white text-xl font-bold tracking-[0.2em] mb-6 select-none"
              >
                NOW LOADING...
              </motion.div>
            ) : (
              <motion.div
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.25, repeat: Infinity }}
                className="text-[#00f3ff] text-xl font-bold tracking-[0.15em] mb-6 px-6 py-1.5 border-2 border-[#00f3ff] bg-[#00f3ff]/10 select-none shadow-[0_0_15px_rgba(0,243,255,0.4)]"
              >
                ■ COMPLETE ■
              </motion.div>
            )}

            {/* Visual Segments Box */}
            <div
              className={`w-full p-2 border-2 ${isComplete ? 'border-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.25)]' : 'border-white'} flex items-center justify-between gap-1 mb-4`}
              style={{
                backgroundColor: '#000000',
              }}
            >
              {Array.from({ length: totalBlocks }).map((_, idx) => {
                const isActive = idx < filledBlocks;
                return (
                  <div
                    key={idx}
                    className="flex-1 h-6 transition-all duration-75"
                    style={{
                      backgroundColor: isActive
                        ? isComplete
                          ? '#00f3ff'
                          : '#ffffff'
                        : 'transparent',
                      border: isActive
                        ? 'none'
                        : '1px solid #222222',
                      boxShadow: isActive && isComplete
                        ? '0 0 8px #00f3ff'
                        : 'none',
                    }}
                  />
                );
              })}
            </div>

            {/* Percentage details */}
            <div
              className={`text-sm tracking-[0.2em] font-semibold ${isComplete ? 'text-[#00f3ff]' : 'text-[#888888]'}`}
            >
              {progress}%
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
