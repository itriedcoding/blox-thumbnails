import { GoogleGenAI } from "@google/genai";
import { ThumbnailConfig, ThumbnailStyle } from "../types";

const getAIInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  const ai = getAIInstance();
  try {
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
};

export const generateThumbnail = async (config: ThumbnailConfig): Promise<string> => {
  const ai = getAIInstance();
  
  const styleKeywords = getStylePrompt(config.style);
  
  // Model selection
  const modelName = config.model === 'pro' 
    ? 'gemini-3-pro-image-preview' 
    : 'gemini-2.5-flash-image';

  // Strict Avatar Instructions - Enforce Roblox aesthetic based on R15/Rthro toggle
  const characterModelInstruction = config.avatarModel === 'Rthro'
    ? "CHARACTER REQUIREMENT: ROBLOX RTHRO (REALISTIC) AVATAR. The character MUST have 'Rthro' proportions: taller, thinner, more realistic human-like joints and scaling, NOT blocky. Smooth limbs, detailed clothing mapping. Matches the 'Rthro' package style in Roblox."
    : "CHARACTER REQUIREMENT: ROBLOX R15 (BLOCKY) AVATAR. The character MUST have classic blocky proportions. Rectangular torso (1.0 or 2.0 package), separate cylindrical/blocky limb segments. Distinct shoulder, elbow, hip, and knee joints. NO realistic human proportions. It must look like a plastic toy/figure.";

  // The Master Prompt - Forces everything to be Roblox related
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

  // Handle Reference Image
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
        msg = "API Key Error: Please ensure you are using a valid key from a paid project.";
    }
    throw new Error(msg);
  }
};