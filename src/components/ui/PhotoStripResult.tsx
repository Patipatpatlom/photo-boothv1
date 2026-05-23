'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export interface PhotoLayout {
  id: string;
  name: string;
  type: 'strip' | 'grid-landscape' | 'grid-portrait';
  poses: number;
  width: number;
  height: number;
  description: string;
  subDescription: string;
  placements: { x: number; y: number; w: number; h: number }[];
}

export const PHOTO_LAYOUTS: PhotoLayout[] = [
  {
    id: 'layout-c',
    name: 'Layout C (Strip 4 Poses)',
    type: 'strip',
    poses: 4,
    width: 600,
    height: 2000,
    description: 'Classical vertical strip with 4 poses.',
    subDescription: 'Size: 6x2 (Strip) 4 Pose',
    placements: [
      { x: 55, y: 80, w: 490, h: 368 },
      { x: 55, y: 492, w: 490, h: 368 },
      { x: 55, y: 904, w: 490, h: 368 },
      { x: 55, y: 1316, w: 490, h: 368 },
    ],
  },
  {
    id: 'layout-a',
    name: 'Layout A (Strip 3 Poses)',
    type: 'strip',
    poses: 3,
    width: 600,
    height: 1600,
    description: 'Classical vertical strip with 3 poses.',
    subDescription: 'Size: 6x2 (Strip) 3 Pose',
    placements: [
      { x: 55, y: 80, w: 490, h: 368 },
      { x: 55, y: 492, w: 490, h: 368 },
      { x: 55, y: 904, w: 490, h: 368 },
    ],
  },
  {
    id: 'layout-f',
    name: 'Layout F (Grid 2x2)',
    type: 'grid-landscape',
    poses: 4,
    width: 1200,
    height: 800,
    description: 'Elegant landscape card featuring 2x2 grid of photos.',
    subDescription: 'Size: 6x4 (4R) 4 Pose',
    placements: [
      { x: 50, y: 50, w: 530, h: 330 },
      { x: 620, y: 50, w: 530, h: 330 },
      { x: 50, y: 420, w: 530, h: 330 },
      { x: 620, y: 420, w: 530, h: 330 },
    ],
  },
  {
    id: 'layout-h',
    name: 'Layout H (Grid 3 Poses)',
    type: 'grid-landscape',
    poses: 3,
    width: 1200,
    height: 800,
    description: '3 poses card with a special branding text box on the top right.',
    subDescription: 'Size: 6x4 (4R) 3 Pose',
    placements: [
      { x: 50, y: 50, w: 530, h: 330 },
      { x: 50, y: 420, w: 530, h: 330 },
      { x: 620, y: 420, w: 530, h: 330 },
    ],
  },
  {
    id: 'layout-j',
    name: 'Layout J (Grid 2 Poses)',
    type: 'grid-landscape',
    poses: 2,
    width: 1200,
    height: 800,
    description: 'Double poses side-by-side with header/footer banners.',
    subDescription: 'Size: 6x4 (4R) 2 Pose',
    placements: [
      { x: 60, y: 140, w: 520, h: 440 },
      { x: 620, y: 140, w: 520, h: 440 },
    ],
  },
  {
    id: 'layout-k',
    name: 'Layout K (Portrait 2 Poses)',
    type: 'grid-portrait',
    poses: 2,
    width: 800,
    height: 1200,
    description: 'Vertical portrait layout with 2 photos and metadata footer.',
    subDescription: 'Size: 6x4 (4R) 2 Pose',
    placements: [
      { x: 60, y: 60, w: 680, h: 440 },
      { x: 60, y: 540, w: 680, h: 440 },
    ],
  },
  {
    id: 'layout-l',
    name: 'Layout L (1 Pose Widescreen)',
    type: 'grid-landscape',
    poses: 1,
    width: 1200,
    height: 800,
    description: 'Single premium widescreen photo memory with bottom banner.',
    subDescription: 'Size: 6x4 (4R) 1 Pose',
    placements: [
      { x: 60, y: 60, w: 1080, h: 560 },
    ],
  },
];

