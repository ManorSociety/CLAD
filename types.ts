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
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  trialEndsAt?: number;
  trialRendersUsed?: number;
}

export enum SubscriptionTier {
  FREE_TRIAL = 'FREE_TRIAL',
  STANDARD = 'STANDARD',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE'
}

export interface TierFeatures {
  name: string;
  priceMonthly: string;
  priceAnnual: string;
  priceAnnualTotal: string;
  renders: number;
  cineRenderVideos: number;
  hasInterior: boolean;
  hasCompareSlider: boolean;
  hasColorChip: boolean;
  hasShareToSocial: boolean;
  hasProjectFolders: boolean;
  hasRenderHistory: boolean;
  hasDownloadZip: boolean;
  shareLinksWatermarked: boolean;
  hasPdfExport: boolean;
  hasGifExport: boolean;
  hasSocialTemplates: boolean;
  hasEmailToClient: boolean;
  hasStylePresets: boolean;
  hasMaterialTakeoff: boolean;
  batchUploadLimit: number;
  teamSeats: number;
  hasWhiteLabel: boolean;
  hasCustomWatermark: boolean;
  hasPriorityQueue: boolean;
  hasDedicatedSupport: boolean;
  features: string[];
  styles: string[];
  environments: string[];
}

export const TIER_DETAILS: Record<SubscriptionTier, TierFeatures> = {
  [SubscriptionTier.FREE_TRIAL]: {
    name: 'Free Trial',
    priceMonthly: '$0',
    priceAnnual: '$0',
    priceAnnualTotal: '$0',
    renders: 3,
    cineRenderVideos: 0,
    hasInterior: false,
    hasCompareSlider: false,
    hasColorChip: false,
    hasShareToSocial: false,
    hasProjectFolders: false,
    hasRenderHistory: true,
    hasDownloadZip: false,
    shareLinksWatermarked: true,
    hasPdfExport: false,
    hasGifExport: false,
    hasSocialTemplates: false,
    hasEmailToClient: false,
    hasStylePresets: false,
    hasMaterialTakeoff: false,
    batchUploadLimit: 1,
    teamSeats: 1,
    hasWhiteLabel: false,
    hasCustomWatermark: false,
    hasPriorityQueue: false,
    hasDedicatedSupport: false,
    features: ['3 renders total', '5 basic exterior styles', 'Watermarked output', '7-day trial'],
    styles: ['Original', 'Modern', 'Farmhouse', 'Craftsman', 'Colonial'],
    environments: ['Original Site', 'Suburban Street']
  },
  [SubscriptionTier.STANDARD]: {
    name: 'Standard',
    priceMonthly: '$49/mo',
    priceAnnual: '$39/mo',
    priceAnnualTotal: '$470/year',
    renders: 25,
    cineRenderVideos: 0,
    hasInterior: false,
    hasCompareSlider: true,
    hasColorChip: true,
    hasShareToSocial: true,
    hasProjectFolders: true,
    hasRenderHistory: true,
    hasDownloadZip: true,
    shareLinksWatermarked: true,
    hasPdfExport: false,
    hasGifExport: false,
    hasSocialTemplates: false,
    hasEmailToClient: false,
    hasStylePresets: false,
    hasMaterialTakeoff: false,
    batchUploadLimit: 1,
    teamSeats: 1,
    hasWhiteLabel: false,
    hasCustomWatermark: false,
    hasPriorityQueue: false,
    hasDedicatedSupport: false,
    features: ['25 renders/month', 'All exterior styles', 'Compare slider', 'Color chip upload', 'Share to social', 'Project folders', 'Download ZIP'],
    styles: ['All Exterior'],
    environments: ['All Standard']
  },
  [SubscriptionTier.PRO]: {
    name: 'Professional',
    priceMonthly: '$99/mo',
    priceAnnual: '$79/mo',
    priceAnnualTotal: '$950/year',
    renders: 75,
    cineRenderVideos: 10,
    hasInterior: true,
    hasCompareSlider: true,
    hasColorChip: true,
    hasShareToSocial: true,
    hasProjectFolders: true,
    hasRenderHistory: true,
    hasDownloadZip: true,
    shareLinksWatermarked: false,
    hasPdfExport: true,
    hasGifExport: true,
    hasSocialTemplates: true,
    hasEmailToClient: true,
    hasStylePresets: true,
    hasMaterialTakeoff: true,
    batchUploadLimit: 5,
    teamSeats: 1,
    hasWhiteLabel: false,
    hasCustomWatermark: false,
    hasPriorityQueue: false,
    hasDedicatedSupport: false,
    features: ['75 renders/month', '10 CineRender videos', 'Interior + Exterior', 'PDF presentation export', 'Before/After GIF', 'Material takeoff', 'Batch upload (5)', 'Clean share links'],
    styles: ['All Exterior', 'All Interior'],
    environments: ['All Environments']
  },
  [SubscriptionTier.ENTERPRISE]: {
    name: 'Enterprise',
    priceMonthly: '$299/mo',
    priceAnnual: '$239/mo',
    priceAnnualTotal: '$2,870/year',
    renders: 200,
    cineRenderVideos: 20,
    hasInterior: true,
    hasCompareSlider: true,
    hasColorChip: true,
    hasShareToSocial: true,
    hasProjectFolders: true,
    hasRenderHistory: true,
    hasDownloadZip: true,
    shareLinksWatermarked: false,
    hasPdfExport: true,
    hasGifExport: true,
    hasSocialTemplates: true,
    hasEmailToClient: true,
    hasStylePresets: true,
    hasMaterialTakeoff: true,
    batchUploadLimit: 10,
    teamSeats: 5,
    hasWhiteLabel: true,
    hasCustomWatermark: true,
    hasPriorityQueue: true,
    hasDedicatedSupport: true,
    features: ['200 renders/month', '20 CineRender videos', '5 team seats', 'White label mode', 'Custom watermark', 'Priority queue', 'Dedicated Slack support', 'All Pro features'],
    styles: ['All Exterior', 'All Interior'],
    environments: ['All Environments']
  }
};

