export enum AppView {
  LANDING = 'LANDING',
  MEMBERSHIP = 'MEMBERSHIP',
  CHECKOUT = 'CHECKOUT',
  SIGNUP = 'SIGNUP',
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  EDITOR = 'EDITOR',
  ACCOUNT = 'ACCOUNT',
  BUILDER_DASHBOARD = 'BUILDER_DASHBOARD',
  COMPARE = 'COMPARE',
  SHARE = 'SHARE'
}

export type AspectRatio = "16:9" | "9:16";
export type RenderMode = 'EXTERIOR' | 'INTERIOR';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  studioName?: string;
  tier: SubscriptionTier;
  billingCycle?: BillingCycle;
  isProjectPass?: boolean;
  projectPassExpiry?: number;
  projectPassRendersUsed?: number;
}

export enum SubscriptionTier {
  GUEST = 'GUEST',
  STANDARD = 'STANDARD',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
  PROJECT_PASS = 'PROJECT_PASS'
}

export const TIER_DETAILS = {
  [SubscriptionTier.GUEST]: {
    name: 'Guest Access',
    priceMonthly: '$0',
    priceAnnual: '$0',
    priceAnnualTotal: '$0',
    renders: 5,
    features: ['5 free renders', 'Exterior only', 'Standard styles']
  },
  [SubscriptionTier.STANDARD]: {
    name: 'STANDARD',
    priceMonthly: '$49/mo',
    priceAnnual: '$39/mo',
    priceAnnualTotal: '$470/year',
    renders: 15,
    features: ['15 renders/month', 'Exterior styles', 'Standard environments', 'Color chip upload']
  },
  [SubscriptionTier.PRO]: {
    name: 'PROFESSIONAL',
    priceMonthly: '$99/mo',
    priceAnnual: '$79/mo',
    priceAnnualTotal: '$950/year',
    renders: 75,
    features: ['75 renders/month', 'Interior + Exterior', 'VEO Cinematic Video', 'Compare view', 'Project sharing', 'All styles & environments']
  },
  [SubscriptionTier.ENTERPRISE]: {
    name: 'ENTERPRISE',
    priceMonthly: '$199/mo',
    priceAnnual: '$159/mo',
    priceAnnualTotal: '$1,910/year',
    renders: 99999,
    features: ['200 renders/month', 'Builder dashboard', 'Priority rendering', 'Offline mode', 'All Pro features']
  },
  [SubscriptionTier.PROJECT_PASS]: {
    name: 'PROJECT PASS',
    priceMonthly: '$499',
    priceAnnual: '$499',
    priceAnnualTotal: '$499 one-time',
    renders: 100,
    features: ['12 months access', '100 total renders', 'Interior + Exterior', 'VEO Cinematic Video', 'Project sharing', 'No subscription']
  }
};

export interface UsageStats {
  rendersCount: number;
  lastRenderAt: number;
  tier: SubscriptionTier;
  credits: number;
  isSubscribed: boolean;
  billingCycle?: BillingCycle;
}

export enum MaterialType {
  PAINT = 'PAINT',
  STONE = 'STONE',
  TILE = 'TILE',
  WOOD = 'WOOD',
  SIDING = 'SIDING',
  ROOF = 'ROOF',
  BRICK = 'BRICK',
  FLOORING = 'FLOORING',
  CABINET = 'CABINET',
  COUNTERTOP = 'COUNTERTOP',
  BACKSPLASH = 'BACKSPLASH',
  CUSTOM = 'CUSTOM'
}

export interface SavedColor {
  id: string;
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  createdAt: number;
  source?: 'chip' | 'picker' | 'extracted';
}

export interface Material {
  id: string;
  name: string;
  type: MaterialType;
  colorCode: string;
  tags: string[];
  manufacturer?: string;
  textureUrl?: string;
}

export interface SurfaceLayer {
  id: string;
  name: string;
  category: MaterialType;
  selectedMaterialId: string | null;
}

export enum LightingMode {
  MORNING = 'Morning Mist',
  MIDDAY = 'High Noon',
  GOLDEN = 'Golden Hour',
  TWILIGHT = 'Blue Hour',
  OVERCAST = 'Soft Overcast'
}

