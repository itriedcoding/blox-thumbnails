
import { GoogleGenAI, Type } from "@google/genai";
import { ThumbnailConfig, ThumbnailStyle, ModelType, FaceExpression, LightingPreset, ParticleEffect, AspectRatio, RenderEngine, Composition, RobloxMaterial, TimeOfDay, Weather, AvatarModel, CameraLens, ColorGrading, RenderPhysics } from "../types";

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
    cinematic: "STYLE: CINEMATIC ROBLOX GFX. 8K Resolution. Blender Cycles Render. Authentic Roblox Textures. Volumetric Lighting. ABSOLUTELY NO REALISM. STRICT R6/R15 GEOMETRY.",
    simulator: "STYLE: ROBLOX SIMULATOR ICON. High Saturation. Roblox 'SmoothPlastic' Material. Bright Sun Lighting. Soft Shadows. Clean Gradient Backgrounds. Pure Roblox Aesthetic.",
    obby: "STYLE: ROBLOX OBBY THUMBNAIL. Neon Parts. ForceField Material effects. High Contrast. Clear studs visibility. Dynamic Motion Lines.",
    horror: "STYLE: ROBLOX HORROR GAME. Dark, Grimy 'Slate' and 'CorrodedMetal' Roblox textures. Spotlight Lighting. Fog. Authentic Roblox Avatar geometry.",
    rpg: "STYLE: ROBLOX RPG. Magic particles. Glowing 'Neon' parts. Detailed Roblox Accessories (Valkyrie, Dominus). Epic scale. God Rays.",
    anime: "STYLE: ROBLOX ANIME BATTLEGROUNDS. 3D Render of Roblox Avatar with Cel-Shading. Particle Emitters. Energy Auras. Sharp Edges.",
    restaurant: "STYLE: ROBLOX RESTAURANT. Warm 'Golden Hour' Lighting. High-Quality Roblox Food Models. 'WoodPlanks' and 'SmoothPlastic' textures. Depth of Field.",
    "high-ctr": "STYLE: VIRAL ROBLOX CLICKBAIT. Maximum Gloss. Brightest Colors. Thick White Outlines (Rim Light) on Avatar. Background Screenshot from Roblox game.",
    shooter: "STYLE: ROBLOX FPS. Tactical Gear on R15 Avatar. Muzzle Flashes. 'Concrete' and 'Metal' textures. First-Person or Over-Shoulder View.",
    tycoon: "STYLE: ROBLOX TYCOON. Isometric View. Conveyor Belts. Droppers. Cash Stacks. Base Building. 'DiamondPlate' and 'Neon' textures."
  };
  return styles[style] || styles.cinematic;
};

const getCameraLensPrompt = (lens: CameraLens): string => {
    switch(lens) {
        case '16mm': return "CAMERA LENS: 16mm FISHEYE. Ultra-wide field of view. Distortion at edges. Dynamic action feel.";
        case '35mm': return "CAMERA LENS: 35mm WIDE ANGLE. Storytelling view. Environment is prominent.";
        case '50mm': return "CAMERA LENS: 50mm PORTRAIT. Natural human eye perspective. Balanced subject/background.";
        case '85mm': return "CAMERA LENS: 85mm TELEPHOTO. Compressed background. Cinematic depth of field. Subject isolation.";
        case '200mm': return "CAMERA LENS: 200mm SUPER-TELEPHOTO. Extreme background compression. Sniper/Spy feel.";
        default: return "";
    }
}

const getColorGradingPrompt = (grade: ColorGrading): string => {
    switch(grade) {
        case 'vibrant': return "COLOR GRADING: HIGH VIBRANCE. Saturated colors. Pop.";
        case 'noir': return "COLOR GRADING: FILM NOIR. High contrast Black and White. Moody.";
        case 'matrix': return "COLOR GRADING: MATRIX. Green tint highlights. Cyberpunk feel.";
        case 'teal-orange': return "COLOR GRADING: HOLLYWOOD TEAL & ORANGE. Blue shadows, orange highlights.";
        case 'vintage': return "COLOR GRADING: VINTAGE. Sepia tones. Faded blacks. Film grain.";
        case 'pastel': return "COLOR GRADING: PASTEL. Soft, light, desaturated dreamy colors.";
        default: return "";
    }
}