interface PhotoStripResultProps {
  photos: string[];
  layoutId: string;
  onRestart: () => void;
  onExit: () => void;
  playPrinterSound: (duration: number) => void;
  playClickSound: () => void;
}

type FrameStyle = 'classic' | 'cyberpunk' | 'hologram';

export default function PhotoStripResult({
  photos,
  layoutId,
  onRestart,
  onExit,
  playPrinterSound,
  playClickSound,
}: PhotoStripResultProps) {
  const [activeFrame, setActiveFrame] = useState<FrameStyle>('cyberpunk');
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Play printing mechanical sound on load while animating the strip out
  useEffect(() => {
    playPrinterSound(3.0);
  }, [playPrinterSound]);

  // Generate the download canvas image whenever photos or activeFrame change
  useEffect(() => {
    generatePhotoStrip();
  }, [photos, activeFrame]);

  // Procedural Barcode generator on Canvas
  const drawBarcode = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) => {
    ctx.save();
    ctx.fillStyle = color;
    let currentX = x;
    const endX = x + width;
    while (currentX < endX) {
      const barWidth = Math.floor(Math.random() * 4) + 1.5;
      const spaceWidth = Math.floor(Math.random() * 5) + 2.0;
      ctx.fillRect(currentX, y, barWidth, height);
      currentX += barWidth + spaceWidth;
    }
    ctx.restore();
  };

  const generatePhotoStrip = async () => {
    setIsGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const layout = PHOTO_LAYOUTS.find((l) => l.id === layoutId) || PHOTO_LAYOUTS[0];
    const w = layout.width;
    const h = layout.height;
    canvas.width = w;
    canvas.height = h;

    // 1. Draw Frame background
    if (activeFrame === 'classic') {
      // Warm white physical polaroid paper
      ctx.fillStyle = '#faf8f2';
      ctx.fillRect(0, 0, w, h);
      
      // Draw subtle vintage paper grain
      ctx.fillStyle = 'rgba(0, 0, 0, 0.015)';
      const grainCount = Math.floor((w * h) / 150);
      for (let i = 0; i < grainCount; i++) {
        ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
      }
    } else if (activeFrame === 'cyberpunk') {
      // Deep space grid cyber style
      ctx.fillStyle = '#07070f';
      ctx.fillRect(0, 0, w, h);

      // Grid mesh lines
      ctx.strokeStyle = 'rgba(0, 255, 238, 0.05)';
      ctx.lineWidth = 1;
      const meshSize = 40;
      for (let lx = 0; lx < w; lx += meshSize) {
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, h);
        ctx.stroke();
      }
      for (let ly = 0; ly < h; ly += meshSize) {
        ctx.beginPath();
        ctx.moveTo(0, ly);
        ctx.lineTo(w, ly);
        ctx.stroke();
      }
      
      // Cyber diagonal accent line
      ctx.strokeStyle = 'rgba(255, 0, 204, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, w);
      ctx.stroke();
    } else {
      // Hologram chrome vertical stripe gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#111528');
      grad.addColorStop(0.25, '#281a42');
      grad.addColorStop(0.5, '#1e323e');
      grad.addColorStop(0.75, '#351630');
      grad.addColorStop(1, '#0e1222');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      
      // Chrome glare reflection lines
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      const glareCount = layout.type === 'strip' ? 6 : 4;
      const glareSpacing = h / glareCount;
      for (let i = 0; i < glareCount; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * glareSpacing);
        ctx.lineTo(w, i * glareSpacing + w * 0.6);
        ctx.lineTo(w, i * glareSpacing + w * 0.7);
        ctx.lineTo(0, i * glareSpacing + w * 0.1);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 2. Setup font typography colors
    const themeColor = activeFrame === 'classic' ? '#222222' : activeFrame === 'cyberpunk' ? '#00ffee' : '#ff00cc';
    const subColor = activeFrame === 'classic' ? '#777777' : activeFrame === 'cyberpunk' ? '#ff00cc' : '#00ffee';

    // 3. Load Captured Photos
    const imgElements = await Promise.all(
      photos.map(
        (src) =>
          new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = src;
          })
      )
    );

    imgElements.forEach((img, idx) => {
      const placement = layout.placements[idx];
      if (!placement) return;
      const { x, y, w: photoW, h: photoH } = placement;

      // Photo background drop shadow/border box
      if (activeFrame === 'classic') {
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(x - 3, y - 3, photoW + 6, photoH + 6);
        ctx.strokeStyle = '#dfded7';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - 1, y - 1, photoW + 2, photoH + 2);
      } else if (activeFrame === 'cyberpunk') {
        // Double neon border glows
        ctx.strokeStyle = 'rgba(255, 0, 204, 0.4)';
        ctx.lineWidth = 4;
        ctx.strokeRect(x - 6, y - 6, photoW + 12, photoH + 12);
        ctx.strokeStyle = '#00ffee';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 2, y - 2, photoW + 4, photoH + 4);
      } else {
        // Holographic frame
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 4, y - 4, photoW + 8, photoH + 8);
      }

      // Draw photo center-cropped to fill slot without distortion
      const imgRatio = img.width / img.height;
      const targetRatio = photoW / photoH;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (imgRatio > targetRatio) {
        sw = img.height * targetRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / targetRatio;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, x, y, photoW, photoH);

      // Procedural scanline overlay on pictures for retro feels
      if (activeFrame === 'cyberpunk' || activeFrame === 'hologram') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
        for (let sy = y; sy < y + photoH; sy += 3) {
          ctx.fillRect(x, sy, photoW, 1.2);
        }
      }
    });

    // 4. Draw Footer/Custom Branding Deck
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '.');

    if (layout.type === 'strip') {
      const footerY = h - 280;
      
      // Barcode draw
      drawBarcode(ctx, (w - 220) / 2, footerY + 20, 220, 42, themeColor);
      
      ctx.fillStyle = themeColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // THEBESTFILM Logo
      ctx.font = 'bold 22px "Space Grotesk", sans-serif';
      ctx.fillText('THEBESTFILM', w / 2, footerY + 75);

      // Monospace metadata lines
      ctx.fillStyle = subColor;
      ctx.font = '11px "Space Mono", monospace';
      ctx.fillText(`SYSTEM PORTAL // OPERATOR_03 // ${dateStr}`, w / 2, footerY + 110);
      ctx.fillText('ALL RIGHTS STORED IN CHROME // Y2K_BOOTH', w / 2, footerY + 126);

      // Decals/Sticker aesthetics (e.g. circles, crosshairs)
      if (activeFrame === 'cyberpunk') {
        ctx.strokeStyle = '#ff00cc';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(50, footerY + 20); ctx.lineTo(50, footerY + 40);
        ctx.moveTo(40, footerY + 30); ctx.lineTo(60, footerY + 30);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(w - 50, footerY + 20); ctx.lineTo(w - 50, footerY + 40);
        ctx.moveTo(w - 60, footerY + 30); ctx.lineTo(w - 40, footerY + 30);
        ctx.stroke();
      } else if (activeFrame === 'classic') {
        ctx.fillStyle = '#555555';
        ctx.font = 'italic 16px "Comic Sans MS", cursive, sans-serif';
        ctx.fillText(`thebestfilm memo — ${dateStr}`, w / 2, footerY + 148);
      }
    } else if (layout.id === 'layout-f') {
      // Grid 2x2: Draw small, beautiful metadata in the bottom margins
      ctx.save();
      ctx.textBaseline = 'bottom';
      
      // Left: Date info
      ctx.fillStyle = subColor;
      ctx.font = '11px "Space Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`MEMORIES // OPERATOR_03 // ${dateStr}`, 50, h - 35);
      
      // Center: THEBESTFILM Logo
      ctx.fillStyle = themeColor;
      ctx.textAlign = 'center';
      ctx.font = 'bold 18px "Space Grotesk", sans-serif';
      ctx.fillText('THEBESTFILM', w / 2, h - 32);

      // Right: Small barcode
      drawBarcode(ctx, w - 290, h - 45, 240, 18, themeColor);
      ctx.restore();
    } else if (layout.id === 'layout-h') {
      // Grid 3 Poses: Top-right branding box
      const brandX = 620;
      const brandY = 50;
      const brandW = 530;
      const brandH = 330;

      ctx.save();
      if (activeFrame === 'classic') {
        ctx.fillStyle = 'rgba(0,0,0,0.02)';
        ctx.fillRect(brandX, brandY, brandW, brandH);
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(brandX, brandY, brandW, brandH);
      } else {
        ctx.fillStyle = 'rgba(0, 255, 238, 0.02)';
        ctx.fillRect(brandX, brandY, brandW, brandH);
        ctx.strokeStyle = activeFrame === 'cyberpunk' ? 'rgba(0, 255, 238, 0.25)' : 'rgba(255, 0, 204, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(brandX, brandY, brandW, brandH);
      }

      ctx.fillStyle = themeColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = 'bold 30px "Space Grotesk", sans-serif';
      ctx.fillText('THEBESTFILM', brandX + brandW / 2, brandY + 45);

      drawBarcode(ctx, brandX + (brandW - 280) / 2, brandY + 110, 280, 42, themeColor);

      ctx.fillStyle = subColor;
      ctx.font = '12px "Space Mono", monospace';
      ctx.fillText(`PORTAL SCAN // OP_03 // ${dateStr}`, brandX + brandW / 2, brandY + 180);
      ctx.fillText('ALL IMAGES CHROME REGISTERED', brandX + brandW / 2, brandY + 202);

      if (activeFrame === 'classic') {
        ctx.fillStyle = '#555';
        ctx.font = 'italic 16px "Comic Sans MS", cursive, sans-serif';
        ctx.fillText(`thebestfilm memo — ${dateStr}`, brandX + brandW / 2, brandY + 250);
      } else {
        ctx.fillStyle = themeColor;
        ctx.font = '10px "Space Mono", monospace';
        ctx.fillText('⚡ RETRO BOOTH DIGITAL MEMORY ⚡', brandX + brandW / 2, brandY + 250);
      }
      ctx.restore();
    } else if (layout.id === 'layout-j') {
      // Grid 2 Poses Landscape: Header + Footer
      ctx.save();
      ctx.fillStyle = themeColor;
      ctx.textAlign = 'center';
      
      // Header text
      ctx.font = 'bold 36px "Space Grotesk", sans-serif';
      ctx.fillText('⚡ THEBESTFILM CHROME MEMORIES ⚡', w / 2, 45);

      // Footer
      drawBarcode(ctx, (w - 320) / 2, 620, 320, 48, themeColor);
      
      ctx.fillStyle = subColor;
      ctx.font = '12px "Space Mono", monospace';
      ctx.fillText(`DOUBLE POSE LANDSCAPE // OPERATOR_03 // PORTAL_003 // ${dateStr}`, w / 2, 695);
      ctx.fillText('ALL DIGITAL RIGHTS CAPTURED DIRECTLY IN HIGH-FIDELITY WEB GL CONTEXT', w / 2, 718);

      if (activeFrame === 'classic') {
        ctx.fillStyle = '#555555';
        ctx.font = 'italic 16px "Comic Sans MS", cursive, sans-serif';
        ctx.fillText(`thebestfilm memo — ${dateStr}`, w / 2, 755);
      }
      ctx.restore();
    } else if (layout.id === 'layout-k') {
      // Portrait 2 Poses: Bottom banner
      const footerY = 980;
      ctx.save();
      ctx.fillStyle = themeColor;
      ctx.textAlign = 'center';

      // Barcode
      drawBarcode(ctx, (w - 280) / 2, footerY + 15, 280, 45, themeColor);

      // Logo
      ctx.font = 'bold 28px "Space Grotesk", sans-serif';
      ctx.fillText('THEBESTFILM', w / 2, footerY + 80);

      // Metadata
      ctx.fillStyle = subColor;
      ctx.font = '12px "Space Mono", monospace';
      ctx.fillText(`SYSTEM PORTAL // OPERATOR_03 // ${dateStr}`, w / 2, footerY + 120);
      ctx.fillText('Y2K RETRO PHOTOSTRIP // SECURE DIGITAL STORAGE', w / 2, footerY + 140);

      if (activeFrame === 'classic') {
        ctx.fillStyle = '#555555';
        ctx.font = 'italic 16px "Comic Sans MS", cursive, sans-serif';
        ctx.fillText(`thebestfilm memo — ${dateStr}`, w / 2, footerY + 172);
      }
      ctx.restore();
    } else if (layout.id === 'layout-l') {
      // 1 Pose Widescreen: Bottom banner space
      const footerY = 620;
      ctx.save();
      
      // Barcode on the left
      drawBarcode(ctx, 80, footerY + 45, 260, 40, themeColor);

      // Branding on the right
      ctx.fillStyle = themeColor;
      ctx.textAlign = 'left';
      ctx.font = 'bold 32px "Space Grotesk", sans-serif';
      ctx.fillText('THEBESTFILM WIDESCREEN', 420, footerY + 40);

      ctx.fillStyle = subColor;
      ctx.font = '12px "Space Mono", monospace';
      ctx.fillText(`SINGLE POSE MEMORY // OP_03 // ${dateStr}`, 420, footerY + 80);
      ctx.fillText('CHROME PORTAL SECURE DIGITAL RENDER', 420, footerY + 100);

      if (activeFrame === 'classic') {
        ctx.fillStyle = '#555555';
        ctx.font = 'italic 16px "Comic Sans MS", cursive, sans-serif';
        ctx.fillText(`thebestfilm memo — ${dateStr}`, 420, footerY + 135);
      }
      ctx.restore();
    }

    // Done generating
    const dataUrl = canvas.toDataURL('image/png');
    setDownloadUrl(dataUrl);
    setIsGenerating(false);
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    playClickSound();
    const layout = PHOTO_LAYOUTS.find((l) => l.id === layoutId) || PHOTO_LAYOUTS[0];
    const link = document.createElement('a');
    link.download = `thebestfilm-${layout.id}-${activeFrame}-${Date.now()}.png`;
    link.href = downloadUrl;
    link.click();
  };

  const layout = PHOTO_LAYOUTS.find((l) => l.id === layoutId) || PHOTO_LAYOUTS[0];

  return (
    <div className="w-full flex flex-col md:flex-row items-center md:items-stretch justify-center gap-10 p-4 md:p-8 max-w-5xl select-none">
      
      {/* ── LEFT PANEL: THE ANIMATED PHOTO STRIP DISPLAY ── */}
      <div className="flex-1 flex justify-center items-center perspective-1000 relative">
        <motion.div
          initial={{ y: -800, opacity: 0, rotate: -4 }}
          animate={{ y: 0, opacity: 1, rotate: -1 }}
          transition={{
            type: "spring",
            stiffness: 45,
            damping: 14,
            mass: 1.2,
            delay: 0.2
          }}
          style={{
            aspectRatio: `${layout.width} / ${layout.height}`
          }}
          className={`rounded-lg shadow-[0_30px_70px_rgba(0,0,0,0.85)] border overflow-hidden relative cursor-zoom-in transition-all duration-300 ${
            layout.type === 'strip' ? 'w-[260px]' : layout.type === 'grid-portrait' ? 'w-[360px]' : 'w-full max-w-[500px]'
          } ${
            activeFrame === 'classic'
              ? 'bg-[#faf8f2] border-white/50 text-neutral-800'
              : activeFrame === 'cyberpunk'
              ? 'bg-[#07070f] border-neon-cyan/20 text-neon-cyan shadow-[0_0_50px_rgba(0,255,238,0.15)]'
              : 'bg-[#111528] border-neon-pink/20 text-neon-pink shadow-[0_0_50px_rgba(255,0,204,0.15)]'
          }`}
        >
          {/* Mechanical paper scanner shine swipe */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg z-10">
            <motion.div
              animate={{ y: ['-100%', '200%'] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-32 bg-gradient-to-b from-transparent via-white/5 to-transparent blur-sm"
            />
          </div>

          {/* Actual compiled visual rendered directly! */}
          {downloadUrl ? (
            <img src={downloadUrl} alt="Compiled photo strip" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-mono text-xs text-neutral-500 animate-pulse">
              Compiling...
            </div>
          )}
        </motion.div>

        {/* Hidden Generation Canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* ── RIGHT PANEL: CONTROLS & DESIGNS ── */}
      <div className="w-full md:w-[350px] flex flex-col justify-between py-6 gap-8">
        
        {/* Style selector cards */}
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-wider text-white mb-1">STRIP PRINTED!</h2>
            <p className="text-xs text-neutral-400 font-mono">Select frame and save your moment.</p>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
              Select Frame Style
            </span>
            
            {/* CLASSIC POLAROID */}
            <button
              onClick={() => {
                playClickSound();
                setActiveFrame('classic');
              }}
              className={`p-3 rounded-lg border text-left flex justify-between items-center transition-all duration-200 cursor-pointer ${
                activeFrame === 'classic'
                  ? 'border-white bg-white/10 text-white'
                  : 'border-white/10 bg-black/20 text-neutral-400 hover:border-white/20'
              }`}
            >
              <div>
                <div className="text-sm font-semibold font-display">CLASSIC FILM</div>
                <div className="text-[10px] font-mono text-neutral-500">Warm Polaroid Paper Frame</div>
              </div>
              <span className="text-xs">📸</span>
            </button>

            {/* CYBERPUNK */}
            <button
              onClick={() => {
                playClickSound();
                setActiveFrame('cyberpunk');
              }}
              className={`p-3 rounded-lg border text-left flex justify-between items-center transition-all duration-200 cursor-pointer ${
                activeFrame === 'cyberpunk'
                  ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan'
                  : 'border-white/10 bg-black/20 text-neutral-400 hover:border-white/20'
              }`}
            >
              <div>
                <div className="text-sm font-semibold font-display">NEO-CYBERGRID</div>
                <div className="text-[10px] font-mono text-neutral-500">Glowing Cyan & Pink Lines</div>
              </div>
              <span className="text-xs">👾</span>
            </button>

            {/* HOLOGRAM */}
            <button
              onClick={() => {
                playClickSound();
                setActiveFrame('hologram');
              }}
              className={`p-3 rounded-lg border text-left flex justify-between items-center transition-all duration-200 cursor-pointer ${
                activeFrame === 'hologram'
                  ? 'border-neon-pink bg-neon-pink/10 text-neon-pink'
                  : 'border-white/10 bg-black/20 text-neutral-400 hover:border-white/20'
              }`}
            >
              <div>
                <div className="text-sm font-semibold font-display">CHROME IRIDESCENT</div>
                <div className="text-[10px] font-mono text-neutral-500">Metallic Glare Reflections</div>
              </div>
              <span className="text-xs">💿</span>
            </button>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex flex-col gap-3">
          {/* Download trigger */}
          <button
            onClick={handleDownload}
            disabled={isGenerating || !downloadUrl}
            className={`w-full py-4 px-6 rounded-full font-bold text-sm tracking-widest text-black uppercase cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg ${
              activeFrame === 'classic'
                ? 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                : activeFrame === 'cyberpunk'
                ? 'bg-neon-cyan shadow-[0_0_20px_rgba(0,255,238,0.4)]'
                : 'bg-neon-pink shadow-[0_0_20px_rgba(255,0,204,0.4)]'
            }`}
          >
            {isGenerating ? 'GENERATING STRIP...' : 'DOWNLOAD PHOTO STRIP'}
          </button>

          {/* Retry / Back buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                playClickSound();
                onRestart();
              }}
              className="flex-1 py-3 px-4 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white rounded-full font-semibold text-xs tracking-wider uppercase transition-all duration-200 cursor-pointer"
            >
              Retake Strip
            </button>
            <button
              onClick={() => {
                playClickSound();
                onExit();
              }}
              className="flex-1 py-3 px-4 border border-neon-pink/30 bg-neon-pink/5 hover:bg-neon-pink/15 hover:border-neon-pink text-neon-pink rounded-full font-semibold text-xs tracking-wider uppercase transition-all duration-200 cursor-pointer"
            >
              Exit Booth
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