export enum EnvironmentMode {
  EXISTING = 'Original Site',
  ESTATE = 'Manicured Estate',
  ALPS = 'Alpine Peaks',
  COASTAL = 'Coastal Bluff',
  DESERT = 'Modern Desert',
  FOREST = 'Dense Forest',
  FOOTHILLS = 'Ridge Foothills',
  URBAN = 'Metro Context',
  SUBURBAN = 'Suburban Street',
  VINEYARD = 'Vineyard Estate',
  LAKEFRONT = 'Lakefront',
  MEADOW = 'Mountain Meadow',
  TROPICAL = 'Tropical Paradise',
  MEDITERRANEAN = 'Mediterranean Coast'
}

export const ENVIRONMENT_TIERS: Record<EnvironmentMode, SubscriptionTier> = {
  [EnvironmentMode.EXISTING]: SubscriptionTier.STANDARD,
  [EnvironmentMode.ESTATE]: SubscriptionTier.STANDARD,
  [EnvironmentMode.FOREST]: SubscriptionTier.STANDARD,
  [EnvironmentMode.SUBURBAN]: SubscriptionTier.STANDARD,
  [EnvironmentMode.ALPS]: SubscriptionTier.PRO,
  [EnvironmentMode.COASTAL]: SubscriptionTier.PRO,
  [EnvironmentMode.DESERT]: SubscriptionTier.PRO,
  [EnvironmentMode.VINEYARD]: SubscriptionTier.PRO,
  [EnvironmentMode.LAKEFRONT]: SubscriptionTier.PRO,
  [EnvironmentMode.FOOTHILLS]: SubscriptionTier.ENTERPRISE,
  [EnvironmentMode.URBAN]: SubscriptionTier.ENTERPRISE,
  [EnvironmentMode.MEADOW]: SubscriptionTier.ENTERPRISE,
  [EnvironmentMode.TROPICAL]: SubscriptionTier.ENTERPRISE,
  [EnvironmentMode.MEDITERRANEAN]: SubscriptionTier.ENTERPRISE,
};

export enum CameraAngle {
  FRONT = 'Direct POV',
  SIDE = 'Side POV',
  ANGLED = '3/4 POV',
  BIRDSEYE = 'Aerial POV'
}

export enum RoomType {
  KITCHEN = 'Kitchen',
  LIVING = 'Living Room',
  BEDROOM = 'Primary Bedroom',
  BATHROOM = 'Bathroom',
  OFFICE = 'Home Office',
  DINING = 'Dining Room',
  BASEMENT = 'Basement',
  LAUNDRY = 'Laundry Room',
  MUDROOM = 'Mudroom',
  PANTRY = 'Pantry'
}

export interface DesignStyle {
  id: string;
  name: string;
  dna: string;
  prompt_keywords: string[];
  tier: SubscriptionTier;
  mode: RenderMode;
}

export interface Project {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: number;
  generatedRenderings: string[];
  generatedFloorPlans: string[];
  generatedVideos: string[];
  referenceImages?: string[];
  activeStyleId?: string;
  lighting?: LightingMode;
  environment?: EnvironmentMode;
  cameraAngle?: CameraAngle;
  customDirectives?: string;
  preferredAspectRatio?: AspectRatio;
  renderMode?: RenderMode;
  roomType?: RoomType;
  clientName?: string;
  clientEmail?: string;
  status?: 'design' | 'approved' | 'building' | 'complete';
  sharedLinks?: SharedLink[];
  savedColors?: SavedColor[];
  isOfflineCached?: boolean;
}

export interface SharedLink {
  id: string;
  url: string;
  createdAt: number;
  expiresAt?: number;
  allowDownload: boolean;
  requireEmail: boolean;
  viewCount: number;
}

export interface CompareState {
  leftImage: string;
  rightImage: string;
  leftLabel: string;
  rightLabel: string;
}

