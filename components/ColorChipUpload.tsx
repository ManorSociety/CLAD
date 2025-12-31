/**
 * Color Chip Upload Component
 */

import React, { useState, useRef } from 'react';
import { SavedColor } from '../types';
import { extractColorFromChip } from '../services/geminiService';
import { storage } from '../services/storageService';

interface ColorChipUploadProps {
  onColorExtracted: (color: SavedColor) => void;
  savedColors: SavedColor[];
  onColorSelect: (color: SavedColor) => void;
  onColorDelete: (colorId: string) => void;
}

export const ColorChipUpload: React.FC<ColorChipUploadProps> = ({
  onColorExtracted,
  savedColors,
  onColorSelect,
  onColorDelete
}) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedColor, setExtractedColor] = useState<SavedColor | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setError('');
    setExtractedColor(null);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        try {
          const color = await extractColorFromChip(base64);
          setExtractedColor(color);
          
          // Auto-save to storage
          await storage.saveColor(color);
          onColorExtracted(color);
        } catch (err: any) {
          setError(err.message || 'Failed to extract color');
        } finally {
          setIsExtracting(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Failed to process image');
      setIsExtracting(false);
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="space-y-3">
        <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">Upload Color Chip</h4>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={handleCameraCapture}
          disabled={isExtracting}
          className="w-full border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-amber-500/50 transition-all cursor-pointer disabled:opacity-50"
        >
          {isExtracting ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-t-2 border-amber-500 rounded-full animate-spin"></div>
              <p className="text-xs text-amber-500">Extracting color...</p>
            </div>
          ) : (
            <>
              <i className="fa-solid fa-camera text-3xl text-zinc-600 mb-3"></i>
              <p className="text-xs text-zinc-500">Tap to take photo or upload</p>
              <p className="text-[10px] text-zinc-700 mt-1">Paint chip, fabric swatch, stone sample</p>
            </>
          )}
        </button>

        {error && (
          <p className="text-xs text-red-500 text-center">{error}</p>
        )}
      </div>

      {/* Extracted Color Preview */}
      {extractedColor && (
        <div className="flex items-center gap-4 p-4 bg-black rounded-xl border border-white/10">
          <div 
            className="w-14 h-14 rounded-lg border border-white/20" 
            style={{ backgroundColor: extractedColor.hex }}
          ></div>
          <div className="flex-1">
            <p className="text-sm font-bold">{extractedColor.name}</p>
            <p className="text-[10px] text-zinc-500">{extractedColor.hex}</p>
          </div>
          <button 
            onClick={() => onColorSelect(extractedColor)}
            className="px-4 py-2 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest"
          >
            Apply
          </button>
        </div>
      )}

      {/* Saved Colors Grid */}
      {savedColors.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">My Saved Colors</h4>
          <div className="grid grid-cols-5 gap-2">
            {savedColors.map((color) => (
              <div key={color.id} className="relative group">
                <button
                  onClick={() => onColorSelect(color)}
                  className="w-full aspect-square rounded-lg border-2 border-transparent hover:border-amber-500 transition-all"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                ></button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onColorDelete(color.id);
                  }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
                <p className="text-[8px] text-zinc-600 text-center mt-1 truncate">{color.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apply To Surface */}
      <div className="space-y-3 pt-4 border-t border-white/5">
        <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">Apply Color To</h4>
        <div className="flex flex-wrap gap-2">
          {['Siding', 'Trim', 'Stone', 'Roof', 'Door', 'Shutters'].map((surface) => (
            <button
              key={surface}
              className="px-3 py-2 bg-white/5 text-[10px] font-bold rounded-lg hover:bg-amber-500 hover:text-black transition-all"
            >
              {surface}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorChipUpload;
