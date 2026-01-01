import { getNextApiKey } from './apiKeyRotation';
import { GoogleGenAI } from "@google/genai";
import {
  LightingMode,
  EnvironmentMode,
  CameraAngle,
  RoomType,
  RenderMode,
  SavedColor
} from "../types";
import type {
  DesignStyle,
  Project,
  AspectRatio
} from "../types";

const getAIClient = () => {
  const key = (process.env as any).API_KEY || import.meta.env.VITE_API_KEY;
  if (!key) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey: key });
};

const parseBase64 = (base64String: string) => {
  if (!base64String) return { mimeType: "image/jpeg", data: "" };
  if (base64String.includes(",")) {
    const parts = base64String.split(",");
    const mimeType = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    return { mimeType, data: parts[1] };
  }
  return { mimeType: "image/jpeg", data: base64String };
};

export const formatGeminiError = (err: any): string => {
  const errorStr = typeof err === "string" ? err : err?.message || JSON.stringify(err);
  if (errorStr.includes("429")) return "Engine at maximum capacity. Retrying...";
  if (errorStr.includes("API_KEY_MISSING")) return "Please select a paid API key to continue.";
  if (errorStr.includes("entity was not found")) return "API Key reset required. Please re-authorize.";
  console.error("Gemini error:", errorStr); return "Generation Error: " + (errorStr.substring(0, 100) || "Please try again.");
};

/**
 * Extract color from uploaded color chip image
 */
export const extractColorFromChip = async (imageBase64: string): Promise<SavedColor> => {
  const ai = getAIClient();
  const { mimeType, data } = parseBase64(imageBase64);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { inlineData: { mimeType, data } },
        { text: `Analyze this color chip/swatch image. Extract the dominant color and return ONLY a JSON object in this exact format, no other text:
{"hex": "#XXXXXX", "r": 0, "g": 0, "b": 0, "name": "Color Name"}
The name should be a descriptive color name like "Warm Cream", "Slate Gray", "Sage Green", etc.` }
      ]
    }
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not extract color");
  
  const colorData = JSON.parse(jsonMatch[0]);
  
  return {
    id: Date.now().toString(),
    name: colorData.name || 'Custom Color',
    hex: colorData.hex,
    rgb: { r: colorData.r, g: colorData.g, b: colorData.b },
    createdAt: Date.now(),
    source: 'chip'
  };
};

/**
 * EXTERIOR Render generation with strict structural preservation
 */
