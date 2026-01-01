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

  // Normalize roomType safely
  const roomTypeStr = typeof roomType === "string" ? roomType : (RoomType as any)[roomType] ?? String(roomType);
  const roomTypeKey = roomTypeStr.toLowerCase();

  // ============================================================
  // STEP 1: STRUCTURE AUDIT - Analyze image geometry first
  // ============================================================
  const auditPrompt = `Analyze this interior image and return ONLY a JSON object with this exact schema. No other text, no code fences.
{
  "windows": { "count": 0, "byWall": {"left":0,"right":0,"back":0,"front":0}, "notes":"" },
  "doors": { "count": 0, "positions": [] },
  "skylights": { "count": 0 },
  "sink": { "present": false, "count": 0, "position": "" },
  "faucets": { "count": 0 },
  "washerDryer": { "present": false, "position": "" },
  "range": { "present": false },
  "island": { "present": false },
  "fireplace": { "present": false },
  "builtInBench": { "present": false },
  "cameraAngle": "straight"
}
Fill in actual values from the image. Return ONLY valid JSON.`;

  let structureAudit = "{}";
  try {
    const auditResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: { parts: [
        { inlineData: { mimeType: oMime, data: oData } },
        { text: auditPrompt }
      ]},
    });
    const auditText = auditResponse.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const raw = auditText.replace(/```json|```/g, "").trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { JSON.parse(jsonMatch[0]); structureAudit = jsonMatch[0]; }
      catch { structureAudit = "{}"; }
    }
    console.log("[STRUCTURE AUDIT]", structureAudit);
  } catch (e) {
    console.error("[STRUCTURE AUDIT FAILED]", e);
  }

  // ============================================================
  // STEP 2: BUILD RENDER PROMPT WITH AUDIT BINDING
  // ============================================================
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

  // Room-specific hard rules
  let roomSpecificRules = '';
  if (roomTypeKey.includes("kitchen")) {
    roomSpecificRules = `
=== KITCHEN HARD RULES ===
- Do NOT add a second sink or move the existing sink.
- Do NOT add or move the range/cooktop.
- Do NOT add an island if none exists.
- Do NOT add a window above the sink if none exists.
- Keep all appliances in their exact positions.`;
  } else if (roomTypeKey.includes("laundry")) {
    roomSpecificRules = `
=== LAUNDRY ROOM HARD RULES ===
- Do NOT add a mudroom bench, window seat, bay nook, or banquette.
- Do NOT add additional windows beyond what exists.
- Do NOT add a second sink or move sink location.
- Do NOT add a pantry door or extra doorway.
- Keep washer/dryer exactly in-place if present.
- This room does NOT need beautification with extra features - keep it functional.`;
  } else if (roomTypeKey.includes("bath")) {
    roomSpecificRules = `
=== BATHROOM HARD RULES ===
- Do NOT add a window if none exists.
- Do NOT add a second vanity or sink.
- Do NOT move the toilet, tub, or shower.
- Do NOT add a freestanding tub if none exists.
- Keep all plumbing fixtures in exact positions.`;
  }

  const prompt = `
######################################################################
#           STRUCTURE INVENTORY - YOU MUST MATCH THIS EXACTLY        #
######################################################################

The following structure was detected in the input image:
${structureAudit}

YOUR OUTPUT MUST HAVE:
- The EXACT same number of windows in the EXACT same positions
- The EXACT same number of doors in the EXACT same positions  
- The EXACT same number of sinks/faucets in the EXACT same positions
- All appliances in their EXACT original positions
- NO new openings, benches, nooks, or bays

If your output does not match this inventory, it is INVALID.

######################################################################
#                    IMAGE GEOMETRY BINDING                          #
######################################################################

The input image is ground-truth geometry.
You are NOT allowed to redesign, reinterpret, or improve the room layout.
You are performing an in-place finish and material upgrade on the exact photographed room.
Every wall plane, window, opening, cabinet run, alcove, and ceiling plane must remain in exactly the same position and shape as shown in the photo.

This is a TEXTURE/MATERIAL SWAP, not a redesign.
Think of it as re-skinning a 3D model - geometry stays locked, only surfaces change.

${roomSpecificRules}

=== ZERO TOLERANCE VIOLATIONS ===
- Adding a window = FAILURE
- Adding a door = FAILURE
- Adding a skylight = FAILURE
- Adding a bench/nook/bay = FAILURE
- Moving any sink = FAILURE
- Moving any appliance = FAILURE
- Changing room shape = FAILURE

If you cannot follow these constraints perfectly, do NOT invent anything. 
Output the same room with minimal finish changes only.

=== STYLE APPLICATION (SURFACES ONLY) ===
Style: ${style.name}
DNA: ${style.dna}

ROOM TYPE: ${roomTypeStr}
${materialInstructions}
${colorInstructions}

=== WHAT YOU MAY CHANGE ===
- Wall paint/color/texture (not wall positions)
- Flooring material (not room shape)
- Cabinet door style and color (not cabinet positions)
- Countertop material (not counter layout)
- Hardware and fixture finishes (not fixture locations)
- Decor, furniture, rugs, window treatments
- Lighting fixture style (not positions or count)

=== CAMERA ===
- LIGHTING: ${activeLight}
- Maintain EXACT same camera angle and perspective as input
- No dramatic angles or artistic reframing

=== CUSTOM INSTRUCTIONS ===
${customInstruction || "Apply style through finishes only. Do not modify room structure."}

=== OUTPUT REQUIREMENT ===
Generate a photorealistic finish upgrade that could be achieved WITHOUT construction changes.
The room geometry must be IDENTICAL to the input photo.
`;

  parts.push({ text: prompt });

  // ============================================================
  // STEP 3: SELF-CHECK + ONE RETRY SYSTEM
  // ============================================================
  const extractBase64 = (dataUrl: string) => {
    const m = dataUrl.match(/^data:(.*);base64,(.*)$/);
    if (!m) throw new Error("BAD_DATA_URL");
    return { mimeType: m[1], data: m[2] };
  };

  const auditOutputImage = async (mimeType: string, data: string) => {
    try {
      const res = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: { parts: [
          { inlineData: { mimeType, data } },
          { text: auditPrompt }
        ]},
      });
      const t = res.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const raw = t.replace(/```json|```/g, "").trim();
      const jm = raw.match(/\{[\s\S]*\}/);
      if (!jm) return null;
      try { return JSON.parse(jm[0]); } catch { return null; }
    } catch { return null; }
  };

  const auditsMatch = (a: any, b: any) => {
    if (!a || !b) return true; // fail open if audit fails
    return (
      (a.windows?.count ?? 0) === (b.windows?.count ?? 0) &&
      (a.doors?.count ?? 0) === (b.doors?.count ?? 0) &&
      (a.skylights?.count ?? 0) === (b.skylights?.count ?? 0) &&
      (a.sink?.count ?? 0) === (b.sink?.count ?? 0) &&
      (a.faucets?.count ?? 0) === (b.faucets?.count ?? 0) &&
      (!!a.washerDryer?.present) === (!!b.washerDryer?.present) &&
      (!!a.builtInBench?.present) === (!!b.builtInBench?.present)
    );
  };

  const runGen = async (extraFixNote = "") => {
    const promptWithFix = extraFixNote ? `${prompt}\n\n=== FIX MISMATCH (MANDATORY) ===\n${extraFixNote}\n` : prompt;
    const genParts = [...parts.filter((x: any) => !x.text), { text: promptWithFix }];

    const resp = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: { parts: genParts },
      config: { responseModalities: ["image", "text"], imageSafety: "block_none" }
    });

    for (const part of resp.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("EMPTY_ENGINE_RESPONSE");
  };

  // First generation attempt
  const out1 = await runGen();
  
  // Audit the output
  const { mimeType: m1, data: d1 } = extractBase64(out1);
  const auditAObj = (() => { try { return JSON.parse(structureAudit); } catch { return null; } })();
  const auditBObj = await auditOutputImage(m1, d1);

  console.log("[AUDIT COMPARISON]", { input: auditAObj, output: auditBObj });

  // If mismatch, retry once with fix instruction
  if (!auditsMatch(auditAObj, auditBObj)) {
    console.warn("[AUDIT MISMATCH] Retrying with fix instruction...");
    const fixNote = `Your previous output FAILED structure compliance.
You MUST match this inventory exactly: ${structureAudit}
Specifically:
- Windows: input has ${auditAObj?.windows?.count ?? 0}, you MUST have exactly ${auditAObj?.windows?.count ?? 0}
- Doors: input has ${auditAObj?.doors?.count ?? 0}, you MUST have exactly ${auditAObj?.doors?.count ?? 0}
- Sinks: input has ${auditAObj?.sink?.count ?? 0}, you MUST have exactly ${auditAObj?.sink?.count ?? 0}
DO NOT add or remove any openings or fixtures.`;
    const out2 = await runGen(fixNote);
    return out2;
  }

  return out1;
};

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
