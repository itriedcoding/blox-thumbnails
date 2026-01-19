import { GoogleGenAI } from "@google/genai";
import { ThumbnailConfig, ThumbnailStyle } from "../types";

export const getStoredKey = (): string | undefined => {
  return process.env.API_KEY;
};

const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please select a key via the AI Studio interface.");
  }
  return new GoogleGenAI({ apiKey });
};

// Advanced exponential backoff for Free Tier quota management
const retryWithBackoff = async <T>(
  operation: () => Promise<T>, 
  maxRetries = 5, 
  initialDelay = 2000
): Promise<T> => {
  let delay = initialDelay;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('503')) {
        if (i === maxRetries - 1) throw error;
        console.warn(`[System] Quota limit hit. Cooling down for ${delay/1000}s... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries exceeded.");
};

const getStylePrompt = (style: ThumbnailStyle): string => {
  // HYPER-REALISM OVERHAUL
  // We strictly enforce PBR textures, Raytracing, and avoiding the "plastic" look.
  const styles: Record<ThumbnailStyle, string> = {
    cinematic: "PHOTOREALISTIC CINEMATIC. Unreal Engine 5 level detail. 8K resolution. Raytraced reflections. Volumetric fog. Depth of field (bokeh). The characters must look like high-budget movie assets, not toys. Skin has subsurface scattering. Clothing has realistic fabric textures and folds.",
    simulator: "HIGH-FIDELITY VIBRANCE. Pixar-level rendering. Soft, global illumination. No sharp polygon edges. Everything is smooth and rounded. Textures are high resolution (4K). Bright, cheerful, but physically accurate lighting. Grass and environment must look lush and detailed, not flat.",
    obby: "EXTREME DYNAMICS. Motion blur on edges. High contrast neon lighting against dark backgrounds. The character is performing a dynamic parkour move with realistic anatomy bending (no rigid block joints). Glowing textures with bloom. Reflections on surfaces.",
    horror: "HYPER-REALISTIC HORROR. PBR materials: Rust, dirt, grime, blood, wet surfaces. Cinematic low-key lighting. The character looks genuinely terrified with detailed facial expressions. Volumetric smoke. Film grain. Chromatic aberration. Looks like a Resident Evil cutscene starring a stylized avatar.",
    rpg: "FANTASY EPIC. Particle effects are volumetric and glowing. Armor looks like real metal with scratches and reflections. Magic effects cast real dynamic light on the environment. Atmospheric perspective. Majestic scale.",
    anime: "HIGH-BUDGET ANIME 3D. Like a Arc System Works game (Guilty Gear Strive style). Cell-shaded but with dynamic lighting and rim lights. intense action lines. Glowing auras. The character model is stylized but high-poly, not blocky.",
    "high-ctr": "VIRAL THUMBNAIL AESTHETIC. Maximum texture clarity. Exaggerated but high-quality lighting (Rim lights + Key light). The character pops out from the background. hyper-detailed facial expression. 3D rendered emojis/arrows with glossy textures."
  };
  return styles[style] || styles.cinematic;
};

export const enhancePrompt = async (originalPrompt: string): Promise<string> => {
  return retryWithBackoff(async () => {
    try {
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a Lead 3D Artist at a top game studio.
        Rewrite the following prompt to describe a PHOTOREALISTIC 3D RENDER.
        The goal is to banish the "lego/toy" look.
        Focus on: Lighting, Texture Quality, Camera Angle, and Atmosphere.
        
        Input: "${originalPrompt}"
        
        Output (keep it purely descriptive, no conversational filler):`,
      });
      return response.text?.trim() || originalPrompt;
    } catch (e) {
      console.error("Prompt enhancement failed", e);
      return originalPrompt;
    }
  });
};