const getPhysicsPrompt = (physics: RenderPhysics): string => {
    const shadow = physics.shadowSoftness > 50 ? "SOFT AREA LIGHT SHADOWS" : "HARD RAYTRACED SHADOWS";
    const reflect = physics.reflectionStrength > 50 ? "HIGHLY REFLECTIVE SURFACES (Screen Space Reflections)" : "MATTE SURFACES";
    const dirt = physics.dirtAndScratches > 30 ? "SURFACE IMPERFECTIONS: Scratches, dirt, and wear on materials." : "PRISTINE SURFACES: Clean and new.";
    const gi = physics.globalIllumination ? "GLOBAL ILLUMINATION: ON. Bounce lighting enabled. Color bleeding from environment to character." : "DIRECT LIGHTING ONLY.";
    
    return `RENDER PHYSICS: ${shadow}. ${reflect}. ${dirt} ${gi}`;
}

const getRenderEnginePrompt = (engine: RenderEngine): string => {
    switch (engine) {
        case 'cycles': return "RENDER ENGINE: BLENDER CYCLES. Raytracing. Accurate Reflections on Roblox Materials.";
        case 'eevee': return "RENDER ENGINE: BLENDER EEVEE. Real-time Render. Bloom. Sharp Shadows. Game-accurate look.";
        case 'c4d': return "RENDER ENGINE: CINEMA 4D. Clean MoGraph style. Smooth lighting. High fidelity accessories.";
        case 'studio': return "RENDER ENGINE: ROBLOX STUDIO. Native Screenshot look. Voxel Lighting. ShadowMap Technology. 100% Authentic.";
        default: return "";
    }
};

const getMaterialPrompt = (mat: RobloxMaterial): string => {
    switch (mat) {
        case 'Neon': return "PRIMARY MATERIAL: ROBLOX NEON. Glowing parts. High emission.";
        case 'Glass': return "PRIMARY MATERIAL: ROBLOX GLASS. Reflective, transparent, refractive.";
        case 'ForceField': return "PRIMARY MATERIAL: ROBLOX FORCEFIELD. Animated texture, holographic.";
        case 'Slate': return "PRIMARY MATERIAL: ROBLOX SLATE. Rough stone texture.";
        case 'CorrodedMetal': return "PRIMARY MATERIAL: ROBLOX CORRODED METAL. Rusty, old texture.";
        case 'DiamondPlate': return "PRIMARY MATERIAL: ROBLOX DIAMOND PLATE. Industrial metal texture.";
        case 'Foil': return "PRIMARY MATERIAL: ROBLOX FOIL. Crinkled metallic texture.";
        case 'Ice': return "PRIMARY MATERIAL: ROBLOX ICE. Semi-transparent, frozen texture.";
        case 'WoodPlanks': return "PRIMARY MATERIAL: ROBLOX WOOD PLANKS. Wooden texture.";
        case 'SmoothPlastic': return "PRIMARY MATERIAL: ROBLOX SMOOTH PLASTIC. Clean, shiny, non-textured.";
        case 'Plastic': return "PRIMARY MATERIAL: ROBLOX PLASTIC. Standard studs texture faintly visible.";
        default: return "";
    }
};

const getTimePrompt = (time: TimeOfDay): string => {
    switch (time) {
        case 'Sunrise': return "TIME: SUNRISE. Orange/Pink sky. Long shadows. Golden hour.";
        case 'Noon': return "TIME: NOON. Bright white sun directly above. Short shadows. High visibility.";
        case 'Sunset': return "TIME: SUNSET. Purple/Red sky. Dramatic lighting. Silhouette effects.";
        case 'Midnight': return "TIME: MIDNIGHT. Dark blue sky. Moon lighting. Stars visible.";
        default: return "";
    }
};

const getWeatherPrompt = (weather: Weather): string => {
    switch (weather) {
        case 'Rain': return "WEATHER: RAIN. Wet surfaces. Reflections on ground. Raindrops.";
        case 'Snow': return "WEATHER: SNOW. White snow covering surfaces. Falling snowflakes. Cold atmosphere.";
        case 'Fog': return "WEATHER: FOG. Low visibility distance. Atmospheric haze. Depth.";
        case 'Sandstorm': return "WEATHER: SANDSTORM. Orange tint. Dust particles. Low visibility.";
        case 'AcidRain': return "WEATHER: ACID RAIN. Green tint. Toxic atmosphere. Bubbling pools.";
        default: return "";
    }
};

