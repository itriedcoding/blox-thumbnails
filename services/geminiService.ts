import { GoogleGenAI } from "@google/genai";
import { ThumbnailConfig, ThumbnailStyle, ModelType, FaceExpression, LightingPreset, ParticleEffect } from "../types";

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
    "high-ctr": "ROBLOX DISCOVERY ALGORITHM OPTIMIZED. BLENDER 4.0 CYCLES RENDER. HIGH GLOSS PLASTIC MATERIALS. TOY SHADER. EXTREME BLOOM. THICK WHITE OUTLINE AROUND CHARACTER. VIBRANT GRADIENT BACKGROUND. 3D TEXTURE MAPPING. NO ARROWS. NO TEXT. PURE VISUAL APPEAL."
  };
  return styles[style] || styles.cinematic;
};

const getExpressionPrompt = (exp?: FaceExpression): string => {
    switch (exp) {
        case 'shocked': return "FACE EXPRESSION: EXTREME SHOCK, MOUTH OPEN WIDE, EYES POPPING OUT, HANDS ON CHEEKS.";
        case 'happy': return "FACE EXPRESSION: OVERJOYED, BIGGEST SMILE, LAUGHING, TEARS OF JOY.";
        case 'angry': return "FACE EXPRESSION: FURIOUS, GLOWING RED EYES, GRITTING TEETH, STEAM COMING FROM EARS.";
        case 'evil': return "FACE EXPRESSION: SINISTER GRIN, SHADOWED FACE, VILLAINOUS LAUGH, GLOWING PURPLE EYES.";
        case 'crying': return "FACE EXPRESSION: SOBBING, TEARS STREAMING DOWN FACE, SAD PUPPY EYES.";
        case 'sigma': return "FACE EXPRESSION: STOIC CHAD FACE, CONFIDENT SMIRK, RAISED EYEBROW, MEWING.";
        case 'silly': return "FACE EXPRESSION: TONGUE OUT, CROSSED EYES, GOOFY, DERPY.";
        default: return "";
    }
};

const getLightingPrompt = (light?: LightingPreset): string => {
    switch (light) {
        case 'neon-studio': return "LIGHTING: CYBERPUNK NEON STUDIO. Pink and Blue Rim Lights. Dark Background. High Contrast.";
        case 'sun-drenched': return "LIGHTING: GOLDEN HOUR. Warm sunlight flooding the scene. Lens flares. Bright and Airy.";
        case 'dark-void': return "LIGHTING: PITCH BLACK VOID. Only the character is lit by a single spotlight from above. Dramatic.";
        case 'god-rays': return "LIGHTING: HEAVENLY. Massive volumetric light beams coming from the sky. Holy atmosphere.";
        case 'cyber-punk': return "LIGHTING: NIGHT CITY. Street lamps, neon signs reflecting on wet ground. Green and Purple hues.";
        case 'soft-box': return "LIGHTING: PROFESSIONAL STUDIO SOFTBOX. Even lighting, no harsh shadows, perfect for character showcase.";
        default: return "";
    }
};

const getParticlePrompt = (particles?: ParticleEffect): string => {
    switch (particles) {
        case 'sparkles': return "FX: Floating glowing magical sparkles and stars surrounding the character.";
        case 'fire': return "FX: Raging fire aura, embers flying, heat distortion around the character.";
        case 'money': return "FX: Falling Robux stacks, gold coins raining down, wealth aura.";
        case 'glitch': return "FX: Digital glitch artifacts, chromatic aberration, data stream particles.";
        case 'lightning': return "FX: Crackling blue electricity arcs, lightning bolts striking background.";
        case 'pet-trail': return "FX: Glowing speed trail, cute floating mini-pets following the character.";
        case 'hearts': return "FX: Floating pink and red hearts, love aura, soft glow.";
        default: return "";
    }
};

// Replaced generic tokens with Roblox Visual Elements
const ROBLOX_VISUAL_ELEMENTS = [
    "Floating Legendary Pet Egg cracking open",
    "Stack of Golden Bars in background",
    "Glowing Blue Speed Trail",
    "Magical Rune Circle on ground",
    "Neon Floating Platforms",
    "Shiny Diamond Sword on back"
];

export const generateRandomPrompt = async (): Promise<string> => {
  try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a VIRAL, HIGH-CTR, HYPER-REALISTIC Roblox thumbnail prompt.
        It must be catchy, exciting, and describe a scene with realistic lighting and materials.
        Output ONLY the prompt text.`,
      });
      return response.text?.trim() || "Roblox noob eating a taco in space";
  } catch (e) {
      console.warn("Random prompt failed, using fallback");
      return "Cyberpunk samurai roblox avatar standing in neon rain, cinematic lighting, 8k";
  }
};

export const expandPrompt = async (shortPrompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Role: Professional Roblox GFX Artist.
            Task: Expand this short idea into a highly detailed 3D rendering prompt.
            Input: "${shortPrompt}"
            Requirements: Describe lighting, camera angle, textures, action, and atmosphere. Keep it under 50 words.
            Output: ONLY the expanded prompt.`
        });
        return response.text?.trim() || shortPrompt;
    } catch (e) {
        return shortPrompt;
    }
};

