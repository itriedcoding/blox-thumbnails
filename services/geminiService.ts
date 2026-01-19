import { GoogleGenAI } from "@google/genai";
import { ThumbnailConfig, ThumbnailStyle, ModelType } from "../types";

// ==========================================
// 🚀 GEMINI SERVICE (STANDARD)
// ==========================================

const getRawApiKey = (): string | undefined => {
  return (import.meta as any).env?.VITE_API_KEY || 
              (import.meta as any).env?.API_KEY ||
              process.env.VITE_API_KEY ||
              process.env.API_KEY ||
              process.env.NEXT_PUBLIC_API_KEY;
}

const getApiKey = (): string => {
  const key = getRawApiKey();

  if (!key) {
    throw new Error("MISSING_API_KEY: Please add VITE_API_KEY to your .env file.");
  }
  return key;
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const getActiveNodeCount = (): number => {
    return getRawApiKey() ? 1 : 0;
};

// ==========================================
// GENERATION LOGIC
// ==========================================

const getStylePrompt = (style: ThumbnailStyle): string => {
  const styles: Record<ThumbnailStyle, string> = {
    cinematic: "PHOTOREALISTIC CINEMATIC. Unreal Engine 5. Nanite geometry. Lumen lighting. 8K textures. Depth of Field. Color Graded. IMAX Quality.",
    simulator: "HIGH-FIDELITY VIBRANCE. Pixar-style rendering. Smooth shading. Ambient Occlusion. Bright, saturated colors. Soft shadows. Commercial Polish.",
    obby: "NEON PARKOUR. High contrast. Emission shaders. Motion blur. Dynamic perspective. Glowing edges. Retrowave aesthetic.",
    horror: "REALISTIC HORROR. PBR materials (wet, dirt, grunge). Volumetric fog. Low-key lighting. Film grain. Chromatic aberration. Unsettling atmosphere.",
    rpg: "FANTASY EPIC. Particle effects. Magic glows. Metallic reflections. Atmospheric perspective. God rays. Detailed armor textures.",
    anime: "GUILTY GEAR STRIVE STYLE. Cel-shaded 3D. Dynamic rim lighting. Action lines. Vibrant effects. 2.5D Composition.",
    "high-ctr": "YOUTUBE VIRAL. Hyper-saturated. Exaggerated expressions. High contrast. Glossy textures. 3D Emojis. Clickbait Composition."
  };
  return styles[style] || styles.cinematic;
};

export const enhancePrompt = async (originalPrompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a World-Class Creative Director for Roblox Game Art.
      
      Your task is to take a basic user idea and transform it into a PRODUCTION-READY 3D RENDER PROMPT.
      
      Input: "${originalPrompt}"
      
      Instructions:
      1. EXPAND on the scene. Add environmental details (weather, time of day, background objects).
      2. DEFINE the lighting specifically (e.g., "volumetric morning sun", "neon cyberpunk rim lights", "dramatic three-point lighting").
      3. DEFINE the camera (e.g., "low angle hero shot", "dynamic wide angle fisheye", "close-up macro").
      4. ADD texture keywords (e.g., "4k pbr", "raytraced reflections", "subsurface scattering on skin").
      5. KEEP the core subject intact but make it sound epic.
      
      Output ONLY the final enhanced prompt string. Do not add intro/outro text.`,
    });
    return response.text?.trim() || originalPrompt;
  } catch (e) {
    console.warn("Enhancement failed:", e);
    return originalPrompt;
  }
};

export const generateThumbnail = async (config: ThumbnailConfig): Promise<string> => {
  // Select Model
  const modelName = config.model === 'pro' 
    ? 'gemini-3-pro-image-preview' 
    : 'gemini-2.5-flash-image';    

  const finalPrompt = `
    [TASK]
    Render a Hyper-Realistic 3D Roblox Game Thumbnail (8K Resolution).
    
    [SCENE DESCRIPTION]
    ${config.prompt}
    
    [CHARACTER POSE & ACTION]
    ${config.pose ? `The main character is performing: ${config.pose}` : "Dynamic composition matching the scene context"}
    
    [ART STYLE: ${config.style.toUpperCase()}]
    ${getStylePrompt(config.style)}
    
    [TECHNICAL SPECIFICATIONS]
    - Engine: Unreal Engine 5 / Blender Cycles
    - Global Illumination: Raytraced
    - Avatar Fidelity: ${config.avatarModel === 'Rthro' ? 'Realistic Rthro (Human proportions)' : 'High-Poly R15 (Rounded bevels, no sharp edges)'}
    - Materials: PBR (Physically Based Rendering)
    - Post-Processing: Color graded, bloom, sharp details.
    
    [NEGATIVE PROMPT]
    ${config.negativePrompt || ""}
    low quality, jpeg artifacts, watermark, text overlay, ui, hud, pixelated, blurry, low poly, plastic toy look
  `;

  const parts: any[] = [];

  if (config.referenceImage) {
    if (config.referenceImage.startsWith('http')) {
       parts.push({ text: `Reference Image URL: ${config.referenceImage}` });
    } else {
        const matches = config.referenceImage.match(/^data:(.+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2],
            },
          });
          parts.push({ text: "Use this image as the main composition reference." });
        }
    }
  }
  
  parts.push({ text: finalPrompt });

  const generationConfig: any = {
    imageConfig: {
      aspectRatio: config.aspectRatio,
    },
  };

  if (config.seed) (generationConfig as any).seed = config.seed; 

  // Pro Model Capabilities
  const tools: any[] = [];
  if (config.model === 'pro') {
    tools.push({ googleSearch: {} }); 
    generationConfig.imageConfig.imageSize = "2K"; 
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        ...generationConfig,
        tools: tools.length > 0 ? tools : undefined
      },
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("Render complete, but output was empty.");
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    // Simple fallback logic if pro fails
    if (config.model === 'pro' && error.message?.includes('403')) {
        console.warn("Pro model failed, retrying with Flash...");
        return generateThumbnail({...config, model: 'flash'});
    }
    throw new Error(`Generation failed: ${error.message}`);
  }
};