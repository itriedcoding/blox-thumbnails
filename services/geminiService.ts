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
    cinematic: "MASTERPIECE BLENDER GFX. Cycles Render. Cinematic Lighting. Volumetric Fog. 8K UHD. High resolution textures. Ambient Occlusion.",
    simulator: "ROBLOX SIMULATOR STYLE. Bright, vibrant colors. Smooth shading. Sun flares. Clean vector-like aesthetic but 3D. Commercial polish.",
    obby: "NEON OBBY AESTHETIC. Glowing parts. High contrast. Dynamic perspective. Speed lines. Floating platforms background.",
    horror: "ROBLOX HORROR. Dark atmosphere. Film grain. Spotlight lighting. Grimy textures. Unsettling vibe. PBR materials.",
    rpg: "FANTASY RPG. Magic particle effects. Glowing weapons. Epic atmosphere. Detailed armor textures. God rays.",
    anime: "ROBLOX ANIME. Cel-shaded visual effects. Dynamic action lines. Over-the-top energy auras. Intense lighting.",
    "high-ctr": "VIRAL YOUTUBE THUMBNAIL. High saturation. Expressive. Contrast boost. Sharp focus. Eye-catching composition."
  };
  return styles[style] || styles.cinematic;
};

export const generateRandomPrompt = async (): Promise<string> => {
  try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a VIRAL, HIGH-CTR Roblox thumbnail prompt.
        It must be catchy, exciting, and describe a scene that would get clicks on YouTube.
        Examples: 
        - "SHOCKED Roblox Noob finding a SECRET GOLDEN EGG in a forest"
        - "Giant Red Monster chasing a scared Roblox Avatar in a maze"
        
        Output ONLY the prompt text. No intro. No outro.`,
      });
      return response.text?.trim() || "Roblox noob eating a taco in space";
  } catch (e) {
      console.warn("Random prompt failed, using fallback");
      return "Cyberpunk samurai roblox avatar standing in neon rain, cinematic lighting, 8k";
  }
};

export const enhancePrompt = async (originalPrompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a Roblox GFX Artist.
      
      Task: Optimize this prompt for a high-quality Blender render of a Roblox scene.
      Input: "${originalPrompt}"
      
      Guidelines:
      1. Keep it concise but descriptive.
      2. Add lighting and camera keywords (e.g., "rim lighting", "low angle").
      3. Ensure it emphasizes "Roblox Avatar" and "3D Render".
      
      Output ONLY the enhanced prompt.`,
    });
    return response.text?.trim() || originalPrompt;
  } catch (e) {
    console.warn("Enhancement failed:", e);
    return originalPrompt;
  }
};

export const refineImage = async (base64Image: string, prompt: string): Promise<string> => {
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) throw new Error("Invalid base64");

    const parts = [
        {
            inlineData: {
                mimeType: matches[1],
                data: matches[2],
            },
        },
        {
            text: `[TASK: REFINE & UPSCALE]
            Input is a Roblox GFX render. 
            ACTION: Increase resolution, sharpen textures, fix any mesh artifacts, improve lighting quality.
            MAINTAIN: The exact composition, poses, and colors. Do not change the subject.
            STYLE: 8K Blender Cycles Render.
            CONTEXT: ${prompt}`
        }
    ];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', 
            contents: { parts },
            config: {
                imageConfig: {
                     aspectRatio: "1:1" 
                }
            }
        });

        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("Refine failed");
    } catch (e: any) {
        throw new Error(`Refine failed: ${e.message}`);
    }
};

export const generateThumbnail = async (config: ThumbnailConfig): Promise<string> => {
  // Select Model
  const modelName = config.model === 'pro' 
    ? 'gemini-3-pro-image-preview' 
    : 'gemini-2.5-flash-image';    

  let avatarSpecs = "";
  if (config.avatarModel === 'R6') {
    avatarSpecs = `
      - TYPE: CLASSIC ROBLOX R6
      - GEOMETRY: Blocky torso, simple blocky limbs. No knees, no elbows.
      - AESTHETIC: Iconic "Old Roblox" look but with high-quality rendering.
      - TEXTURES: Clean, sharp, standard Roblox textures.
    `;
  } else if (config.avatarModel === 'R15') {
    avatarSpecs = `
      - TYPE: MODERN ROBLOX R15
      - GEOMETRY: 15 distinct body parts. Segmented arms and legs (visible joints).
      - AESTHETIC: Standard modern Roblox avatar. Sharp edges on body parts.
      - TEXTURES: High fidelity clothing textures applied to the blocky mesh.
    `;
  } else {
    avatarSpecs = `
      - TYPE: ROBLOX RTHRO
      - GEOMETRY: Humanoid proportions but stylized. Smooth joints.
      - AESTHETIC: Realistic Roblox avatar style.
    `;
  }

  const finalPrompt = `
    [TASK]
    Create a High-Quality 3D Roblox GFX Thumbnail (8K Resolution).
    The image MUST feature a Roblox Avatar. It must look authentically like the game Roblox, rendered in software like Blender (Cycles) or Cinema 4D.
    
    [AVATAR SPECIFICATIONS]
    ${avatarSpecs}
    
    [CRITICAL RULES]
    1. NO "Melting Plastic" look. Edges should be defined.
    2. NO Generic 3D Humans. Must be a ROBLOX AVATAR.
    3. NO Low-poly artifacts. Use high-resolution textures.
    4. Materials should look like high-quality digital assets (GFX), not cheap physical toys.
    
    [SCENE]
    ${config.prompt}
    
    [ADDITIONAL DETAILS]
    ${config.secondReferenceImage ? "- Features TWO Roblox avatars interacting." : "- Features the main Roblox avatar."}
    ${config.pose ? `- Pose: ${config.pose}` : "- Dynamic Pose"}
    
    [STYLE: ${config.style.toUpperCase()}]
    ${getStylePrompt(config.style)}
    
    [NEGATIVE PROMPT]
    ${config.negativePrompt || ""}
    cheap plastic, melted, distorted, bad anatomy, realistic human, photograph, fuzzy textures, low resolution, blurry, watermark, text, ui, hud, deformed
  `;

  const parts: any[] = [];

  // 1. First Avatar
  if (config.referenceImage) {
    if (config.referenceImage.startsWith('http')) {
       parts.push({ text: `Reference Image URL (Main Character): ${config.referenceImage}` });
       parts.push({ text: "Use this Roblox avatar as the main subject. Keep the outfit and colors accurate." });
    } else {
        const matches = config.referenceImage.match(/^data:(.+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2],
            },
          });
          parts.push({ text: "Use this image as the MAIN ROBLOX AVATAR reference. Keep the outfit/accessories." });
        }
    }
  }

  // 2. Second Avatar
  if (config.secondReferenceImage) {
      const matches = config.secondReferenceImage.match(/^data:(.+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2],
          },
        });
        parts.push({ text: "Use this image as the SECOND ROBLOX AVATAR reference. Have them interacting with the main avatar." });
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
    if (config.model === 'pro' && error.message?.includes('403')) {
        console.warn("Pro model failed, retrying with Flash...");
        return generateThumbnail({...config, model: 'flash'});
    }
    throw new Error(`Generation failed: ${error.message}`);
  }
};