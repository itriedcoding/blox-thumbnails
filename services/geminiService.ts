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
// Effectively allows "Unlimited" usage by waiting out the rate limits
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
      // Check for Rate Limit (429) or Service Unavailable (503)
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('503')) {
        if (i === maxRetries - 1) throw error; // No more retries
        
        console.warn(`[System] Quota limit hit. Cooling down for ${delay/1000}s... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error; // Not a retryable error
      }
    }
  }
  throw new Error("Max retries exceeded.");
};

const getStylePrompt = (style: ThumbnailStyle): string => {
  const styles: Record<ThumbnailStyle, string> = {
    cinematic: "Ultra-realistic 8k render, Blender Cycles engine, raytracing, cinematic depth of field, volumetric lighting. The character must look like a high-end GFX render used in top Roblox games.",
    simulator: "Vibrant, highly saturated colors, smooth plastic textures, low-poly but high fidelity, cheerful atmosphere, pet simulator aesthetic, bright studio lighting. Clean, glossy Roblox studs and smooth terrain.",
    obby: "Neon colors, glowing obstacles, dynamic parkour action perspective, floating platforms, high contrast. The character is in mid-air jumping. Speed lines, motion blur.",
    horror: "Dark, gritty, atmospheric fog, high contrast, flashlight lighting. The Roblox character looks terrified. Detailed texture overlay (grunge, rust). Photorealistic horror style.",
    rpg: "Epic fantasy style, magical particle effects, glowing weapons. The Roblox avatar is wearing detailed armor. Bloom lighting, adventurous atmosphere.",
    anime: "Cell-shaded, vibrant visual effects, action lines. The Roblox avatar has spiky anime hair and an aura. 'Demon Slayer' or 'One Piece' Roblox game style.",
    "high-ctr": "YOUTUBE CLICKBAIT THUMBNAIL. Extreme contrast, maximum saturation. The Roblox avatar has an exaggerated face (Shocked/Screaming). Thick white outlines around the character. Bright background with sunburst effect."
  };
  return styles[style] || styles.cinematic;
};

export const enhancePrompt = async (originalPrompt: string): Promise<string> => {
  return retryWithBackoff(async () => {
    try {
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert Roblox GFX artist. 
        Rewrite the following prompt to be a highly detailed description of a Roblox Render.
        MANDATORY: The subject MUST be a Roblox Avatar. If the user describes a person, describe them as a Roblox Avatar with specific accessories.
        
        Input: "${originalPrompt}"
        
        Output (keep it purely descriptive):`,
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
    
    // Updated Model Selection for Nano Banana series
    // 'flash' -> 'gemini-2.5-flash-image' (Nano Banana)
    // 'pro' -> 'gemini-3-pro-image-preview' (Nano Banana Pro)
    const modelName = config.model === 'pro' 
      ? 'gemini-3-pro-image-preview' 
      : 'gemini-2.5-flash-image';

    const characterModelInstruction = config.avatarModel === 'Rthro'
      ? "CHARACTER REQUIREMENT: ROBLOX RTHRO (REALISTIC) AVATAR. The character MUST have 'Rthro' proportions: taller, thinner, more realistic human-like joints and scaling, NOT blocky. Smooth limbs, detailed clothing mapping. Matches the 'Rthro' package style in Roblox."
      : "CHARACTER REQUIREMENT: ROBLOX R15 (BLOCKY) AVATAR. The character MUST have classic blocky proportions. Rectangular torso (1.0 or 2.0 package), separate cylindrical/blocky limb segments. Distinct shoulder, elbow, hip, and knee joints. NO realistic human proportions. It must look like a plastic toy/figure.";

    const finalPrompt = `
      [STRICT CONSTRAINT: ROBLOX ONLY]
      This image MUST be a 3D render of a Roblox Game Scene.
      EVERY character in the scene MUST be a Roblox Avatar.
      Do NOT generate realistic humans. Do NOT generate cartoons.
      ONLY generate Roblox Avatars.

      [SCENE DESCRIPTION]
      ${config.prompt}

      [VISUAL STYLE: ${config.style.toUpperCase()}]
      ${styleKeywords}
      
      [AVATAR SPECIFICATION]
      ${characterModelInstruction}

      [RENDER SETTINGS]
      - Engine: Blender / Octane Render (Roblox GFX Style)
      - Texture Quality: 4K PBR
      - Lighting: HDR Environment, Global Illumination
      ${config.style === 'high-ctr' ? '- EMOTION: Exaggerated facial expression decal on the Roblox face.' : ''}
      
      [NEGATIVE PROMPT]
      - ${config.negativePrompt || ""}
      - realistic human, flesh, skin texture (must look like plastic/roblox skin)
      - 2d drawing, sketch
      - blurry, low resolution
      - watermarks, text, ui elements
      - distorted roblox avatar
      - ${config.avatarModel === 'R15' ? 'realistic proportions, smooth limbs, human body' : 'blocky limbs, square torso, lego style'}
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
          [REFERENCE IMAGE SOURCE]
          The provided image is a Roblox Avatar.
          Render THIS EXACT AVATAR in the scene described below.
          Keep the hat, hair, shirt, pants, and accessories EXACTLY the same.
          Just change the pose and lighting.
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
      console.log(`Generating with ${modelName} | Model: ${config.avatarModel}`);

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