export const canAccessFeature = (tier: SubscriptionTier, feature: keyof TierFeatures): boolean => {
  const details = TIER_DETAILS[tier];
  const value = details[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  return true;
};

export const hasRendersRemaining = (tier: SubscriptionTier, used: number): boolean => {
  return used < TIER_DETAILS[tier].renders;
};

export const canUseCineRender = (tier: SubscriptionTier, used: number): boolean => {
  const limit = TIER_DETAILS[tier].cineRenderVideos;
  return limit > 0 && used < limit;
};

export interface UsageStats {
  rendersCount: number;
  cineRenderCount: number;
  lastRenderAt: number;
  tier: SubscriptionTier;
  credits: number;
  isSubscribed: boolean;
  billingCycle?: BillingCycle;
  periodStartAt?: number;
  periodEndAt?: number;
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
  [EnvironmentMode.EXISTING]: SubscriptionTier.FREE_TRIAL,
  [EnvironmentMode.SUBURBAN]: SubscriptionTier.FREE_TRIAL,
  [EnvironmentMode.ESTATE]: SubscriptionTier.STANDARD,
  [EnvironmentMode.FOREST]: SubscriptionTier.STANDARD,
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
  PREP_KITCHEN = 'Prep Kitchen / Scullery',
  PANTRY = 'Pantry / Food Storage',
  DINING = 'Dining Room',
  LIVING = 'Living Room / Great Room',
  FAMILY = 'Family Room / Lounge',
  BEDROOM = 'Bedroom',
  BATHROOM = 'Bathroom',
  CLOSET = 'Closet / Dressing Room',
  LAUNDRY = 'Laundry / Mudroom',
  OFFICE = 'Office / Study',
  LOFT = 'Loft / Bonus Room',
  THEATER = 'Theater / Media Room',
  GAME = 'Game / Recreation Room',
  FITNESS = 'Exercise / Fitness Room',
  SPORTS = 'Sports Court',
  STORAGE = 'Storage / Utility',
  ENTRY = 'Entry / Foyer / Hall'
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
  folderId?: string;
}

export interface ProjectFolder {
  id: string;
  name: string;
  createdAt: number;
  projectIds: string[];
}

export interface SharedLink {
  id: string;
  url: string;
  createdAt: number;
  expiresAt?: number;
  allowDownload: boolean;
  requireEmail: boolean;
  viewCount: number;
  isWatermarked: boolean;
  customBranding?: {
    logoUrl?: string;
    companyName?: string;
    primaryColor?: string;
  };
}

export interface CompareState {
  leftImage: string;
  rightImage: string;
  leftLabel: string;
  rightLabel: string;
}

export const DESIGN_STYLES: DesignStyle[] = [
  { id: 'original', name: 'Original Structure', dna: 'Preserve form exactly as-is. Apply photorealistic materials and textures.', prompt_keywords: ['original'], tier: SubscriptionTier.FREE_TRIAL, mode: 'EXTERIOR' },
  { id: 'modern', name: 'Modern', dna: 'Flat roofs, clean geometric lines, floor-to-ceiling glass, white stucco, minimal ornamentation.', prompt_keywords: ['modern'], tier: SubscriptionTier.FREE_TRIAL, mode: 'EXTERIOR' },
  { id: 'modern-farmhouse', name: 'Modern Farmhouse', dna: 'White board-and-batten siding, black metal-frame windows, standing seam metal roof accents, wraparound porch.', prompt_keywords: ['farmhouse'], tier: SubscriptionTier.FREE_TRIAL, mode: 'EXTERIOR' },
  { id: 'craftsman', name: 'Craftsman', dna: 'Exposed rafter tails, tapered porch columns on stone bases, shingle siding, low-pitched roof with wide eaves.', prompt_keywords: ['craftsman'], tier: SubscriptionTier.FREE_TRIAL, mode: 'EXTERIOR' },
  { id: 'colonial', name: 'Colonial', dna: 'Two-story symmetrical, brick or clapboard, portico entry with columns, black shutters, multi-pane windows.', prompt_keywords: ['colonial'], tier: SubscriptionTier.FREE_TRIAL, mode: 'EXTERIOR' },
  { id: 'traditional-english', name: 'Traditional English', dna: 'Classic red/brown brick, white timber accents, small-pane windows, slate roof.', prompt_keywords: ['traditional english'], tier: SubscriptionTier.STANDARD, mode: 'EXTERIOR' },
  { id: 'cape-cod', name: 'Cape Cod', dna: 'Symmetrical facade, cedar shingle siding, steep gabled roof, central chimney, dormer windows.', prompt_keywords: ['cape cod'], tier: SubscriptionTier.STANDARD, mode: 'EXTERIOR' },
  { id: 'scandinavian', name: 'Scandinavian', dna: 'Light natural wood cladding, minimalist design, large windows, black or charcoal accents, simple gabled roof.', prompt_keywords: ['scandi'], tier: SubscriptionTier.STANDARD, mode: 'EXTERIOR' },
  { id: 'industrial', name: 'Industrial', dna: 'Exposed steel beams, brick walls, large factory-style windows, metal cladding, raw concrete elements.', prompt_keywords: ['industrial'], tier: SubscriptionTier.STANDARD, mode: 'EXTERIOR' },
  { id: 'ranch', name: 'Ranch', dna: 'Single-story, long horizontal profile, low-pitched roof, attached garage, brick or wood siding.', prompt_keywords: ['ranch'], tier: SubscriptionTier.STANDARD, mode: 'EXTERIOR' },
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
  // ============ INTERIOR STYLES (39 total) ============
  { id: 'int-original', name: 'Original Structure', dna: 'No theme. Present as-is with subtle finish cleanup and staging. Control mode - preserve existing design intent, only refine lighting balance and minimal staging.', prompt_keywords: ['original interior'], tier: SubscriptionTier.FREE, mode: 'INTERIOR' },
  { id: 'int-modern', name: 'Modern', dna: 'Clean lines, minimal ornament, flat or thin-shaker cabinetry, stone or quartz surfaces, neutral palette with strong contrast. Slab cabinets, matte black or brushed nickel hardware, statement lighting with simple geometry.', prompt_keywords: ['modern interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-modern-farmhouse', name: 'Modern Farmhouse', dna: 'Warm and welcoming with clean lines. Shaker cabinets, light oak floors, matte black or aged brass accents, simple rustic textures. Lantern pendants, apron-front sink style (if sink exists), warm whites.', prompt_keywords: ['modern farmhouse interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-craftsman', name: 'Craftsman', dna: 'Built-in feel, rich wood, honest materials, thick trim profiles, earth-tone colors. Warm stained oak, aged bronze hardware, mission-style lighting, sturdy furniture.', prompt_keywords: ['craftsman interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-colonial', name: 'Colonial', dna: 'Symmetrical and classic. Paneled trim, traditional furniture, formal but not fussy. East Coast heritage, polished nickel or brass, classic chandeliers, tailored textiles.', prompt_keywords: ['colonial interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-traditional-english', name: 'Traditional English', dna: 'Layered, cozy, elegant. Panel molding, wainscoting, warm woods, heritage colors, brass lighting, Persian-inspired rugs, timeless furniture, library sconces.', prompt_keywords: ['traditional english interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-cape-cod', name: 'Cape Cod', dna: 'Light, breezy, coastal-traditional. Whites, soft blues, beadboard accents, simple Shaker cabinetry, relaxed linen window treatments, natural fiber rugs.', prompt_keywords: ['cape cod interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-scandinavian', name: 'Scandinavian', dna: 'Bright, airy, minimal, functional. Light oak floors, soft whites, simple furniture, cozy textiles, hygge atmosphere, natural light maximized.', prompt_keywords: ['scandinavian interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-industrial', name: 'Industrial', dna: 'Raw textures, concrete/microcement, blackened steel, dark metals, exposed-look finishes, minimal softness. Cage pendants, metal sconces, utilitarian forms.', prompt_keywords: ['industrial interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-ranch', name: 'Ranch', dna: 'Wide, open, casual American style. Warm woods, neutral colors, simple finishes, practical comfort. Mid-century influences, clean lines, earth tones.', prompt_keywords: ['ranch interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-tudor-revival', name: 'Tudor Revival', dna: 'Old-world English influence. Rich woods, leaded-style window treatments, stone accents, moody warmth. Wrought iron, lantern lighting, darker palette.', prompt_keywords: ['tudor revival interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-french-country', name: 'French Country', dna: 'Soft European charm. Light woods, gentle curves, stone floors, linen textiles, warm and elegant. Aged brass, soft creams, muted blues.', prompt_keywords: ['french country interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-mediterranean', name: 'Mediterranean', dna: 'Sun-washed warmth. Plaster walls, stone or tile floors, warm metals (aged brass/bronze), airy and natural. Terracotta accents, zellige tile.', prompt_keywords: ['mediterranean interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-spanish-colonial', name: 'Spanish Colonial', dna: 'Earthy, handcrafted, historic. Terracotta/Saltillo tile, plaster walls, wrought iron lighting, warm woods, patterned tile accents.', prompt_keywords: ['spanish colonial interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-tuscan-villa', name: 'Tuscan Villa', dna: 'Italian countryside luxury. Travertine, tumbled stone, plaster walls, rustic woods, iron chandeliers, warm aged finishes.', prompt_keywords: ['tuscan villa interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-japandi', name: 'Japandi', dna: 'Japanese minimalism meets Scandinavian warmth. Calm, clean, light oak, soft textures, zero clutter, matte neutrals, low visual noise.', prompt_keywords: ['japandi interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-prairie', name: 'Prairie Style', dna: 'Frank Lloyd Wright inspired. Horizontal emphasis, warm woods, built-in feel, earthy modernism, linear lighting, arts-and-crafts influence.', prompt_keywords: ['prairie style interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-victorian', name: 'Victorian', dna: 'Decorative, layered, rich. Patterned wallpaper (tasteful), ornate trim profiles, classic furniture, historical elegance, brass accents.', prompt_keywords: ['victorian interior'], tier: SubscriptionTier.ENTERPRISE, mode: 'INTERIOR' },
  { id: 'int-georgian', name: 'Georgian', dna: 'Formal English architecture. Symmetry, classic paneling/wainscoting, elegant trim, refined proportions, traditional chandeliers and sconces.', prompt_keywords: ['georgian interior'], tier: SubscriptionTier.ENTERPRISE, mode: 'INTERIOR' },
  { id: 'int-modern-english', name: 'Modern English', dna: 'Traditional English details with modern restraint. Cleaner lines, subtle thin panel molding, tailored finishes, elegant lantern lighting, softer neutrals.', prompt_keywords: ['modern english interior'], tier: SubscriptionTier.ENTERPRISE, mode: 'INTERIOR' },
  { id: 'int-brutalist', name: 'Brutalist', dna: 'Bold, heavy, architectural. Concrete/microcement, strong geometry, minimal decoration, monolithic forms, sculptural lighting, matte finishes.', prompt_keywords: ['brutalist interior'], tier: SubscriptionTier.ENTERPRISE, mode: 'INTERIOR' },
  { id: 'int-organic', name: 'Organic', dna: 'Soft, natural, flowing. Earth tones, plaster walls, curved furniture, nature-inspired calm, warm woods, natural textiles.', prompt_keywords: ['organic interior'], tier: SubscriptionTier.ENTERPRISE, mode: 'INTERIOR' },
  { id: 'int-desert-modern', name: 'Desert Modern', dna: 'Warm minimalism inspired by desert. Clay/sand tones, microcement/plaster, clean lines, sculptural lighting, minimal decor, sun-baked warmth.', prompt_keywords: ['desert modern interior'], tier: SubscriptionTier.ENTERPRISE, mode: 'INTERIOR' },
  { id: 'int-aframe', name: 'A-Frame', dna: 'Modern cabin feel. Wood everywhere, cozy textures, tall vertical spaces emphasized in decor, simple furniture, lodge-like warmth.', prompt_keywords: ['a-frame interior'], tier: SubscriptionTier.ENTERPRISE, mode: 'INTERIOR' },
  { id: 'int-postmodern', name: 'Post-Modern', dna: 'Playful geometry and artistic flair. Curves, bold accents in controlled doses, creative statement lighting, clean neutral base.', prompt_keywords: ['post-modern interior'], tier: SubscriptionTier.ENTERPRISE, mode: 'INTERIOR' },
  { id: 'int-artdeco', name: 'Art Deco', dna: 'Glamour and geometry. Brass, marble looks, black and white contrast, fluted/reeded cabinet details, dramatic chandeliers, jewel tone accents.', prompt_keywords: ['art deco interior'], tier: SubscriptionTier.ENTERPRISE, mode: 'INTERIOR' },
  { id: 'int-mountain-lodge', name: 'Mountain Lodge', dna: 'Luxury cabin. Stone textures, wood beams (if exist), leather, wool textiles, cozy but upscale, warm layered lighting.', prompt_keywords: ['mountain lodge interior'], tier: SubscriptionTier.ENTERPRISE, mode: 'INTERIOR' },
  { id: 'int-luxury-log', name: 'Luxury Log', dna: 'Refined log-home style. Heavy timber feel, stone textures, warm lighting, rustic but polished, high-end lodge aesthetic.', prompt_keywords: ['luxury log interior'], tier: SubscriptionTier.ENTERPRISE, mode: 'INTERIOR' },
  { id: 'int-coastal-contemporary', name: 'Coastal Contemporary', dna: 'Coastal feel with modern lines. Light oak, airy palette, minimal clutter, refined beach house, clean furniture, soft blues and whites.', prompt_keywords: ['coastal contemporary interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-farmhouse', name: 'Farmhouse', dna: 'Classic rural warmth. Shiplap/beadboard accents, wood floors, simple Shaker cabinetry, vintage charm, warm whites, black accents.', prompt_keywords: ['farmhouse interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-traditional', name: 'Traditional', dna: 'Timeless and balanced. Panel molding, layered textiles, classic furniture, neutral palette, marble accents, brass or nickel finishes.', prompt_keywords: ['traditional interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-coastal', name: 'Coastal', dna: 'Relaxed beach home. Whites, sand tones, soft blues, woven textures, rattan accents, breezy natural light, airy and relaxed.', prompt_keywords: ['coastal interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-transitional', name: 'Transitional', dna: 'Blend of traditional and modern. Safe, clean, warm, balanced. Shaker/thin Shaker cabinets, quartz/quartzite, neutral palette, timeless.', prompt_keywords: ['transitional interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-minimalist', name: 'Minimalist', dna: 'Extremely clean. Few objects, hidden storage look, matte finishes, soft neutral or monochrome tones, calm lighting.', prompt_keywords: ['minimalist interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-rustic', name: 'Rustic', dna: 'Natural, rugged. Reclaimed wood, stone textures, cozy heavy textiles, lodge-like comfort, warm earth tones.', prompt_keywords: ['rustic interior'], tier: SubscriptionTier.PRO, mode: 'INTERIOR' },
  { id: 'int-contemporary', name: 'Contemporary', dna: 'Current and refined. Mixed materials, modern statement lighting, clean furniture silhouettes, neutral base with intentional accents.', prompt_keywords: ['contemporary interior'], tier: SubscriptionTier.ENTERPRISE, mode: 'INTERIOR' },
  { id: 'int-luxury', name: 'Luxury', dna: 'High-end hotel feel. Quartzite/marble, layered designer lighting, tailored furniture, cohesive elegance, refined metals, custom millwork look.', prompt_keywords: ['luxury interior'], tier: SubscriptionTier.ENTERPRISE, mode: 'INTERIOR' },
  { id: 'int-pueblo-revival', name: 'Pueblo Revival', dna: 'Southwest adobe style. Rounded plaster textures, earthy warm colors, handmade tile accents, rustic wood, wrought iron, desert warmth.', prompt_keywords: ['pueblo revival interior'], tier: SubscriptionTier.ENTERPRISE, mode: 'INTERIOR' },
  { id: 'int-bristol-transitional', name: 'Bristol Transitional', dna: 'Elevated transitional. Classic lines with modern polish, warm tailored finishes, upscale but not trendy, high-end restraint, refined brass/nickel.', prompt_keywords: ['bristol transitional interior'], tier: SubscriptionTier.ENTERPRISE, mode: 'INTERIOR' },
];

export const MATERIAL_LIBRARY = {
  flooring: [
    { id: 'white-oak', name: 'White Oak' },
    { id: 'walnut', name: 'Walnut' },
    { id: 'herringbone', name: 'Herringbone Oak' },
    { id: 'limestone', name: 'Limestone' },
    { id: 'travertine', name: 'Travertine' },
    { id: 'polished-concrete', name: 'Polished Concrete' },
    { id: 'terracotta', name: 'Terracotta' },
    { id: 'marble', name: 'Marble' },
  ],
  cabinets: [
    { id: 'shaker-white', name: 'Shaker White' },
    { id: 'shaker-gray', name: 'Shaker Gray' },
    { id: 'slab-white', name: 'Slab White' },
    { id: 'stained-oak', name: 'Stained Oak' },
    { id: 'stained-walnut', name: 'Stained Walnut' },
    { id: 'inset', name: 'Inset' },
    { id: 'beaded-inset', name: 'Beaded Inset' },
    { id: 'raised-panel', name: 'Raised Panel' },
  ],
  countertops: [
    { id: 'quartzite', name: 'Quartzite' },
    { id: 'quartz-white', name: 'White Quartz' },
    { id: 'marble', name: 'Marble' },
    { id: 'granite', name: 'Honed Granite' },
    { id: 'soapstone', name: 'Soapstone' },
    { id: 'concrete', name: 'Concrete' },
    { id: 'butcher-block', name: 'Butcher Block' },
  ],
  backsplash: [
    { id: 'subway', name: 'Subway Tile' },
    { id: 'zellige', name: 'Zellige' },
    { id: 'slab', name: 'Slab Stone' },
    { id: 'mosaic', name: 'Mosaic' },
    { id: 'herringbone-tile', name: 'Herringbone Tile' },
    { id: 'shiplap', name: 'Shiplap' },
  ],
};