export const enhancePrompt = async (originalPrompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Optimize this prompt for High-CTR Roblox GFX: "${originalPrompt}". Add viral keywords like "Rim Light", "4K". Output ONLY the enhanced prompt.`,
    });
    return response.text?.trim() || originalPrompt;
  } catch (e) {
    return originalPrompt;
  }
};

export const analyzeImage = async (base64Image: string): Promise<string> => {
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) throw new Error("Invalid base64");

    const parts = [
        { inlineData: { mimeType: matches[1], data: matches[2] } },
        { text: `[TASK: ANALYZE ROBLOX THUMBNAIL]
        Act as a professional YouTube algorithm expert.
        1. Rate the Click-Through Rate (CTR) potential (1-10).
        2. Describe the main subject.
        3. Suggest ONE specific improvement for lighting or composition.
        Keep it concise (under 50 words).` }
    ];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts }
        });
        return response.text?.trim() || "Analysis unavailable.";
    } catch (e: any) {
        return "Failed to analyze image.";
    }
};

export const refineImage = async (base64Image: string, prompt: string): Promise<string> => {
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) throw new Error("Invalid base64");

    const parts = [
        { inlineData: { mimeType: matches[1], data: matches[2] } },
        { text: `[TASK: UPSCALE & REMASTER] 
        Input is a Roblox GFX render. 
        ACTION: Enhance details, fix aliasing, improve lighting, and increase perceived resolution.
        CONSTRAINT: Keep the exact same composition and characters. Do not change the scene content.
        Context: ${prompt}` }
    ];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', 
            contents: { parts },
            config: { imageConfig: { aspectRatio: "1:1" } }
        });

        return extractImage(response);
    } catch (e: any) {
        throw new Error(`Refine failed: ${e.message}`);
    }
};

export const generateSegmentationMask = async (base64Image: string): Promise<string> => {
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) throw new Error("Invalid base64");

    const parts = [
        { inlineData: { mimeType: matches[1], data: matches[2] } },
        { text: `Generate a high-contrast BLACK AND WHITE mask for the MAIN SUBJECT (Roblox Avatar). White subject, Black background.` }
    ];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: { imageConfig: { aspectRatio: "1:1" } }
        });

        return extractImage(response);
    } catch (e: any) {
        throw new Error(`Mask generation failed: ${e.message}`);
    }
};

export const generateBackgroundImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: `Generate a seamless high-quality background texture/scene. 
            Description: ${prompt}. 
            Style: 3D Render, Roblox Style, High Detail. 
            No characters. Just environment/background.`,
            config: { imageConfig: { aspectRatio: "16:9" } }
        });
        return extractImage(response);
    } catch (e: any) {
        throw new Error("BG Gen failed");
    }
}

const extractImage = (response: any): string => {
     if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            }
        }
    }
    throw new Error("No image data in response");
}

export const generateThumbnail = async (config: ThumbnailConfig): Promise<string> => {
  const modelName = config.model === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';    
  const isHighCtr = config.style === 'high-ctr' || config.style === 'simulator' || config.style === 'obby';

  let avatarSpecs = config.avatarModel === 'R6' ? 'Classic R6 Blocky' : config.avatarModel === 'R15' ? 'Modern R15 Segmented' : 'Realistic Rthro';
  
  // ROBLOX ALGORITHM INJECTION LOGIC
  let viralInjection = "";
  if (config.style === 'high-ctr') {
      const randomElement = ROBLOX_VISUAL_ELEMENTS[Math.floor(Math.random() * ROBLOX_VISUAL_ELEMENTS.length)];
      viralInjection = `BACKGROUND ELEMENT: "${randomElement}". AESTHETIC: High Gloss, Plastic, Vibrant.`;
  }

  const finalPrompt = `
    [TASK] Generate a ${isHighCtr ? 'HIGH QUALITY ROBLOX GAME ICON' : 'Cinematic'} 3D Render.
    [SUBJECT] High-fidelity Roblox Avatar (${avatarSpecs}).
    [SCENE] ${config.prompt}
    [STYLE] ${getStylePrompt(config.style)}
    ${getExpressionPrompt(config.expression)}
    ${getLightingPrompt(config.lighting)}
    ${getParticlePrompt(config.particles)}
    ${viralInjection}
    [CAMERA] ${isHighCtr ? 'Dynamic Angle, Focused on Character, Depth of Field' : 'Cinematic Composition, Rule of Thirds'}
    [RENDER] Blender Cycles, 8K Resolution, High Poly, Ambient Occlusion.
    [NEGATIVE] ${config.negativePrompt || "low quality, text, watermark, bad anatomy, blur, noise, distorted face"}
  `;

  const parts: any[] = [];
  if (config.referenceImage) {
      const matches = config.referenceImage.match(/^data:(.+);base64,(.+)$/);
      if (matches) parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
      parts.push({ text: "Use this image as the MAIN AVATAR reference." });
  }
  if (config.secondReferenceImage) {
       const matches = config.secondReferenceImage.match(/^data:(.+);base64,(.+)$/);
       if (matches) parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
       parts.push({ text: "Use this as SECONDARY AVATAR." });
  }
  parts.push({ text: finalPrompt });

  const generationConfig: any = { imageConfig: { aspectRatio: config.aspectRatio } };
  if (config.seed) generationConfig.seed = config.seed; 
  if (config.model === 'pro') generationConfig.imageConfig.imageSize = "2K"; 

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: generationConfig,
    });
    return extractImage(response);
  } catch (error: any) {
    if (config.model === 'pro' && error.message?.includes('403')) {
        return generateThumbnail({...config, model: 'flash'});
    }
    throw new Error(`Generation failed: ${error.message}`);
  }
};