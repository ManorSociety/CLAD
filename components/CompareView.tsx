/**
 * Compare View Component - Mobile/Tablet Optimized
 */

import React, { useState, useRef, useEffect } from 'react';
import { CompareState } from '../types';

interface CompareViewProps {
  compareState: CompareState;
  onClose: () => void;
  onShare: () => void;
}

type CompareMode = 'slider' | 'side-by-side' | 'tap';

export const CompareView: React.FC<CompareViewProps> = ({
  compareState,
  onClose,
  onShare
}) => {
  const [mode, setMode] = useState<CompareMode>('slider');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showRight, setShowRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => { isDragging.current = true; };
  const handleMouseUp = () => { isDragging.current = false; };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) handleSliderMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleSliderMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => { isDragging.current = false; };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-16 md:pt-4 border-b border-white/10">
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
          <i className="fa-solid fa-arrow-left text-lg"></i>
        </button>
        <p className="text-xs font-black tracking-[0.3em]">COMPARE</p>
        <button onClick={onShare} className="text-amber-500 hover:text-amber-400 transition-colors">
          <i className="fa-solid fa-share-nodes text-lg"></i>
        </button>
      </div>

      {/* Comparison Area */}
      <div className="flex-1 relative overflow-hidden">
        {mode === 'slider' && (
          <div
            ref={containerRef}
            className="absolute inset-0 cursor-ew-resize"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchMove={handleTouchMove}
          >
            <div className="absolute inset-0">
              <img src={compareState.leftImage} alt={compareState.leftLabel} className="w-full h-full object-contain" />
            </div>
            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}>
              <img src={compareState.rightImage} alt={compareState.rightLabel} className="w-full h-full object-contain" />
            </div>
            <div className="absolute top-0 bottom-0 w-1 bg-white shadow-xl" style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-2xl flex items-center justify-center">
                <i className="fa-solid fa-arrows-left-right text-black"></i>
              </div>
            </div>
            <div className="absolute bottom-6 left-4 bg-black/80 backdrop-blur px-4 py-2 rounded-full">
              <p className="text-[10px] font-black tracking-widest">{compareState.leftLabel}</p>
            </div>
            <div className="absolute bottom-6 right-4 bg-amber-500 px-4 py-2 rounded-full">
              <p className="text-[10px] font-black text-black tracking-widest">{compareState.rightLabel}</p>
            </div>
          </div>
        )}

        {mode === 'side-by-side' && (
          <div className="absolute inset-0 flex">
            <div className="flex-1 relative border-r border-white/20">
              <img src={compareState.leftImage} alt={compareState.leftLabel} className="w-full h-full object-contain" />
              <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur px-3 py-1 rounded-full">
                <p className="text-[9px] font-black tracking-widest">{compareState.leftLabel}</p>
              </div>
            </div>
            <div className="flex-1 relative">
              <img src={compareState.rightImage} alt={compareState.rightLabel} className="w-full h-full object-contain" />
              <div className="absolute bottom-4 right-4 bg-amber-500 px-3 py-1 rounded-full">
                <p className="text-[9px] font-black text-black tracking-widest">{compareState.rightLabel}</p>
              </div>
            </div>
          </div>
        )}

        {mode === 'tap' && (
          <div className="absolute inset-0 cursor-pointer" onClick={() => setShowRight(!showRight)}>
            <img
              src={showRight ? compareState.rightImage : compareState.leftImage}
              alt={showRight ? compareState.rightLabel : compareState.leftLabel}
              className="w-full h-full object-contain transition-opacity duration-300"
            />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur px-6 py-3 rounded-full">
              <p className="text-[10px] font-black tracking-widest">
                {showRight ? compareState.rightLabel : compareState.leftLabel} · TAP TO SWITCH
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mode Selector */}
      <div className="p-4 border-t border-white/10">
        <div className="flex justify-around">
          <button onClick={() => setMode('slider')} className={`text-center px-4 py-2 rounded-lg transition-all ${mode === 'slider' ? 'bg-amber-500 text-black' : 'text-zinc-500 hover:text-white'}`}>
            <i className="fa-solid fa-arrows-left-right text-lg"></i>
            <p className="text-[9px] font-black mt-1">Slider</p>
          </button>
          <button onClick={() => setMode('side-by-side')} className={`text-center px-4 py-2 rounded-lg transition-all ${mode === 'side-by-side' ? 'bg-amber-500 text-black' : 'text-zinc-500 hover:text-white'}`}>
            <i className="fa-solid fa-table-columns text-lg"></i>
            <p className="text-[9px] font-black mt-1">Side by Side</p>
          </button>
          <button onClick={() => setMode('tap')} className={`text-center px-4 py-2 rounded-lg transition-all ${mode === 'tap' ? 'bg-amber-500 text-black' : 'text-zinc-500 hover:text-white'}`}>
            <i className="fa-solid fa-hand-pointer text-lg"></i>
            <p className="text-[9px] font-black mt-1">Tap to Flip</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompareView;