// EXTERIOR STYLES
export const DESIGN_STYLES: DesignStyle[] = [
  // STANDARD TIER - EXTERIOR
  { id: 'original', name: 'Original Structure', dna: 'Preserve form exactly as-is. Apply photorealistic materials and textures.', prompt_keywords: ['original'], tier: SubscriptionTier.STANDARD, mode: 'EXTERIOR' },
  { id: 'traditional-english', name: 'Traditional English', dna: 'Classic red/brown brick, white timber accents, small-pane windows, slate roof.', prompt_keywords: ['traditional english'], tier: SubscriptionTier.STANDARD, mode: 'EXTERIOR' },
  { id: 'cape-cod', name: 'Cape Cod', dna: 'Symmetrical facade, cedar shingle siding, steep gabled roof, central chimney, dormer windows.', prompt_keywords: ['cape cod'], tier: SubscriptionTier.STANDARD, mode: 'EXTERIOR' },
  { id: 'colonial', name: 'Colonial', dna: 'Two-story symmetrical, brick or clapboard, portico entry with columns, black shutters, multi-pane windows.', prompt_keywords: ['colonial'], tier: SubscriptionTier.STANDARD, mode: 'EXTERIOR' },
  { id: 'modern', name: 'Modern', dna: 'Flat roofs, clean geometric lines, floor-to-ceiling glass, white stucco, minimal ornamentation.', prompt_keywords: ['modern'], tier: SubscriptionTier.STANDARD, mode: 'EXTERIOR' },
  { id: 'modern-farmhouse', name: 'Modern Farmhouse', dna: 'White board-and-batten siding, black metal-frame windows, standing seam metal roof accents, wraparound porch.', prompt_keywords: ['farmhouse'], tier: SubscriptionTier.STANDARD, mode: 'EXTERIOR' },
  { id: 'scandinavian', name: 'Scandinavian', dna: 'Light natural wood cladding, minimalist design, large windows, black or charcoal accents, simple gabled roof.', prompt_keywords: ['scandi'], tier: SubscriptionTier.STANDARD, mode: 'EXTERIOR' },
  { id: 'craftsman', name: 'Craftsman', dna: 'Exposed rafter tails, tapered porch columns on stone bases, shingle siding, low-pitched roof with wide eaves.', prompt_keywords: ['craftsman'], tier: SubscriptionTier.STANDARD, mode: 'EXTERIOR' },
  { id: 'industrial', name: 'Industrial', dna: 'Exposed steel beams, brick walls, large factory-style windows, metal cladding, raw concrete elements.', prompt_keywords: ['industrial'], tier: SubscriptionTier.STANDARD, mode: 'EXTERIOR' },
  { id: 'ranch', name: 'Ranch', dna: 'Single-story, long horizontal profile, low-pitched roof, attached garage, brick or wood siding.', prompt_keywords: ['ranch'], tier: SubscriptionTier.STANDARD, mode: 'EXTERIOR' },

  // PRO TIER - EXTERIOR
  { id: 'tudor', name: 'Tudor Revival', dna: 'Decorative half-timbering, steep cross-gabled roof, tall chimneys, casement windows, stucco and brick.', prompt_keywords: ['tudor'], tier: SubscriptionTier.PRO, mode: 'EXTERIOR' },
  { id: 'french-country', name: 'French Country', dna: 'Cream limestone or stucco, hipped roof with flared eaves, arched windows and doors, copper accents.', prompt_keywords: ['french country'], tier: SubscriptionTier.PRO, mode: 'EXTERIOR' },
  { id: 'mediterranean', name: 'Mediterranean', dna: 'Warm stucco walls, terracotta clay tile roof, arched openings, wrought iron details, courtyard orientation.', prompt_keywords: ['mediterranean'], tier: SubscriptionTier.PRO, mode: 'EXTERIOR' },
  { id: 'spanish-colonial', name: 'Spanish Colonial', dna: 'White stucco walls, red clay barrel tile roof, ornate wooden doors, wrought iron balconies, arched walkways.', prompt_keywords: ['spanish colonial'], tier: SubscriptionTier.PRO, mode: 'EXTERIOR' },
  { id: 'tuscan', name: 'Tuscan Villa', dna: 'Rustic stone and stucco, terracotta roof tiles, pergolas, arched loggias, warm earth tones, cypress trees.', prompt_keywords: ['tuscan'], tier: SubscriptionTier.PRO, mode: 'EXTERIOR' },
  { id: 'japandi', name: 'Japandi', dna: 'Zen minimalism, natural wood slat screens, clean lines, muted earth tones, indoor-outdoor flow.', prompt_keywords: ['japandi'], tier: SubscriptionTier.PRO, mode: 'EXTERIOR' },
  { id: 'prairie', name: 'Prairie Style', dna: 'Strong horizontal lines, flat or hipped roof with broad overhangs, ribbon windows, natural materials.', prompt_keywords: ['prairie'], tier: SubscriptionTier.PRO, mode: 'EXTERIOR' },
  { id: 'victorian', name: 'Victorian', dna: 'Ornate decorative trim, wrap-around porch, bay windows, steep roof with multiple gables, colorful paint scheme.', prompt_keywords: ['victorian'], tier: SubscriptionTier.PRO, mode: 'EXTERIOR' },
  { id: 'log-cabin', name: 'Luxury Log', dna: 'Massive hand-hewn timber logs, large stone chimney, exposed beam ceilings, rustic mountain lodge aesthetic.', prompt_keywords: ['log cabin'], tier: SubscriptionTier.PRO, mode: 'EXTERIOR' },
  { id: 'georgian', name: 'Georgian', dna: 'Symmetrical brick facade, centered door with pediment, multi-pane sash windows, hip roof, dentil molding.', prompt_keywords: ['georgian'], tier: SubscriptionTier.PRO, mode: 'EXTERIOR' },
  { id: 'mid-century', name: 'Mid-Century Modern', dna: 'Post-and-beam construction, floor-to-ceiling glass, integration with nature, flat planes, organic shapes.', prompt_keywords: ['mid-century modern'], tier: SubscriptionTier.PRO, mode: 'EXTERIOR' },

  // ENTERPRISE TIER - EXTERIOR
  { id: 'modern-english', name: 'Modern English', dna: 'Steep gables, cream or painted brick, black window frames, slate roof, formal symmetry with modern touches.', prompt_keywords: ['english manor'], tier: SubscriptionTier.ENTERPRISE, mode: 'EXTERIOR' },
  { id: 'brutalist', name: 'Brutalist', dna: 'Raw exposed concrete, bold geometric forms, minimal windows, monolithic appearance.', prompt_keywords: ['brutalist'], tier: SubscriptionTier.ENTERPRISE, mode: 'EXTERIOR' },
  { id: 'organic', name: 'Organic', dna: 'Flowing curved shapes, integration with landscape, natural materials, Frank Lloyd Wright influence.', prompt_keywords: ['organic architecture'], tier: SubscriptionTier.ENTERPRISE, mode: 'EXTERIOR' },
  { id: 'bristol', name: 'Bristol Transitional', dna: 'Modern clean textures on traditional massing, mix of stone and smooth stucco, updated classic proportions.', prompt_keywords: ['transitional'], tier: SubscriptionTier.ENTERPRISE, mode: 'EXTERIOR' },
  { id: 'desert-modern', name: 'Desert Modern', dna: 'Low-profile silhouette, sand and earth tones, rammed earth or stucco, seamless indoor-outdoor living.', prompt_keywords: ['desert'], tier: SubscriptionTier.ENTERPRISE, mode: 'EXTERIOR' },
  { id: 'post-modern', name: 'Post-Modern', dna: 'Playful geometry, bold colors, ironic classical references, asymmetry, unexpected material combinations.', prompt_keywords: ['post-modern'], tier: SubscriptionTier.ENTERPRISE, mode: 'EXTERIOR' },
  { id: 'a-frame', name: 'A-Frame', dna: 'Dramatic triangular silhouette, steeply pitched roof to ground, large front glass wall, wood or shingle exterior.', prompt_keywords: ['a-frame'], tier: SubscriptionTier.ENTERPRISE, mode: 'EXTERIOR' },
  { id: 'art-deco', name: 'Art Deco', dna: 'Geometric patterns, stepped facades, bold vertical lines, sunburst motifs, chrome and glass accents.', prompt_keywords: ['art deco'], tier: SubscriptionTier.ENTERPRISE, mode: 'EXTERIOR' },
  { id: 'pueblo', name: 'Pueblo Revival', dna: 'Adobe walls with rounded edges, flat roof with parapet, exposed vigas wooden beams, earth tones.', prompt_keywords: ['pueblo'], tier: SubscriptionTier.ENTERPRISE, mode: 'EXTERIOR' },
  { id: 'mountain-lodge', name: 'Mountain Lodge', dna: 'Heavy timber frame, large stone base, expansive windows, steep roof for snow, rustic luxury materials.', prompt_keywords: ['mountain lodge'], tier: SubscriptionTier.ENTERPRISE, mode: 'EXTERIOR' },
  { id: 'coastal-contemporary', name: 'Coastal Contemporary', dna: 'Light and airy, large glass expanses, weathered wood, white and blue palette, elevated on pilings.', prompt_keywords: ['coastal contemporary'], tier: SubscriptionTier.ENTERPRISE, mode: 'EXTERIOR' },

  // INTERIOR STYLES - PRO TIER AND ABOVE
  { id: 'int-modern', name: 'Modern', dna: 'Clean lines, minimalist furniture, neutral palette with bold accents, open floor plan, polished surfaces.', prompt_keywords: ['modern interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-farmhouse', name: 'Farmhouse', dna: 'Shiplap walls, barn doors, apron sink, reclaimed wood, white and natural tones, vintage accents.', prompt_keywords: ['farmhouse interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-scandinavian', name: 'Scandinavian', dna: 'Light woods, white walls, cozy textiles, functional furniture, hygge atmosphere, natural light.', prompt_keywords: ['scandinavian interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-traditional', name: 'Traditional', dna: 'Rich wood tones, crown molding, classic furniture, symmetry, warm colors, elegant fabrics.', prompt_keywords: ['traditional interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-industrial', name: 'Industrial', dna: 'Exposed brick, metal fixtures, concrete floors, open ductwork, Edison bulbs, raw materials.', prompt_keywords: ['industrial interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-coastal', name: 'Coastal', dna: 'Blue and white palette, natural textures, rattan furniture, nautical accents, airy and relaxed.', prompt_keywords: ['coastal interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-transitional', name: 'Transitional', dna: 'Blend of traditional and contemporary, neutral palette, comfortable elegance, timeless appeal.', prompt_keywords: ['transitional interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-minimalist', name: 'Minimalist', dna: 'Bare essentials, monochromatic palette, hidden storage, clean surfaces, purposeful design.', prompt_keywords: ['minimalist interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-rustic', name: 'Rustic', dna: 'Natural wood beams, stone fireplace, leather furniture, warm earth tones, handcrafted elements.', prompt_keywords: ['rustic interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-mediterranean', name: 'Mediterranean', dna: 'Terracotta tiles, wrought iron, arched doorways, warm colors, textured walls, mosaic accents.', prompt_keywords: ['mediterranean interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-contemporary', name: 'Contemporary', dna: 'Current trends, mixed materials, statement lighting, bold art, sophisticated and curated.', prompt_keywords: ['contemporary interior'], tier: SubscriptionTier.ENTERPRISE, mode: 'INTERIOR' },
  { id: 'int-luxury', name: 'Luxury', dna: 'High-end materials, marble surfaces, gold accents, designer furniture, opulent finishes, grand scale.', prompt_keywords: ['luxury interior'], tier: SubscriptionTier.ENTERPRISE, mode: 'INTERIOR' },
];

// Generic material library (no brand names)
export const MATERIAL_LIBRARY = {
  siding: [
    { id: 'fiber-cement-smooth', name: 'Fiber Cement - Smooth', type: 'siding' },
    { id: 'fiber-cement-wood', name: 'Fiber Cement - Wood Grain', type: 'siding' },
    { id: 'vinyl-dutch', name: 'Vinyl - Dutch Lap', type: 'siding' },
    { id: 'cedar-shake', name: 'Cedar Shake', type: 'siding' },
    { id: 'board-batten', name: 'Board & Batten', type: 'siding' },
    { id: 'stucco-smooth', name: 'Stucco - Smooth', type: 'siding' },
    { id: 'stucco-sand', name: 'Stucco - Sand Finish', type: 'siding' },
  ],
  stone: [
    { id: 'natural-limestone', name: 'Natural Limestone', type: 'stone' },
    { id: 'natural-fieldstone', name: 'Natural Fieldstone', type: 'stone' },
    { id: 'manufactured-ledge', name: 'Manufactured Ledgestone', type: 'stone' },
    { id: 'manufactured-stacked', name: 'Manufactured Stacked Stone', type: 'stone' },
    { id: 'brick-standard', name: 'Brick - Standard', type: 'stone' },
    { id: 'brick-thin', name: 'Brick - Thin', type: 'stone' },
  ],
  roofing: [
    { id: 'architectural-shingle', name: 'Architectural Shingle', type: 'roofing' },
    { id: '3tab-shingle', name: '3-Tab Shingle', type: 'roofing' },
    { id: 'metal-standing', name: 'Metal Standing Seam', type: 'roofing' },
    { id: 'clay-tile', name: 'Clay Tile', type: 'roofing' },
    { id: 'slate', name: 'Slate', type: 'roofing' },
    { id: 'composite-shake', name: 'Composite Shake', type: 'roofing' },
  ],
  flooring: [
    { id: 'hardwood-oak', name: 'Hardwood - Oak', type: 'flooring' },
    { id: 'hardwood-walnut', name: 'Hardwood - Walnut', type: 'flooring' },
    { id: 'engineered-wood', name: 'Engineered Wood', type: 'flooring' },
    { id: 'porcelain-tile', name: 'Porcelain Tile', type: 'flooring' },
    { id: 'natural-stone-tile', name: 'Natural Stone Tile', type: 'flooring' },
    { id: 'luxury-vinyl', name: 'Luxury Vinyl Plank', type: 'flooring' },
    { id: 'polished-concrete', name: 'Polished Concrete', type: 'flooring' },
  ],
  cabinets: [
    { id: 'shaker-white', name: 'Shaker - White', type: 'cabinet' },
    { id: 'shaker-gray', name: 'Shaker - Gray', type: 'cabinet' },
    { id: 'shaker-navy', name: 'Shaker - Navy', type: 'cabinet' },
    { id: 'flat-panel-white', name: 'Flat Panel - White', type: 'cabinet' },
    { id: 'flat-panel-wood', name: 'Flat Panel - Natural Wood', type: 'cabinet' },
    { id: 'raised-panel', name: 'Raised Panel - Traditional', type: 'cabinet' },
    { id: 'glass-front', name: 'Glass Front', type: 'cabinet' },
  ],
  countertops: [
    { id: 'quartz-white', name: 'Quartz - White', type: 'countertop' },
    { id: 'quartz-gray', name: 'Quartz - Gray Veined', type: 'countertop' },
    { id: 'granite-black', name: 'Granite - Black', type: 'countertop' },
    { id: 'granite-brown', name: 'Granite - Brown Speckled', type: 'countertop' },
    { id: 'marble-white', name: 'Marble - White Carrara', type: 'countertop' },
    { id: 'butcher-block', name: 'Butcher Block', type: 'countertop' },
    { id: 'concrete-counter', name: 'Concrete', type: 'countertop' },
  ],
  backsplash: [
    { id: 'subway-white', name: 'Subway Tile - White', type: 'backsplash' },
    { id: 'subway-gray', name: 'Subway Tile - Gray', type: 'backsplash' },
    { id: 'herringbone', name: 'Herringbone Pattern', type: 'backsplash' },
    { id: 'hexagon', name: 'Hexagon Tile', type: 'backsplash' },
    { id: 'marble-slab', name: 'Marble Slab', type: 'backsplash' },
    { id: 'glass-tile', name: 'Glass Tile', type: 'backsplash' },
    { id: 'natural-stone', name: 'Natural Stone', type: 'backsplash' },
  ]
};
