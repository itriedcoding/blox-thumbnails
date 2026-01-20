import { GoogleGenAI, Type } from "@google/genai";
import { ThumbnailConfig, ThumbnailStyle, ModelType, FaceExpression, LightingPreset, ParticleEffect, AspectRatio, RenderEngine, Composition } from "../types";

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
    cinematic: "STYLE: CINEMATIC ROBLOX RENDER. 8K Resolution. Detailed Textures. Volumetric Lighting. Action Movie Atmosphere. NO REALISM, KEEP ROBLOX AESTHETIC.",
    simulator: "STYLE: ROBLOX SIMULATOR GAME ICON. Ultra-Vibrant, High Saturation. Glossy 'Toy' Plastic Textures. Bright Smooth Lighting. Soft Shadows. Clean and Colorful.",
    obby: "STYLE: ROBLOX OBBY THUMBNAIL. Neon Colors (Green, Pink, Blue). High Contrast. clear path visibility. Dynamic Motion Lines. Fun and Exciting.",
    horror: "STYLE: ROBLOX HORROR GAME. Dark, Grimy, Rusty Textures. Spotlight Lighting. Fog/Mist. Scary Atmosphere but still Roblox Avatars. High Contrast Shadows.",
    rpg: "STYLE: ROBLOX RPG/FANTASY. Magical Effects. Glowing Runes. Metallic Armor Textures. Epic Scale Backgrounds. God Rays. Particle Heavy.",
    anime: "STYLE: ROBLOX ANIME BATTLEGROUNDS. Cel-Shaded Rim Lights. Manga Speed Lines. Energy Auras. Intense Action. Stylized VFX.",
    restaurant: "STYLE: ROBLOX RESTAURANT/CAFE ROLEPLAY. Cozy Warm Lighting (Golden Hour). High-Poly Food Assets (Burgers, Sushi, Boba). Wooden/Modern Interior. Soft Bokeh Background. Inviting Atmosphere.",
    "high-ctr": "STYLE: VIRAL ROBLOX DISCOVERY. Extreme Gloss. Brightest Colors possible. Thick White Outlines (Rim Light). Gradient Backgrounds. Optimized for Click-Through Rate.",
    shooter: "STYLE: ROBLOX FPS/SHOOTER. Tactical Military Gear. Muzzle Flashes. Tracer Rounds. Gritty Urban or Sci-Fi Environment. First-Person or Over-Shoulder View. Motion Blur.",
    tycoon: "STYLE: ROBLOX TYCOON. Isometric or Wide View of Massive Base/Mansion. Stacks of Cash/Money. Droppers and Conveyors. Progression and Wealth theme."
  };
  return styles[style] || styles.cinematic;
};

const getRenderEnginePrompt = (engine: RenderEngine): string => {
    switch (engine) {
        case 'cycles': return "RENDER ENGINE: BLENDER CYCLES. Path Tracing. Realistic Global Illumination. High Fidelity Materials.";
        case 'eevee': return "RENDER ENGINE: BLENDER EEVEE. Real-time Rendering Look. Sharp Shadows. Bloom. Faster/Game-like feel.";
        case 'c4d': return "RENDER ENGINE: CINEMA 4D. MoGraph Style. Smooth Animations. Abstract 3D Shapes. Very Clean and Polished.";
        case 'studio': return "RENDER ENGINE: ROBLOX STUDIO NATIVE. Authentic In-Game Look. Voxel Terrain. Default Roblox Lighting. Nostalgic/Classic feel.";
        default: return "";
    }
};

const getCompositionPrompt = (comp: Composition): string => {
    switch (comp) {
        case 'closeup': return "CAMERA: EXTREME CLOSE-UP on Face/Head. Focus on expression and accessories. Background Blurred (Bokeh). Perfect for Game Icons (1:1).";
        case 'waist-shot': return "CAMERA: MEDIUM SHOT (Waist Up). Showcasing outfit and held items. Standard Portrait composition.";
        case 'wide-action': return "CAMERA: WIDE ANGLE ACTION SHOT. Dynamic FOV (Field of View). Capturing the environment and full character movement. Good for Thumbnails (16:9).";
        case 'isometric': return "CAMERA: ISOMETRIC VIEW (High Angle). looking down at the map/base. Strategic view. Good for Tycoons/Strategy.";
        case 'vs-mode': return "CAMERA: SPLIT COMPOSITION or FACE-OFF. Two characters facing each other or screen divided. Conflict/Battle theme.";
        default: return "";
    }
};

