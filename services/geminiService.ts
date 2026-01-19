import { GoogleGenAI } from "@google/genai";
import { ThumbnailConfig, ThumbnailStyle } from "../types";

// KEY ROTATION SYSTEM
// Allows 'Unlimited' scaling by rotating through a pool of keys provided in process.env.API_KEY
// Format: "key1,key2,key3" in the environment variable.
const getKeyPool = (): string[] => {
  const envKeys = process.env.API_KEY;
  if (!envKeys) return [];
  return envKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
};

const getRandomKey = (): string => {
  const keys = getKeyPool();
  if (keys.length === 0) {
    // Fail silently in logs, but throw descriptive error for app
    console.error("System Error: No keys in pool.");
    throw new Error("Neural Engine Offline: System configuration missing.");
  }
  // Random Load Balancing
  return keys[Math.floor(Math.random() * keys.length)];
};

const getAIInstance = (specificKey?: string) => {
  const apiKey = specificKey || getRandomKey();
  return new GoogleGenAI({ apiKey });
};

// Advanced Cluster Retry Logic
// If a key fails (Quota/Limit), we immediately rotate to a fresh key from the pool.
const retryWithCluster = async <T>(
  operation: (ai: GoogleGenAI) => Promise<T>, 
  maxRetries = 3
): Promise<T> => {
  const keys = getKeyPool();
  let lastError: any;

  // If we only have 1 key, fallback to standard backoff
  if (keys.length <= 1) {
      return retryWithBackoff(() => operation(getAIInstance()), 5);
  }

  // Cluster Mode: Try different keys up to maxRetries
  for (let i = 0; i < maxRetries; i++) {
    try {
      const currentKey = getRandomKey();
      const ai = getAIInstance(currentKey);
      return await operation(ai);
    } catch (error: any) {
      lastError = error;
      const msg = error.message || '';
      
      // If it's a critical error that implies the KEY is bad (Quota/Permission), try next key.
      if (msg.includes('429') || msg.includes('403') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('PERMISSION_DENIED')) {
         console.warn(`[Cluster] Node failed. Rerouting to fresh node... (Attempt ${i+1}/${maxRetries})`);
         continue; 
      }
      
      // If it's a processing error (Safety/Invalid Input), throw immediately.
      throw error;
    }
  }
  throw lastError || new Error("Cluster capacity exhausted.");
};

// Fallback for single-key environments
const retryWithBackoff = async <T>(
  operation: () => Promise<T>, 
  maxRetries = 5, 
  initialDelay = 1000
): Promise<T> => {
  let delay = initialDelay;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('503')) {
        if (i === maxRetries - 1) throw error;
        console.warn(`[System] Load balancing... ${delay/1000}s`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5;
      } else {
        throw error;
      }
    }
  }
  throw new Error("System busy.");
};

const getStylePrompt = (style: ThumbnailStyle): string => {
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
  return retryWithCluster(async (ai) => {
    try {
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
  return retryWithCluster(async (ai) => {
    
    const styleKeywords = getStylePrompt(config.style);
    
    // Always prioritize the best visual model for 3D generation
    const modelName = config.model === 'pro' 
      ? 'gemini-3-pro-image-preview' 
      : 'gemini-2.5-flash-image';

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
      // Sanitize Error Messages for End User
      if (msg?.includes("Access Denied") || msg?.includes("API Key")) {
          msg = "Neural Engine Uplink Failed. The system is re-calibrating. Please try again in 5 seconds.";
      } else if (msg?.includes("429") || msg?.includes("RESOURCE_EXHAUSTED")) {
          msg = "High Traffic Volume. The Cluster is auto-scaling. Please retry.";
      }
      throw new Error(msg);
    }
  });
};