export const generateThumbnail = async (config: ThumbnailConfig): Promise<string> => {
  return retryWithBackoff(async () => {
    const ai = getAIInstance();
    
    const styleKeywords = getStylePrompt(config.style);
    
    // Always prioritize the best visual model for 3D generation
    const modelName = config.model === 'pro' 
      ? 'gemini-3-pro-image-preview' 
      : 'gemini-2.5-flash-image';

    // REPLACED: Old "Blocky" instructions with "High-End GFX" instructions
    // We want to force the model to interpret Roblox avatars as high-quality 3D characters
    const characterModelInstruction = `
      [CHARACTER RENDER RULES]
      - STYLE: PROFESSIONAL ROBLOX GFX (Blender Cycles / Octane Render).
      - ANATOMY: Use "BENT LIMBS" style. Joints must be smooth and curved, NOT rigid or sharp. 
      - PHYSICS: Clothing must have realistic wrinkles, folds, and texture. It should look like fabric, not a texture sticker.
      - MATERIAL: Skin should look soft (Subsurface Scattering), Armor should look like metal, Hair should have strands.
      - DO NOT RENDER: Studs on top of heads, sharp blocky corners, flat plastic textures.
      - EXPRESSION: High-quality 3D face, full of emotion.
    `;

    const finalPrompt = `
      [TASK: GENERATE HYPER-REALISTIC 3D ART]
      Create a stunning 8K resolution 3D render.
      The subject is a stylized character (Roblox-based) but rendered with PHOTOREALISM.

      [SCENE DESCRIPTION]
      ${config.prompt}

      [VISUAL STYLE: ${config.style.toUpperCase()}]
      ${styleKeywords}
      
      ${characterModelInstruction}

      [TECHNICAL SPECIFICATIONS]
      - Renderer: Unreal Engine 5 / Blender Cycles
      - Lighting: HDRI, Raytracing, Global Illumination, Ambient Occlusion
      - Camera: Cinematic composition, depth of field, bokeh
      - Texture Quality: 8K, PBR (Physically Based Rendering)
      
      [NEGATIVE PROMPT (THINGS TO AVOID)]
      - ${config.negativePrompt || ""}
      - plastic toy look, lego studs, sharp polygon edges, low poly, pixelated
      - flat lighting, simple textures, cartoon outlines (unless anime style)
      - distorted faces, extra limbs, bad anatomy, floating parts
      - blurry, low resolution, jpeg artifacts
    `;

    const parts: any[] = [];

    if (config.referenceImage) {
      const matches = config.referenceImage.match(/^data:(.+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2],
          },
        });
        
        const imageInstruction = `
          [REFERENCE IMAGE INSTRUCTION]
          The attached image is the character reference.
          Keep the character's identity (hair, colors, outfit) BUT UPGRADE THE GRAPHICS.
          Render this character as a HIGH-BUDGET 3D MODEL.
          Fix any low-poly edges from the reference. Make the clothing look real. Make the lighting cinematic.
          Do NOT just copy the low-quality screenshot. RE-IMAGINE it in 8K.
        `;
          
        parts.push({
          text: `${imageInstruction}\n\n${finalPrompt}`
        });
      } else {
          parts.push({ text: finalPrompt });
      }
    } else {
      parts.push({
        text: finalPrompt,
      });
    }

    const generationConfig: any = {
      imageConfig: {
        aspectRatio: config.aspectRatio,
      },
    };

    if (config.seed) {
      (generationConfig as any).seed = config.seed; 
    }

    const tools: any[] = [];
    if (config.model === 'pro') {
      tools.push({ googleSearch: {} }); 
      generationConfig.imageConfig.imageSize = "2K"; 
    }

    try {
      console.log(`Generating with ${modelName} | Mode: Hyper-Realistic GFX`);

      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: parts,
        },
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

      throw new Error("No image data found.");

    } catch (error: any) {
      console.error("Gemini Generation Error:", error);
      let msg = error.message;
      if (msg?.includes("403") || msg?.includes("PERMISSION_DENIED")) {
          msg = "Access Denied: The API Key is invalid or lacks permission. Please check your billing status.";
      }
      if (msg?.includes("API Key is missing")) {
          msg = "System Authorization Missing. Please select a valid key.";
      }
      if (msg?.includes("429") || msg?.includes("RESOURCE_EXHAUSTED")) {
          msg = "Traffic Overload: The system is under heavy load. The auto-retry system is engaging...";
      }
      throw new Error(msg);
    }
  });
};