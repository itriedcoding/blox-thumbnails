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
    cinematic: "PHOTOREALISTIC CINEMATIC. 8K. Depth of Field. Bokeh. Color Graded. Movie Poster Quality. Dramatic Shadows. Anamorphic Lens Flares.",
    simulator: "HIGH-END 3D RENDER. Vibrant but Realistic Lighting. Soft Shadows. Ambient Occlusion. Detailed Background. Clean Composition. Commercial CGI.",
    obby: "DYNAMIC ACTION RENDER. Motion Blur. High Contrast. Neon Lighting interacting with realistic materials. Glossy reflections. Raytraced.",
    horror: "PHOTOREALISTIC HORROR. Grimy textures. Rust. Blood/Dirt decals. Volumetric fog. Low key lighting. Unsettling realism. Film Grain.",
    rpg: "FANTASY REALISM. Magic effects with particle lighting. Metallic armor reflections with scratches. Detailed environment textures. Epic scale. God Rays.",
    anime: "HIGH FIDELITY ANIME 3D. Stylized realism. Detailed particle effects. Glowing auras. Vibrant colors but realistic shading and material response.",
    "high-ctr": "VIRAL YOUTUBE THUMBNAIL. Hyper-saturated. Extremely Sharp. Exaggerated Lighting. High Detail. Face focus. Rim Lighting."
  };
  return styles[style] || styles.cinematic;
};

export const generateRandomPrompt = async (): Promise<string> => {
  try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a VIRAL, HIGH-CTR, HYPER-REALISTIC Roblox thumbnail prompt.
        It must be catchy, exciting, and describe a scene with realistic lighting and materials.
        Examples: 
        - "Hyper-realistic Roblox Noob finding a glowing golden egg in a detailed forest with god rays"
        - "Giant Red Monster with realistic fur chasing a Roblox Avatar in a rainy neon city"
        
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
      contents: `You are a professional 3D Artist specializing in Roblox GFX.
      
      Task: Optimize this prompt for a Hyper-Realistic 8K Blender Cycles render of a Roblox scene.
      Input: "${originalPrompt}"
      
      Guidelines:
      1. Add keywords for photorealism: "8k", "raytracing", "pbr textures", "volumetric lighting".
      2. Describe materials (e.g., "scratched metal", "woven fabric", "subsurface scattering on skin").
      3. Keep the core Roblox identity but elevate the rendering quality to "Movie Grade".
      
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
            STYLE: 8K Photorealistic Blender Render. PBR Materials. Remove any plastic/toy look.
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
      - TYPE: CLASSIC ROBLOX R6 (High Fidelity Remaster)
      - GEOMETRY: Classic blocky proportions but with bevelled edges to catch light.
      - AESTHETIC: Premium 3D Render. Not a cheap toy.
      - TEXTURES: 4K PBR textures, detailed fabric weaves on clothing, realistic skin shader.
    `;
  } else if (config.avatarModel === 'R15') {
    avatarSpecs = `
      - TYPE: MODERN ROBLOX R15 (Cinema Quality)
      - GEOMETRY: 15-part segmented body with high-poly bevels.
      - AESTHETIC: Hyper-realistic CGI character.
      - TEXTURES: Imperfections, surface details, realistic cloth folds, subsurface scattering on skin.
    `;
  } else {
    avatarSpecs = `
      - TYPE: ROBLOX RTHRO (Photoreal)
      - GEOMETRY: Humanoid proportions with smooth realistic joints.
      - AESTHETIC: AAA Game Character quality.
      - TEXTURES: Ultra-detailed skin pores, realistic eyes, hair strands.
    `;
  }

  // Construct Instruction Logic
  let avatarInstruction = "";
  if (config.referenceImage) {
      avatarInstruction = "Use the provided image as the MAIN ROBLOX AVATAR reference. Keep the outfit and colors accurate but upgrade the materials to PBR.";
  } else {
      // AUTO-GENERATION LOGIC
      avatarInstruction = `
      [AUTO-GENERATE AVATAR]
      No reference image provided.
      ACTION: Design a unique, detailed Roblox avatar that perfectly fits the [SCENE DESCRIPTION].
      - If the prompt mentions a specific character type (e.g. 'Zombie', 'Knight', 'Business Man', 'Noob'), generate exactly that.
      - If the prompt is generic, create a character that fits the environment (e.g. Space suit for space, camo for war).
      - ENSURE the avatar has high-quality clothing textures and accessories.
      `;
  }

  const finalPrompt = `
    [TASK]
    Generate a Hyper-Realistic 8K 3D Render of a Roblox Scene (Blender Cycles / Unreal Engine 5).
    
    [SUBJECT]
    A high-fidelity Roblox Avatar. 
    DO NOT generate a plastic toy or a simple Lego figure.
    The avatar should look like a high-budget CGI movie character based on Roblox design.
    
    [VISUAL STYLE]
    - RENDER ENGINE: Unreal Engine 5 / Blender Cycles.
    - LIGHTING: Global Illumination, Ray Tracing, Volumetric Fog, Cinematic Rim Lighting.
    - MATERIALS: Physically Based Rendering (PBR). Metal looks like metal, cloth looks like cloth, skin has subsurface scattering.
    - DETAIL: Micro-scratches, dust particles, fabric weave, detailed hair.
    
    [AVATAR SPECIFICATIONS]
    ${avatarSpecs}
    ${avatarInstruction}
    
    [SCENE DESCRIPTION]
    ${config.prompt}
    
    [COMPOSITION]
    ${config.secondReferenceImage ? "- Features TWO avatars interacting dynamically." : "- Focus on the main avatar."}
    ${
        config.pose && config.pose !== 'auto' 
        ? `- POSE: Force the avatar into a '${config.pose}' pose. Ensure anatomical correctness.` 
        : `- POSE: AUTO-ADAPTIVE. Analyze the action in the prompt. If fighting, use dynamic combat pose. If running, use sprint pose. If standing, use casual stance. Use exaggerated perspective.`
    }
    - CAMERA: ${config.aspectRatio === '16:9' ? 'Cinematic Wide Angle' : 'Portrait Focus'}
    
    [STYLE: ${config.style.toUpperCase()}]
    ${getStylePrompt(config.style)}
    
    [NEGATIVE PROMPT]
    ${config.negativePrompt || ""}
    plastic, toy, lego, low resolution, pixelated, flat lighting, cartoon, simple, blur, noise, watermark, text, ui, distorted, bad anatomy, melting, low poly, cheap
  `;

  const parts: any[] = [];

  // 1. First Avatar
  if (config.referenceImage) {
    if (config.referenceImage.startsWith('http')) {
       parts.push({ text: `Reference Image URL (Main Character): ${config.referenceImage}` });
       parts.push({ text: avatarInstruction });
    } else {
        const matches = config.referenceImage.match(/^data:(.+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2],
            },
          });
          parts.push({ text: avatarInstruction });
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