const getCompositionPrompt = (comp: Composition): string => {
    switch (comp) {
        case 'closeup': return "CAMERA: HEADSHOT ZOOM. Focus on Roblox Face and Hat Accessories. Background Blurred. 1:1 Icon format.";
        case 'waist-shot': return "CAMERA: UPPER BODY SHOT. Showcasing Roblox Shirt/Pants and Hand Item. Standard Portrait.";
        case 'wide-action': return "CAMERA: WIDE DYNAMIC SHOT. Full body R15/R6 pose. Environment visible. Action lines. 16:9 Thumbnail format.";
        case 'isometric': return "CAMERA: ISOMETRIC TOP-DOWN. Strategic view of the map/base.";
        case 'vs-mode': return "CAMERA: VERSUS SPLIT SCREEN. Two Avatars facing off. PvP context.";
        default: return "";
    }
};

const getExpressionPrompt = (exp?: FaceExpression): string => {
    switch (exp) {
        case 'shocked': return "FACE DECAL: ROBLOX SHOCKED EXPRESSION (Mouth Open, Eyes Wide).";
        case 'happy': return "FACE DECAL: ROBLOX WINNING SMILE / CHILL FACE.";
        case 'angry': return "FACE DECAL: ROBLOX ANGRY FACE / GRRR FACE.";
        case 'evil': return "FACE DECAL: ROBLOX VILLAIN FACE / CHECK IT FACE.";
        case 'crying': return "FACE DECAL: ROBLOX SAD FACE / CRYING EYES.";
        case 'sigma': return "FACE DECAL: ROBLOX 'MAN FACE' BUNDLE.";
        case 'silly': return "FACE DECAL: ROBLOX SILLY FUN FACE / YUM FACE.";
        default: return "";
    }
};

const getLightingPrompt = (light?: LightingPreset): string => {
    switch (light) {
        case 'neon-studio': return "LIGHTING: STUDIO NEON. Purple/Blue Rim Lights. Dark Void Background.";
        case 'sun-drenched': return "LIGHTING: DAYLIGHT. Bright Sun. Sharp Shadows. Outdoor Ambience.";
        case 'dark-void': return "LIGHTING: VOID. Single Spotlight. High Contrast. Black Background.";
        case 'god-rays': return "LIGHTING: HEAVENLY. Volumetric Light Beams (SunRays Effect).";
        case 'cyber-punk': return "LIGHTING: FUTURE CITY. Neon Signs reflection. Night time.";
        case 'soft-box': return "LIGHTING: THREE-POINT STUDIO LIGHTING. Soft shadows. Even illumination.";
        default: return "";
    }
};

const getParticlePrompt = (particles?: ParticleEffect): string => {
    switch (particles) {
        case 'sparkles': return "PARTICLES: Roblox 'Sparkles' Texture. Glowing Stars.";
        case 'fire': return "PARTICLES: Roblox 'Fire' Texture. Orange Flames.";
        case 'money': return "PARTICLES: Floating Robux Icons and Cash Stacks.";
        case 'glitch': return "PARTICLES: Digital Glitch Cubes.";
        case 'lightning': return "PARTICLES: Blue Electricity Beams.";
        case 'pet-trail': return "PARTICLES: Trail of Floating Mini-Pets (Cube shaped).";
        case 'hearts': return "PARTICLES: Floating Red Heart Icons.";
        default: return "";
    }
};

const ROBLOX_VISUAL_ELEMENTS = [
    "Floating Cube Pet", "Robux Stack", "Speed Trail Effect", "Admin Command UI", "Neon Jump Pad", "Linked Sword"
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
                "composition": "closeup" | "wide-action" | "isometric" | "waist-shot",
                "material": "Plastic" | "Neon" | "Slate",
                "timeOfDay": "Noon" | "Midnight",
                "weather": "Clear" | "Rain",
                "cameraLens": "35mm" | "85mm",
                "colorGrading": "vibrant" | "noir"
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
// UTILITIES
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
            Task: Expand this idea into a detailed Blender Render prompt using Roblox terminology.
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
      contents: `Make this prompt more "Roblox High-CTR": "${originalPrompt}". Add keywords like "4k", "Blender Cycles", "SmoothPlastic", "R15". Output ONLY the prompt.`,
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
        { text: `Analyze this Roblox GFX. Is it high CTR? Is the Avatar R6 or R15? What game genre is it?` }
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
        { text: `Upscale this Roblox GFX. Keep details sharp. Reduce noise. Maintain Authentic R6/R15 Roblox geometry. Context: ${prompt}` }
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

export const generativeEdit = async (base64Image: string, editInstruction: string): Promise<string> => {
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) throw new Error("Invalid base64");

    const parts = [
        { inlineData: { mimeType: matches[1], data: matches[2] } },
        { text: `[TASK: EDIT ROBLOX IMAGE]
        Input: A Roblox GFX Render.
        Instruction: ${editInstruction}
        Constraints: Maintain the exact same camera angle, character pose, and "Roblox" art style (R6/R15). DO NOT make it photorealistic. DO NOT make it generic 3D. Keep it Roblox.
        Output: The modified Roblox image.` }
    ];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', 
            contents: { parts },
            config: { imageConfig: { aspectRatio: "1:1" } } // 1:1 is safest for edit preservation
        });

        return extractImage(response);
    } catch (e: any) {
        throw new Error(`Edit failed: ${e.message}`);
    }
};