const getExpressionPrompt = (exp?: FaceExpression): string => {
    switch (exp) {
        case 'shocked': return "EXPRESSION: ROBLOX SHOCKED FACE (Mouth Open, Eyes Wide).";
        case 'happy': return "EXPRESSION: ROBLOX WINNING SMILE (Happy, Cheerful).";
        case 'angry': return "EXPRESSION: ROBLOX ANGRY FACE (Furrowed Brows, Intense).";
        case 'evil': return "EXPRESSION: ROBLOX VILLAIN FACE (Sinister Grin, Shadowed Eyes).";
        case 'crying': return "EXPRESSION: ROBLOX SAD FACE (Crying, Tears).";
        case 'sigma': return "EXPRESSION: ROBLOX 'MAN FACE' (Chiseled, Confident, Meme).";
        case 'silly': return "EXPRESSION: ROBLOX SILLY FACE (Tongue Out, Goofy).";
        default: return "";
    }
};

const getLightingPrompt = (light?: LightingPreset): string => {
    switch (light) {
        case 'neon-studio': return "LIGHTING: NEON STUDIO. Pink/Blue Rim Lights. Dark Background.";
        case 'sun-drenched': return "LIGHTING: BRIGHT DAYLIGHT. Sun + Sky. Vibrant and Happy.";
        case 'dark-void': return "LIGHTING: DARK VOID. Spotlight only. Dramatic.";
        case 'god-rays': return "LIGHTING: DIVINE. Volumetric God Rays from above.";
        case 'cyber-punk': return "LIGHTING: CYBERPUNK CITY. Night time, Neon Signs, Wet Reflections.";
        case 'soft-box': return "LIGHTING: SOFTBOX STUDIO. Even, professional lighting.";
        default: return "";
    }
};

const getParticlePrompt = (particles?: ParticleEffect): string => {
    switch (particles) {
        case 'sparkles': return "FX: Glowing Sparkles/Stars.";
        case 'fire': return "FX: Fire/Flames Aura.";
        case 'money': return "FX: Flying Robux/Coins.";
        case 'glitch': return "FX: Digital Glitch Artifacts.";
        case 'lightning': return "FX: Blue Lightning Arcs.";
        case 'pet-trail': return "FX: Floating Mini-Pets Trail.";
        case 'hearts': return "FX: Floating Love Hearts.";
        default: return "";
    }
};

const ROBLOX_VISUAL_ELEMENTS = [
    "Floating Pet Egg", "Golden Bars", "Speed Trail", "Magic Rune", "Neon Platform", "Diamond Sword"
];

// ==========================================
// 🧠 NEURAL CONFIGURATION ENGINE
// ==========================================

export const inferThumbnailConfig = async (prompt: string): Promise<Partial<ThumbnailConfig>> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze this Roblox Game concept: "${prompt}".
            Determine the best settings for a Roblox Game Thumbnail.
            
            Return JSON:
            {
                "expression": "shocked" | "happy" | "angry" | "evil" | "default",
                "lighting": "neon-studio" | "sun-drenched" | "dark-void" | "default",
                "particles": "sparkles" | "fire" | "money" | "none",
                "pose": "standing" | "fighting_stance" | "running" | "jumping",
                "aspectRatio": "16:9" | "1:1",
                "composition": "closeup" | "wide-action" | "isometric" | "waist-shot"
            }
            `,
            config: {
                responseMimeType: "application/json",
            }
        });
        
        const jsonText = response.text || "{}";
        return JSON.parse(jsonText);
    } catch (e) {
        return {
            expression: 'default',
            lighting: 'default',
            particles: 'none',
            pose: 'standing',
            aspectRatio: '16:9',
            composition: 'wide-action'
        };
    }
};

// ==========================================
// UTILITIES (Unchanged mostly, just types)
// ==========================================

export const generateRandomPrompt = async (): Promise<string> => {
  try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a VIRAL ROBLOX GAME IDEA prompt. 
        Examples: "Tycoon where you build a moon base", "FPS in a candy land", "Horror game in a school".
        Output ONLY the prompt.`,
      });
      return response.text?.trim() || "Roblox obby in the clouds";
  } catch (e) {
      return "Cyberpunk ninja simulator roblox";
  }
};

