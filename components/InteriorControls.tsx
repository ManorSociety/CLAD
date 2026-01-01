/**
 * Interior Controls Component
 */

import React from 'react';
import { RoomType, DESIGN_STYLES, MATERIAL_LIBRARY } from '../types';

interface InteriorControlsProps {
  roomType: RoomType;
  onRoomTypeChange: (room: RoomType) => void;
  selectedStyle: string;
  onStyleChange: (styleId: string) => void;
  materials: {
    flooring?: string;
    cabinets?: string;
    countertops?: string;
    backsplash?: string;
  };
  onMaterialChange: (category: string, value: string) => void;
}

export const InteriorControls: React.FC<InteriorControlsProps> = ({
  roomType,
  onRoomTypeChange,
  selectedStyle,
  onStyleChange,
  materials,
  onMaterialChange
}) => {
  const interiorStyles = DESIGN_STYLES.filter(s => s.mode === 'INTERIOR');

  const roomTypes: { type: RoomType; icon: string }[] = [
    { type: RoomType.KITCHEN, icon: 'fa-utensils' },
    { type: RoomType.PREP_KITCHEN, icon: 'fa-blender' },
    { type: RoomType.PANTRY, icon: 'fa-jar' },
    { type: RoomType.DINING, icon: 'fa-wine-glass' },
    { type: RoomType.LIVING, icon: 'fa-couch' },
    { type: RoomType.FAMILY, icon: 'fa-tv' },
    { type: RoomType.BEDROOM, icon: 'fa-bed' },
    { type: RoomType.BATHROOM, icon: 'fa-bath' },
    { type: RoomType.CLOSET, icon: 'fa-shirt' },
    { type: RoomType.LAUNDRY, icon: 'fa-soap' },
    { type: RoomType.OFFICE, icon: 'fa-briefcase' },
    { type: RoomType.LOFT, icon: 'fa-stairs' },
    { type: RoomType.THEATER, icon: 'fa-film' },
    { type: RoomType.GAME, icon: 'fa-gamepad' },
    { type: RoomType.FITNESS, icon: 'fa-dumbbell' },
    { type: RoomType.SPORTS, icon: 'fa-basketball' },
    { type: RoomType.STORAGE, icon: 'fa-box' },
    { type: RoomType.ENTRY, icon: 'fa-door-open' },
  ];

  return (
    <div className="space-y-6">
      {/* Room Type Selector */}
      <div className="space-y-3">
        <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">Room Type</h4>
        <div className="space-y-2">
          {roomTypes.map(({ type, icon }) => (
            <button
              key={type}
              onClick={() => onRoomTypeChange(type)}
              className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
                roomType === type
                  ? 'bg-amber-500/20 border border-amber-500'
                  : 'bg-white/5 border border-white/10 hover:border-white/30'
              }`}
            >
              <i className={`fa-solid ${icon} ${roomType === type ? 'text-amber-500' : 'text-zinc-500'}`}></i>
              <span className={`text-xs font-bold ${roomType === type ? 'text-white' : 'text-zinc-400'}`}>{type}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Interior Styles */}
      <div className="space-y-3">
        <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">Interior Style</h4>
        <div className="grid grid-cols-2 gap-2">
          {interiorStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => onStyleChange(style.id)}
              className={`p-3 rounded-xl text-xs font-bold transition-all ${
                selectedStyle === style.id
                  ? 'bg-amber-500/20 border border-amber-500 text-white'
                  : 'bg-white/5 border border-white/10 text-zinc-400 hover:border-white/30'
              }`}
            >
              {style.name}
            </button>
          ))}
        </div>
      </div>

      {/* Materials - Only show for Kitchen */}
      {roomType === RoomType.KITCHEN && (
        <div className="space-y-4">
          <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">Materials</h4>

          {/* Flooring */}
          <div className="space-y-2">
            <p className="text-[10px] text-zinc-600">Flooring</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {MATERIAL_LIBRARY.flooring.map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => onMaterialChange('flooring', mat.name)}
                  className={`shrink-0 px-3 py-2 rounded-lg text-[10px] transition-all ${
                    materials.flooring === mat.name
                      ? 'bg-amber-500 text-black font-bold'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  {mat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Cabinets */}
          <div className="space-y-2">
            <p className="text-[10px] text-zinc-600">Cabinets</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {MATERIAL_LIBRARY.cabinets.map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => onMaterialChange('cabinets', mat.name)}
                  className={`shrink-0 px-3 py-2 rounded-lg text-[10px] transition-all ${
                    materials.cabinets === mat.name
                      ? 'bg-amber-500 text-black font-bold'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  {mat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Countertops */}
          <div className="space-y-2">
            <p className="text-[10px] text-zinc-600">Countertops</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {MATERIAL_LIBRARY.countertops.map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => onMaterialChange('countertops', mat.name)}
                  className={`shrink-0 px-3 py-2 rounded-lg text-[10px] transition-all ${
                    materials.countertops === mat.name
                      ? 'bg-amber-500 text-black font-bold'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  {mat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Backsplash */}
          <div className="space-y-2">
            <p className="text-[10px] text-zinc-600">Backsplash</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {MATERIAL_LIBRARY.backsplash.map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => onMaterialChange('backsplash', mat.name)}
                  className={`shrink-0 px-3 py-2 rounded-lg text-[10px] transition-all ${
                    materials.backsplash === mat.name
                      ? 'bg-amber-500 text-black font-bold'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  {mat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteriorControls;
