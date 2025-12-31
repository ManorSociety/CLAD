
import { Material, MaterialType, SurfaceLayer, EnvironmentMode } from './types';

export const ENVIRONMENTS = [
  { mode: EnvironmentMode.EXISTING, icon: 'fa-location-dot', preview: 'https://images.unsplash.com/photo-1518005020480-47314b17c35a?q=80&w=400' },
  { mode: EnvironmentMode.ALPS, icon: 'fa-mountain', preview: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400' },
  { mode: EnvironmentMode.COASTAL, icon: 'fa-water', preview: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400' },
  { mode: EnvironmentMode.DESERT, icon: 'fa-sun', preview: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?q=80&w=400' },
  { mode: EnvironmentMode.FOREST, icon: 'fa-tree', preview: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400' }
];

export const ARCH_QUOTES = [
  "Architecture is the learned game, correct and magnificent, of forms assembled in the light.",
  "Design is not just what it looks like and feels like. Design is how it works.",
  "God is in the details.",
  "The mother art is architecture. Without an architecture of our own we have no soul of our own civilization.",
  "Simplicity is the ultimate sophistication.",
  "A room is not a room without natural light."
];

export const ROOM_PRESETS: Record<string, Partial<SurfaceLayer>[]> = {
  "Kitchen": [
    { name: "Cabinetry", category: MaterialType.PAINT },
    { name: "Island Stone", category: MaterialType.STONE },
    { name: "Backsplash", category: MaterialType.TILE },
    { name: "Flooring", category: MaterialType.WOOD }
  ],
  "Exterior": [
    { name: "Main Facade", category: MaterialType.SIDING },
    { name: "Roofing", category: MaterialType.ROOF },
    { name: "Accents", category: MaterialType.STONE },
    { name: "Trim", category: MaterialType.PAINT }
  ],
  "General": [
    { name: "Walls", category: MaterialType.PAINT },
    { name: "Flooring", category: MaterialType.WOOD },
    { name: "Ceiling", category: MaterialType.PAINT }
  ]
};

export const MATERIALS: Material[] = [
  { id: 'p-sw-alabaster', name: 'Alabaster', type: MaterialType.PAINT, manufacturer: 'Sherwin-Williams', colorCode: '#F2F0E6', tags: ['white', 'warm'] },
  { id: 'p-sw-tricorn', name: 'Tricorn Black', type: MaterialType.PAINT, manufacturer: 'Sherwin-Williams', colorCode: '#2D2F30', tags: ['black', 'modern'] },
  { id: 'p-bm-hale', name: 'Hale Navy', type: MaterialType.PAINT, manufacturer: 'Benjamin Moore', colorCode: '#45515D', tags: ['blue', 'luxury'] },
  { id: 's-marble-carrara', name: 'Carrara Marble', type: MaterialType.STONE, manufacturer: 'Natural', colorCode: '#F3F3F3', tags: ['white', 'classic'], textureUrl: 'https://images.unsplash.com/photo-1517582082532-16a092d373f1?auto=format&fit=crop&q=80&w=400' },
  { id: 'w-oak-white', name: 'White Oak', type: MaterialType.WOOD, manufacturer: 'Natural', colorCode: '#D8C0A6', tags: ['light', 'modern'], textureUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&q=80&w=400' },
  { id: 'r-met-matte-black', name: 'Matte Black Metal', type: MaterialType.ROOF, manufacturer: 'Sheffield', colorCode: '#1A1A1A', tags: ['metal', 'modern'] },
  { id: 'b-german-smear', name: 'German Smear', type: MaterialType.BRICK, manufacturer: 'Custom', colorCode: '#EFEFEF', tags: ['textured', 'white'] }
];

export const INITIAL_SURFACES: SurfaceLayer[] = [
  { id: '1', name: 'Main Walls', category: MaterialType.PAINT, selectedMaterialId: 'p-sw-alabaster' },
  { id: '2', name: 'Flooring', category: MaterialType.WOOD, selectedMaterialId: 'w-oak-white' },
  { id: '3', name: 'Accents', category: MaterialType.STONE, selectedMaterialId: null }
];