export const expandPrompt = async (shortPrompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Role: Roblox GFX Artist.
            Task: Expand this idea into a detailed Blender Render prompt.
            Input: "${shortPrompt}"
            Output: ONLY the prompt.`
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
      contents: `Make this prompt more "Roblox High-CTR": "${originalPrompt}". Add keywords like "4k", "Blender", "Glossy". Output ONLY the prompt.`,
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
        { text: `Analyze this Roblox GFX. Is it high CTR? What game genre is it?` }
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
        { text: `Upscale this Roblox GFX. Keep details sharp. Reduce noise. Context: ${prompt}` }
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
        { text: `Generate a black and white mask for the Roblox Character.` }
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
            contents: `Roblox game background. ${prompt}. No characters.`,
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
  const isRestaurant = config.style === 'restaurant';
  const isShooter = config.style === 'shooter';

  // NEURAL AUTO-CONFIGURATION
  let effectiveConfig = { ...config };
  
  // Auto-detect settings if 'auto' is selected
  if (config.expression === 'auto' || config.lighting === 'auto' || config.particles === 'auto' || config.pose === 'auto' || config.aspectRatio === 'auto' || config.composition === 'auto') {
      const inferred = await inferThumbnailConfig(config.prompt);
      
      if (config.expression === 'auto') effectiveConfig.expression = inferred.expression as FaceExpression;
      if (config.lighting === 'auto') effectiveConfig.lighting = inferred.lighting as LightingPreset;
      if (config.particles === 'auto') effectiveConfig.particles = inferred.particles as ParticleEffect;
      if (config.pose === 'auto') effectiveConfig.pose = inferred.pose;
      if (config.aspectRatio === 'auto') effectiveConfig.aspectRatio = (inferred.aspectRatio || "16:9") as AspectRatio;
      if (config.composition === 'auto') effectiveConfig.composition = (inferred.composition || "wide-action") as Composition;
  }

  // Fallbacks
  if (effectiveConfig.aspectRatio === 'auto') effectiveConfig.aspectRatio = '16:9';
  if (effectiveConfig.composition === 'auto') effectiveConfig.composition = 'wide-action';

  // Specific Overrides for Game Types
  if (isRestaurant && config.lighting === 'auto') effectiveConfig.lighting = 'sun-drenched';
  if (isShooter && config.pose === 'auto') effectiveConfig.pose = 'fighting_stance';

  let avatarSpecs = config.avatarModel === 'R6' ? 'Classic R6 Blocky Roblox Avatar' : config.avatarModel === 'R15' ? 'Modern R15 Segmented Roblox Avatar' : 'Realistic Rthro Roblox Avatar';
  
  // ROBLOX ALGORITHM INJECTION LOGIC
  let viralInjection = "";
  if (config.style === 'high-ctr') {
      const randomElement = ROBLOX_VISUAL_ELEMENTS[Math.floor(Math.random() * ROBLOX_VISUAL_ELEMENTS.length)];
      viralInjection = `BACKGROUND ELEMENT: "${randomElement}". AESTHETIC: High Gloss, Plastic, Vibrant.`;
  }
  
  if (isRestaurant) {
      viralInjection = `DETAILS: Delicious high-poly food (Sushi, Boba, Pizza) on tables. Cozy warm interior.`;
  }
  
  if (isShooter) {
      viralInjection = `DETAILS: Holding tactical weapon (SCAR/AK-47 style toy gun). Muzzle flash. Crosshair UI element overlay.`;
  }

  const finalPrompt = `
    [STRICT CONSTRAINT] GENERATE A 3D RENDER OF A ROBLOX GAME. 
    DO NOT GENERATE REAL LIFE HUMAN PHOTOS. DO NOT GENERATE YOUTUBE FACES.
    SUBJECT MUST BE A ROBLOX AVATAR (Plastic Texture, Segmented Limbs).
    
    [SUBJECT] ${avatarSpecs} in ${effectiveConfig.pose || 'Action Pose'}.
    [SCENE] ${config.prompt}
    [STYLE] ${getStylePrompt(config.style)}
    ${getRenderEnginePrompt(config.renderEngine)}
    ${getCompositionPrompt(effectiveConfig.composition)}
    ${getExpressionPrompt(effectiveConfig.expression)}
    ${getLightingPrompt(effectiveConfig.lighting)}
    ${getParticlePrompt(effectiveConfig.particles)}
    ${viralInjection}
    
    [NEGATIVE PROMPT] ${config.negativePrompt || "real life, photorealistic human, skin texture, vlog, youtube thumbnail face, human eyes, nose, realistic hands, bad anatomy, text, watermark"}
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

  const generationConfig: any = { 
      imageConfig: { aspectRatio: effectiveConfig.aspectRatio } 
  };
  
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
