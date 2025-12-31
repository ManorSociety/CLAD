/**
 * Material Spec Sheet Generator
 * Analyzes rendered images and generates material specifications
 */

import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey });
};

export interface MaterialSpec {
  category: string;
  description: string;
  suggestedMatch: string;
  notes: string;
}

export interface SpecSheet {
  styleName: string;
  materials: MaterialSpec[];
  disclaimer: string;
  generatedAt: string;
}

export const generateSpecSheet = async (
  imageBase64: string,
  styleName: string
): Promise<SpecSheet> => {
  const ai = getAIClient();
  
  const prompt = `You are an architectural materials expert. Analyze this rendered home image and identify all visible exterior materials and finishes.

For each material you identify, provide:
1. Category (Siding, Roofing, Windows, Doors, Trim, Stone/Masonry, Garage Door, Gutters, Lighting, Landscaping)
2. Description (what you see - color, style, material type)
3. Suggested Match (a real product that closely matches - brand and product name)
4. Notes (installation considerations or alternatives)

IMPORTANT: 
- Be specific about colors (use names like "Arctic White", "Charcoal Gray", "Bronze")
- Include ALL visible materials
- For suggested matches, use real products from brands like: James Hardie, GAF, Andersen, Pella, Sherwin-Williams, Benjamin Moore, Cultured Stone, Boral, etc.

Respond in this exact JSON format:
{
  "materials": [
    {
      "category": "Siding",
      "description": "White horizontal lap fiber cement siding, approximately 7-inch exposure",
      "suggestedMatch": "James Hardie HardiePlank in Arctic White",
      "notes": "Smooth finish, consider ColorPlus technology for longer paint life"
    }
  ]
}

Only respond with valid JSON, no other text.`;

  const parts: any[] = [];
  
  // Add image
  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  const mimeType = imageBase64.includes('data:') ? imageBase64.split(';')[0].split(':')[1] : 'image/jpeg';
  
  parts.push({
    inlineData: {
      mimeType,
      data: base64Data
    }
  });
  
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts }
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '{"materials":[]}';
  
  // Parse JSON from response
  let materials: MaterialSpec[] = [];
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      materials = parsed.materials || [];
    }
  } catch (e) {
    console.error("Failed to parse spec sheet:", e);
    materials = [{
      category: "Analysis",
      description: "Unable to analyze materials",
      suggestedMatch: "Please try again",
      notes: "Ensure image is clear and well-lit"
    }];
  }

  return {
    styleName,
    materials,
    disclaimer: "* Brand names are suggestions for reference only. Actual products may vary. Always verify specifications with manufacturers and consult with licensed contractors before purchasing.",
    generatedAt: new Date().toISOString()
  };
};

export const generateSpecSheetPDF = (specSheet: SpecSheet, projectName: string): string => {
  // Generate HTML for PDF
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        h1 { font-size: 28px; margin-bottom: 5px; }
        h2 { font-size: 14px; color: #666; font-weight: normal; margin-bottom: 30px; }
        .disclaimer { font-size: 10px; color: #888; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #1a1a1a; color: white; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
        td { padding: 12px; border-bottom: 1px solid #eee; font-size: 12px; }
        tr:hover { background: #f9f9f9; }
        .category { font-weight: bold; color: #d4a574; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; letter-spacing: 8px; }
        .date { font-size: 11px; color: #888; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">CLAD</div>
        <div class="date">Generated: ${new Date().toLocaleDateString()}</div>
      </div>
      <h1>Material Specification Sheet</h1>
      <h2>${projectName} · ${specSheet.styleName} Style</h2>
      <table>
        <tr>
          <th>Category</th>
          <th>Description</th>
          <th>Suggested Match*</th>
          <th>Notes</th>
        </tr>
        ${specSheet.materials.map(m => `
          <tr>
            <td class="category">${m.category}</td>
            <td>${m.description}</td>
            <td>${m.suggestedMatch}</td>
            <td>${m.notes}</td>
          </tr>
        `).join('')}
      </table>
      <p class="disclaimer">${specSheet.disclaimer}</p>
    </body>
    </html>
  `;
  
  return html;
};
