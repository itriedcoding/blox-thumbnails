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
    cinematic: "PHOTOREALISTIC CINEMATIC. 8K. Depth of Field. Bokeh. Color Graded. Movie Poster Quality. Dramatic Shadows. Anamorphic Lens Flares. Dust particles.",
    simulator: "ROBLOX SIMULATOR ICON STYLE. Ultra-Vibrant Colors. Glossy Plastic Textures. Soft Smooth Lighting. Happy Atmosphere. 3D Render style like Pet Simulator X. Clean gradients.",
    obby: "OBBY THUMBNAIL STYLE. High Contrast. Bright Neon Colors (Green, Pink, Blue). Motion lines. Wide Angle. Clear path visibility. Exciting and Fast-paced.",
    horror: "PHOTOREALISTIC HORROR. Grimy textures. Rust. Blood/Dirt decals. Volumetric fog. Low key lighting. Unsettling realism. Film Grain. High contrast shadows.",
    rpg: "FANTASY RPG GAME ART. Magic effects with particle lighting. Metallic armor reflections with scratches. Detailed environment textures. Epic scale. God Rays. Bloom.",
    anime: "HIGH FIDELITY ANIME 3D. Stylized realism. Detailed particle effects. Glowing auras. Vibrant colors but realistic shading and material response. Cel-shaded rim lights.",
    "high-ctr": "VIRAL YOUTUBE CLICKBAIT STYLE. 200% Saturation. Thick White Rim Lighting on Characters. Exaggerated Facial Expressions (Shocked/Screaming). Background Blur. Action Focus. 'Pop' visual style."
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
      
      Task: Optimize this prompt for a High-CTR 3D Render.
      Input: "${originalPrompt}"
      
      Guidelines:
      1. Add keywords for viral aesthetics: "Rim Lighting", "Subsurface Scattering", "Vibrant", "Expressive".
      2. Ensure materials are defined (e.g., "Glossy Plastic", "Glowing Neon").
      3. Make it exciting.
      
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

  // HIGH CTR LOGIC CHECK
  const isHighCtr = config.style === 'high-ctr' || config.style === 'simulator' || config.style === 'obby';

  // 1. Avatar Geometry & Texture Logic
  let avatarSpecs = "";
  if (config.avatarModel === 'R6') {
    avatarSpecs = `
      - TYPE: CLASSIC ROBLOX R6
      - GEOMETRY: Classic blocky proportions. Bevelled edges (Bevel Modifier).
      - MATERIAL: ${isHighCtr ? 'High-Gloss Plastic with Subsurface Scattering' : 'Realistic Fabric and Skin Textures'}.
    `;
  } else if (config.avatarModel === 'R15') {
    avatarSpecs = `
      - TYPE: MODERN ROBLOX R15
      - GEOMETRY: Segmented body. Smooth bending. High Poly.
      - MATERIAL: ${isHighCtr ? 'Vibrant, Clean, Smooth Shading' : 'PBR Imperfections, Cloth Weave, Detailed Skin'}.
    `;
  } else {
    avatarSpecs = `
      - TYPE: ROBLOX RTHRO
      - GEOMETRY: Humanoid proportions. Realistic.
      - MATERIAL: AAA Game Quality.
    `;
  }

  // 2. Expression Engine
  const expressionLogic = isHighCtr 
    ? `
      [EXPRESSION ENGINE: HIGH CTR]
      - FACE: EXAGGERATED EMOTION.
      - EYES: Large, expressive, reflective.
      - MOUTH: Open mouth (Shouting/Surprised) or Gritted Teeth (Action).
      - DIRECTION: Looking at the camera or the target object intensely.
    ` 
    : `
      [EXPRESSION ENGINE: CINEMATIC]
      - FACE: Subtle, realistic emotion fitting the scene.
      - EYES: Focused.
    `;

  // 3. Auto-Gen Logic
  let avatarInstruction = "";
  if (config.referenceImage) {
      avatarInstruction = `Use the provided image as the MAIN ROBLOX AVATAR reference. Keep the outfit and colors accurate. ${isHighCtr ? 'Make the colors POP and increase saturation.' : 'Upgrade materials to PBR.'}`;
  } else {
      avatarInstruction = `
      [AUTO-GENERATE AVATAR]
      ACTION: Design a unique Roblox avatar that fits the [SCENE DESCRIPTION].
      - STYLE: ${isHighCtr ? 'Eye-catching, Neon details, Expensive accessories (Dominus, Valkyrie, Fedora), Golden armor.' : 'Thematic, blended with environment.'}
      - CLOTHING: Detailed textures, 3D layered clothing.
      `;
  }

  const finalPrompt = `
    [TASK]
    Generate a ${isHighCtr ? 'VIRAL CLICKBAIT' : 'Cinematic'} 3D Render of a Roblox Scene.
    
    [SUBJECT]
    A high-fidelity Roblox Avatar. 
    DO NOT generate a cheap plastic toy.
    ${isHighCtr ? 'The avatar must pop out from the background using strong RIM LIGHTING.' : 'The avatar should blend realistically with the lighting.'}
    
    [AVATAR SPECIFICATIONS]
    ${avatarSpecs}
    ${expressionLogic}
    ${avatarInstruction}
    
    [SCENE DESCRIPTION]
    ${config.prompt}
    
    [COMPOSITION]
    ${config.secondReferenceImage ? "- Features TWO avatars interacting dynamically." : "- Focus on the main avatar."}
    ${
        config.pose && config.pose !== 'auto' 
        ? `- POSE: Force the avatar into a '${config.pose}' pose. Ensure anatomical correctness.` 
        : `- POSE: AUTO-ADAPTIVE. ${isHighCtr ? 'EXTREME ACTION POSE. Running towards camera, jumping, or pointing. Dynamic perspective.' : 'Natural pose fitting the context.'}`
    }
    - CAMERA: ${config.aspectRatio === '16:9' ? 'Wide Angle Action Shot' : 'Portrait Focus'}
    
    [LIGHTING & ATMOSPHERE]
    ${isHighCtr 
        ? '- LIGHTING: BRIGHT, VIBRANT. Strong Backlight (Rim Light). Fill light on face. High Saturation. Bloom effects.' 
        : '- LIGHTING: Raytraced Global Illumination. Volumetric Fog. Realistic Shadows.'
    }
    
    [STYLE: ${config.style.toUpperCase()}]
    ${getStylePrompt(config.style)}
    
    [NEGATIVE PROMPT]
    ${config.negativePrompt || ""}
    plastic, toy, lego, low resolution, pixelated, flat lighting, cartoon, simple, blur, noise, watermark, text, ui, distorted, bad anatomy, melting, low poly, cheap, dark, dull, muted colors
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