export const generateExteriorVision = async (
  project: Project,
  style: DesignStyle,
  customInstruction?: string,
  isHighQuality: boolean = false,
  aspectRatio: AspectRatio = "16:9",
  customColors?: SavedColor[]
): Promise<string> => {
  const ai = getAIClient();
  const { mimeType: oMime, data: oData } = parseBase64(project.imageUrl);
  const parts: any[] = [{ inlineData: { mimeType: oMime, data: oData } }];

  if (project.referenceImages && project.referenceImages.length > 0) {
    project.referenceImages.slice(0, 10).forEach((img) => {
      const { mimeType: rMime, data: rData } = parseBase64(img);
      parts.push({ inlineData: { mimeType: rMime, data: rData } });
    });
  }

  const activeLight = project.lighting || LightingMode.GOLDEN;
  const activeEnv = project.environment || EnvironmentMode.EXISTING;
  const activeAngle = project.cameraAngle || CameraAngle.FRONT;

  let colorInstructions = '';
  if (customColors && customColors.length > 0) {
    colorInstructions = `\n\nCUSTOM COLORS TO APPLY:\n${customColors.map(c => `- ${c.name}: ${c.hex}`).join('\n')}`;
  }

  const prompt = `
ROLE: Elite Architectural CGI Specialist for luxury custom home builders.

TASK: Transform the provided structure image into a photorealistic architectural visualization.

=== ABSOLUTE STRUCTURAL CONSTRAINTS (NEVER VIOLATE) ===
The following elements are HARD BUILD features and must be preserved EXACTLY as shown in the input:
- Window positions, sizes, and quantities
- Door positions and sizes
- Roof shape, pitch, and ridge lines
- Dormers (position, size, quantity)
- Gables and their positions
- Garage doors (position, size, number of bays)
- Overall building footprint and massing
- Number of stories/floors
- Chimney positions
- Porch/entry positions and proportions
- Structural columns and posts

DO NOT add, remove, or relocate ANY of these hard elements unless the user explicitly requests it.

=== STYLE APPLICATION (EXTERIOR ONLY) ===
Apply the following style DNA to EXTERIOR FINISHES ONLY:
${style.dna}

This means you may change:
- Siding/cladding materials and colors
- Roof material and color (but NOT shape)
- Window trim and frame colors (but NOT positions)
- Door style and color (but NOT position)
- Exterior paint colors
- Stone/brick veneer application
- Shutters, trim, and decorative elements
- Landscaping and hardscape
${colorInstructions}

=== CAMERA & PERSPECTIVE ===
- CRITICAL: Maintain the EXACT same camera angle, position, and perspective as the input photo
- Do NOT change the viewing angle - if the photo is straight-on, render straight-on
- Do NOT add dramatic angles or artistic perspectives
- Match the original photo composition exactly

=== RENDERING SPECIFICATIONS ===
- VIEWPOINT: ${activeAngle}
- ENVIRONMENT: ${activeEnv} setting with realistic context
- LIGHTING: ${activeLight} - THIS IS CRITICAL: Render the scene with ${activeLight} lighting conditions. The sky, shadows, and ambient light must clearly reflect ${activeLight}
- QUALITY: Ultra photorealistic, 8K architectural photography quality
- NO stylized sketches, paper backgrounds, or artistic interpretations

=== CUSTOM INSTRUCTIONS ===
${customInstruction || "Apply style faithfully while preserving all structural elements."}

=== FINAL CHECK ===
Before finalizing, verify:
1. All windows are in their original positions
2. All doors are in their original positions
3. Roof shape matches the input exactly
4. Garage configuration is unchanged
5. Building footprint and massing is identical
6. Only exterior materials/colors have been modified

OUTPUT: Photorealistic architectural visualization ready for client presentation.
`;

  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: isHighQuality ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image",
    contents: { parts },
    config: {
      responseModalities: ["image", "text"],
      imageSafety: "block_none"
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("EMPTY_ENGINE_RESPONSE");
};

/**
 * INTERIOR Render generation
 */
export const generateInteriorVision = async (
  project: Project,
  style: DesignStyle,
  roomType: RoomType,
  customInstruction?: string,
  isHighQuality: boolean = false,
  aspectRatio: AspectRatio = "16:9",
  customColors?: SavedColor[],
  materials?: { flooring?: string; cabinets?: string; countertops?: string; backsplash?: string }
): Promise<string> => {
  const ai = getAIClient();
  const { mimeType: oMime, data: oData } = parseBase64(project.imageUrl);
  const parts: any[] = [{ inlineData: { mimeType: oMime, data: oData } }];

  if (project.referenceImages && project.referenceImages.length > 0) {
    project.referenceImages.slice(0, 5).forEach((img) => {
      const { mimeType: rMime, data: rData } = parseBase64(img);
      parts.push({ inlineData: { mimeType: rMime, data: rData } });
    });
  }

  const activeLight = project.lighting || LightingMode.GOLDEN;

  let colorInstructions = '';
  if (customColors && customColors.length > 0) {
    colorInstructions = `\n\nCUSTOM COLORS TO APPLY:\n${customColors.map(c => `- ${c.name}: ${c.hex}`).join('\n')}`;
  }

  let materialInstructions = '';
  if (materials) {
    materialInstructions = '\n\nMATERIALS TO USE:';
    if (materials.flooring) materialInstructions += `\n- Flooring: ${materials.flooring}`;
    if (materials.cabinets) materialInstructions += `\n- Cabinets: ${materials.cabinets}`;
    if (materials.countertops) materialInstructions += `\n- Countertops: ${materials.countertops}`;
    if (materials.backsplash) materialInstructions += `\n- Backsplash: ${materials.backsplash}`;
  }

  const prompt = `
######################################################################
#                    CRITICAL: READ THIS FIRST                       #
######################################################################

=== IMAGE GEOMETRY BINDING ===
The input image is ground-truth geometry.
You are NOT allowed to redesign, reinterpret, or improve the room layout.
You are performing an in-place finish and material upgrade on the exact photographed room.
Every wall plane, window, opening, cabinet run, alcove, and ceiling plane must remain in exactly the same position and shape as shown in the photo.
No new spatial volumes may be created.
No walls may be recessed, extended, or reshaped.
If you generate any opening, window, bench nook, bay, or wall recess that is not visible in the input photo, the output is INVALID.

=== ZERO TOLERANCE VIOLATIONS ===
The following will cause IMMEDIATE FAILURE:
- Adding a window where there is no window
- Adding a door where there is no door  
- Adding a skylight where there is no skylight
- Creating a bench/nook/bay that doesn't exist
- Moving the sink to a different wall
- Moving appliances to different locations
- Adding extra sinks or faucets
- Changing the room's footprint or shape
- Changing the camera angle or perspective

=== WHAT THIS TOOL DOES ===
This is a MATERIAL/FINISH SWAP tool, NOT a room redesign tool.
Think of it like re-skinning a 3D model - the geometry stays locked, only the textures change.

######################################################################

ROLE: Elite interior design CGI specialist for luxury custom homes.
GOAL: Apply the selected interior design STYLE while preserving the existing room's STRUCTURE with zero hallucinations.

CORE PRINCIPLE: CLAD INTERIOR is a "FINISH + STYLING" engine, NOT a remodel engine. Structural fidelity is ALWAYS more important than style fidelity.

=== IMAGE BINDING MODE ===
The input photo is ground-truth geometry.
You are NOT allowed to reinterpret, rebuild, or redesign the room.
You are performing an in-place material and finish upgrade on the exact photographed room.
Every wall, opening, cabinet run, and ceiling plane in the input image must remain exactly where it is.
- If you generate any opening (window, door, skylight, cutout, niche) that is not present in the input photo, the output is INVALID.

=== NON-NEGOTIABLE STRUCTURE LOCK (NEVER VIOLATE) ===
These are HARD BUILD features. Preserve EXACTLY as shown in the input image:

ROOM GEOMETRY:
- Room boundaries, dimensions, and layout (no layout edits)
- Wall positions and room shape (no moving walls)
- Ceiling height and ceiling form (flat, vaulted, tray, coffered) exactly as shown
- Soffits, bulkheads, structural posts, columns exactly as shown
- Stair openings, landings, railing positions if visible
- Built-in niches/openings, arches, alcoves EXACTLY as shown (do not add new ones)

OPENINGS (ABSOLUTE):
- Doorways: count, size, position, casing location (do not add/remove/move)
- Windows: count, size, position, muntin pattern/grid, sill height (do not add/remove/move)
- Skylights: count, size, position (do not add/remove/move)
- Pass-throughs / cutouts: preserve exactly (do not add/remove/move)

FIXTURES + ROUGH-IN (ABSOLUTE):
- Fireplaces: ONLY if already present. Do not add a fireplace to a room without one.
- Plumbing fixtures: sinks, tubs, showers, toilets, faucets, drains: preserve count and exact location. Do not add new plumbing.
- Electrical/lighting rough-in: if visible (recessed can layout, pendant locations, fan), preserve count and placement. Do not add lights.

KITCHEN RULES (IF KITCHEN IS PRESENT):
- Do not move or add: sink, range, hood, fridge, dishwasher.
- Do not add an island/peninsula unless one already exists OR user explicitly requests it AND specifies placement.
- Do not change cabinet footprint or counter footprint (no changing the layout, only door style and finishes).

BATHROOM RULES (IF BATHROOM IS PRESENT):
- Do not move or add: vanity, sinks, toilet, tub, shower.
- Do not change wet-wall locations.
- Tile/stone/fixture finishes can change, but fixture COUNT and LOCATION cannot.

=== ABSOLUTE "NO OPENINGS" RULE ===
- DO NOT add ANY opening of any kind: no new windows, doors, skylights, arches, pass-throughs, niches, cutouts, or extra rooms. Ever.
- Adding ANY new opening (window/door/skylight/arch/cutout) is an AUTOMATIC FAILURE.
- If the selected style normally includes an architectural feature (arches, beams, fireplace, coffered ceiling, skylight), apply it ONLY if it already exists in the input. If it does not exist, express the style using finishes + lighting style + furniture + decor only.

=== ALLOWED ADDITIONS (ONLY WITH EXPLICIT USER PLACEMENT) ===
- The model may add a NEW fixture/appliance/built-in ONLY if the user explicitly requests it AND specifies placement/location.
- Otherwise: if it isn't visible, do NOT add it.

=== STYLE APPLICATION (FINISHES ONLY) ===
Apply this interior style DNA:
${style.dna}

ROOM TYPE: ${roomType}
${materialInstructions}
${colorInstructions}

=== SAFE CHANGES (STYLE CONTROLS THESE ONLY) ===
You MAY change ONLY these categories while preserving structure:
- Wall finish: paint color, paint sheen, wallpaper, plaster/limewash texture
- Non-structural trim: panel molding, wainscoting, baseboards/casing/crown style (do not change openings)
- Flooring materials and finish
- Cabinet door style + cabinet color + hardware finish (WITHOUT changing cabinet layout/positions)
- Countertops + backsplash materials (WITHOUT changing counter shape/layout)
- Fixtures style/finish only (faucets, cabinet pulls, shower trim) WITHOUT adding fixtures
- Lighting fixture STYLE only (do not add new lights; do not move fixture positions)
- Furniture, decor, rugs, bedding, artwork, mirrors (decor only), plants
- Window treatments: drapery, roman shades, woven shades, blinds (do not change window size/placement)

=== CAMERA & OUTPUT ===
- LIGHTING: ${activeLight}
- Maintain the EXACT same camera angle, position, perspective, and composition as input.
- Do not add dramatic angles or artistic perspectives.
- Output must be photorealistic "interior design magazine quality."
- Must look like a designer upgraded finishes and styling, not like the room was rebuilt.

=== CUSTOM INSTRUCTIONS ===
${customInstruction || "Apply style faithfully while preserving room structure."}

=== FINAL CHECKLIST (MUST PASS BEFORE OUTPUT) ===
Verify:
- Same number of windows/doors/skylights/openings as input
- No new fixtures or appliances added (unless user explicitly requested with placement)
- No relocated major elements (vanity/toilet/tub/sink/range/island/hood/fridge/faucets)
- Same camera angle and composition
- Style is obvious through finishes + lighting style + furnishings only

OUTPUT: Photorealistic interior visualization ready for client presentation.
`;

  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: isHighQuality ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image",
    contents: { parts },
    config: {
      responseModalities: ["image", "text"],
      imageSafety: "block_none"
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("EMPTY_ENGINE_RESPONSE");
};

/**
 * Main render function that routes to exterior or interior
 */
export const generateDesignVision = async (
  project: Project,
  style: DesignStyle,
  customInstruction?: string,
  isHighQuality: boolean = false,
  aspectRatio: AspectRatio = "16:9"
): Promise<string> => {
  const mode = project.renderMode || 'EXTERIOR';
  
  if (mode === 'INTERIOR' && project.roomType) {
    return generateInteriorVision(
      project,
      style,
      project.roomType,
      customInstruction,
      isHighQuality,
      aspectRatio,
      project.savedColors
    );
  }
  
  return generateExteriorVision(
    project,
    style,
    customInstruction,
    isHighQuality,
    aspectRatio,
    project.savedColors
  );
};

/**
 * Cinematic video generation
 */
export const generateCinematicVideo = async (
  imageBase64: string,
  prompt: string,
  aspectRatio: AspectRatio = "16:9"
): Promise<string> => {
  // Use Vertex AI serverless function for production-grade VEO 3.1 Fast
  const response = await fetch('/api/veo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64,
      prompt,
      aspectRatio
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'VIDEO_GENERATION_FAILED');
  }

  return data.video;
};