export const generateSegmentationMask = async (base64Image: string): Promise<string> => {
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) throw new Error("Invalid base64");

    const parts = [
        { inlineData: { mimeType: matches[1], data: matches[2] } },
        { text: `Generate a black and white mask for the Roblox Character. White = Character, Black = Background.` }
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
            contents: `Roblox game background. ${prompt}. No characters. Roblox Studio style. Green Screen option possible if requested.`,
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

const getAvatarPrompt = (model: AvatarModel): string => {
    switch (model) {
        case 'R6': return "AVATAR RIG: R6 (Blocky 6-joint). Classic Roblox torso. No elbows. 'Studs' texture on top of head.";
        case 'R15': return "AVATAR RIG: R15 (Segmented 15-part). Modern Roblox joints. Separate feet/hands.";
        case 'Rthro': return "AVATAR RIG: Rthro. Realistic proportions but authentic Roblox plastic texture.";
        case 'Noob': return "AVATAR: CLASSIC NOOB. Bright Yellow Head, Blue Torso, Green Legs. R6 Blocky Rig. Iconic look.";
        case 'Guest': return "AVATAR: CLASSIC GUEST. Black Shirt with Roblox Logo, Blue Jeans, Guest Cap. R6 Rig.";
        case 'Bacon': return "AVATAR: BACON HAIR. Pal Hair, Blue Checked Shirt. Default Roblox Avatar.";
        default: return "AVATAR RIG: R15.";
    }
}

export const generateThumbnail = async (config: ThumbnailConfig): Promise<string> => {
  const modelName = config.model === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';    
  const isHighCtr = config.style === 'high-ctr' || config.style === 'simulator' || config.style === 'obby';
  const isRestaurant = config.style === 'restaurant';
  const isShooter = config.style === 'shooter';

  // NEURAL AUTO-CONFIGURATION
  let effectiveConfig = { ...config };
  
  // Auto-detect settings if 'auto' is selected
  if (config.expression === 'auto' || config.lighting === 'auto' || config.particles === 'auto' || config.pose === 'auto' || config.aspectRatio === 'auto' || config.composition === 'auto' || config.material === 'auto' || config.timeOfDay === 'auto' || config.weather === 'auto' || config.cameraLens === 'auto' || config.colorGrading === 'auto') {
      const inferred = await inferThumbnailConfig(config.prompt);
      
      if (config.expression === 'auto') effectiveConfig.expression = inferred.expression as FaceExpression;
      if (config.lighting === 'auto') effectiveConfig.lighting = inferred.lighting as LightingPreset;
      if (config.particles === 'auto') effectiveConfig.particles = inferred.particles as ParticleEffect;
      if (config.pose === 'auto') effectiveConfig.pose = inferred.pose;
      if (config.aspectRatio === 'auto') effectiveConfig.aspectRatio = (inferred.aspectRatio || "16:9") as AspectRatio;
      if (config.composition === 'auto') effectiveConfig.composition = (inferred.composition || "wide-action") as Composition;
      
      if (config.material === 'auto') effectiveConfig.material = inferred.material as RobloxMaterial;
      if (config.timeOfDay === 'auto') effectiveConfig.timeOfDay = inferred.timeOfDay as TimeOfDay;
      if (config.weather === 'auto') effectiveConfig.weather = inferred.weather as Weather;
      if (config.cameraLens === 'auto') effectiveConfig.cameraLens = (inferred.cameraLens || '35mm') as CameraLens;
      if (config.colorGrading === 'auto') effectiveConfig.colorGrading = (inferred.colorGrading || 'vibrant') as ColorGrading;
  }

  // Fallbacks
  if (effectiveConfig.aspectRatio === 'auto') effectiveConfig.aspectRatio = '16:9';
  if (effectiveConfig.composition === 'auto') effectiveConfig.composition = 'wide-action';
  if (effectiveConfig.cameraLens === 'auto') effectiveConfig.cameraLens = '35mm';
  if (effectiveConfig.colorGrading === 'auto') effectiveConfig.colorGrading = 'none';

  // Specific Overrides for Game Types
  if (isRestaurant && config.lighting === 'auto') effectiveConfig.lighting = 'sun-drenched';
  if (isShooter && config.pose === 'auto') effectiveConfig.pose = 'fighting_stance';

  // ROBLOX ALGORITHM INJECTION LOGIC
  let viralInjection = "";
  if (config.style === 'high-ctr') {
      const randomElement = ROBLOX_VISUAL_ELEMENTS[Math.floor(Math.random() * ROBLOX_VISUAL_ELEMENTS.length)];
      viralInjection = `BACKGROUND ELEMENT: "${randomElement}". AESTHETIC: High Gloss, Smooth Plastic, Vibrant Colors.`;
  }
  
  if (isRestaurant) {
      viralInjection = `DETAILS: Delicious Roblox MeshPart food (Sushi, Boba, Pizza). Warm 'WoodPlanks' and 'Glass' materials.`;
  }
  
  if (isShooter) {
      viralInjection = `DETAILS: Holding tactical Roblox Gear (SCAR/AK-47 Mesh). Muzzle flash. Crosshair UI.`;
  }

  // CHAOS FACTOR (Temperature control via prompt nuance)
  const chaosInstruction = config.chaos > 70 ? "CREATIVITY: MAX. Exaggerated poses. Wild colors. Dynamic camera angles." : "CREATIVITY: BALANCED. Standard Roblox game look.";

  // SCENE INTEGRATION PROMPT (v12.0)
  // This is the key logic to fix "floating avatars"
  const integrationInstruction = `
    [SCENE INTEGRATION: MAX]
    - The avatar MUST BE PHYSICALLY GROUNDED in the environment.
    - CAST CONTACT SHADOWS from the feet/body onto the ground.
    - APPLY AMBIENT OCCLUSION (AO) where the character meets the scene.
    - REFLECTIONS: The scene's environment map must be visible in the reflective parts of the avatar.
    - COLOR BLEED: The lighting color of the environment must tint the avatar's shadows.
    - DO NOT PASTE THE AVATAR ON TOP. INTEGRATE IT.
  `;

  const finalPrompt = `
    [STRICT CONSTRAINT] GENERATE A 3D RENDER OF A ROBLOX GAME. 
    DO NOT GENERATE REAL LIFE HUMAN PHOTOS. DO NOT GENERATE GENERIC 'TOY' CHARACTERS.
    SUBJECT MUST BE AN AUTHENTIC ROBLOX AVATAR.
    
    [SUBJECT] ${getAvatarPrompt(config.avatarModel)} in ${effectiveConfig.pose || 'Action Pose'}.
    
    [SCENE & COMPOSITION] 
    ${config.prompt}
    ${getStylePrompt(config.style)}
    ${getRenderEnginePrompt(config.renderEngine)}
    ${getCompositionPrompt(effectiveConfig.composition)}
    ${getCameraLensPrompt(effectiveConfig.cameraLens)}
    ${getColorGradingPrompt(effectiveConfig.colorGrading)}
    
    [ATMOSPHERE & PHYSICS]
    ${getExpressionPrompt(effectiveConfig.expression)}
    ${getLightingPrompt(effectiveConfig.lighting)}
    ${getParticlePrompt(effectiveConfig.particles)}
    ${getMaterialPrompt(effectiveConfig.material)}
    ${getTimePrompt(effectiveConfig.timeOfDay)}
    ${getWeatherPrompt(effectiveConfig.weather)}
    ${getPhysicsPrompt(config.renderPhysics)}
    
    ${integrationInstruction}
    ${chaosInstruction}
    ${viralInjection}
    
    [NEGATIVE PROMPT] ${config.negativePrompt || "real life, photorealistic human, skin texture, vlog, youtube thumbnail face, human eyes, nose, realistic hands, bad anatomy, text, watermark, 2d, sketch, generic 3d model, action figure joints, organic shape, floating feet, missing shadows"}
  `;

  const parts: any[] = [];
  if (config.referenceImage) {
      const matches = config.referenceImage.match(/^data:(.+);base64,(.+)$/);
      if (matches) parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
      parts.push({ text: "Use this image as the MAIN ROBLOX AVATAR reference. MATCH THE CHARACTER'S CLOTHING AND ACCESSORIES EXACTLY. INTEGRATE THIS CHARACTER INTO THE SCENE LIGHTING." });
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
