import { GoogleGenAI } from "@google/genai";
import { ThumbnailConfig, ThumbnailStyle, ModelType } from "../types";

// ==========================================
// 🚀 NANO BANANA CLUSTER ENGINE (V9.0 - UNLIMITED)
// ==========================================

// 1. CLUSTER STATE
let keyCursor = 0;
const BLACKLIST_TIMEOUT = 1000 * 60 * 1; 
const failedKeys = new Map<string, number>();

// 2. INTELLIGENT KEY INGESTION
const getKeyPool = (): string[] => {
  const rawSources = [
    // 1. Environment Variables (Vite/Next/Node)
    (import.meta as any).env?.VITE_API_KEY,
    (import.meta as any).env?.API_KEY,
    process.env.VITE_API_KEY,
    process.env.API_KEY,
    process.env.NEXT_PUBLIC_API_KEY,
    // 2. Emergency Override (Browser Storage)
    typeof window !== 'undefined' ? localStorage.getItem('bloxthumb_override_key') : null
  ];

  const rawData = rawSources.filter(Boolean).join("\n");

  if (!rawData.trim()) return [];
  
  // Extract AIza keys
  const regex = /AIza[0-9A-Za-z-_]{35}/g;
  let foundKeys: string[] = rawData.match(regex) || [];

  if (foundKeys.length === 0) {
      // Fallback: simple split if regex fails but data looks valid
      foundKeys = rawData.split(/[\n,;\s]+/).filter(k => k.startsWith("AIza") && k.length >= 39);
  }
  
  const uniqueKeys = Array.from(new Set(foundKeys));
  const activeKeys = uniqueKeys.filter(k => !isKeyBlacklisted(k));

  if (uniqueKeys.length > 0 && activeKeys.length === 0) {
      console.warn("[Cluster] All nodes exhausted. Initiating Emergency Reset...");
      failedKeys.clear();
      return uniqueKeys;
  }

  return activeKeys;
};

const isKeyBlacklisted = (key: string): boolean => {
  if (!failedKeys.has(key)) return false;
  const timestamp = failedKeys.get(key) || 0;
  if (Date.now() - timestamp > BLACKLIST_TIMEOUT) {
    failedKeys.delete(key); 
    return false;
  }
  return true;
};

const blacklistKey = (key: string, reason: string) => {
  console.warn(`[Cluster] Node Blacklisted (${reason}): ${key.substring(0, 8)}...`);
  failedKeys.set(key, Date.now());
};

const getNextNode = (): string => {
  const pool = getKeyPool();
  if (pool.length === 0) {
    throw new Error("CLUSTER_OFFLINE: No Valid API Keys found. Please check your .env file.");
  }
  const key = pool[keyCursor % pool.length];
  keyCursor++;
  return key;
};

export const getActiveNodeCount = (): number => {
  return getKeyPool().length;
};

const getAIInstance = (specificKey?: string) => {
  const apiKey = specificKey || getNextNode();
  return new GoogleGenAI({ apiKey });
};

// ==========================================
// EXECUTION PIPELINE
// ==========================================

const executeOnCluster = async <T>(
  operation: (ai: GoogleGenAI) => Promise<T>, 
  description: string
): Promise<T> => {
  const poolSize = getKeyPool().length;
  // Fail fast if we only have 1 key, otherwise rotate
  const maxRetries = poolSize === 1 ? 5 : Math.min(poolSize * 2, 10); 

  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let currentKey = "";
    try {
      currentKey = getNextNode();
      const ai = getAIInstance(currentKey);
      return await operation(ai);
    } catch (error: any) {
      lastError = error;
      const msg = error.message || '';
      
      const isAuthError = msg.includes("403") || msg.includes("API key");
      const isLeakedKey = msg.includes("leaked");
      const isQuotaError = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
      const isServerOverload = msg.includes("503") || msg.includes("500") || msg.includes("overloaded");

      // INTERNAL RATE LIMIT HANDLING (Invisible to user)
      const retryMatch = msg.match(/retry in (\d+(\.\d+)?)s/);
      
      if (retryMatch || isQuotaError) {
         let waitTime = 2000; 
         if (retryMatch) {
             waitTime = parseFloat(retryMatch[1]) * 1000 + 1000; 
         } else {
             waitTime = attempt * 1500;
         }

         console.warn(`[Cluster] Rate Limit hit on Node. Retrying internally in ${(waitTime/1000).toFixed(1)}s...`);
         
         await new Promise(resolve => setTimeout(resolve, waitTime));
         
         if (poolSize > 1) {
             continue; // Rotate to next key
         } else {
             // If single key, just retry same key after wait
             continue; 
         }
      }

      if (isAuthError) {
         if (isLeakedKey) {
             blacklistKey(currentKey, "KEY LEAKED");
         } else if (msg.includes("API key not valid") || msg.includes("deleted") || msg.includes("project not found")) {
             blacklistKey(currentKey, "Invalid Key");
         } else {
             console.warn(`[Cluster] Auth Error. Retrying...`);
         }
         
         if (poolSize === 1 && attempt === maxRetries) throw error;
         continue;
      }
      
      if (isServerOverload) {
         await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
         continue;
      }
      
      // For other errors, throw immediately unless it's a transient network issue
      if (!msg.includes("fetch")) throw error;
    }
  }
  
  throw new Error(`Generation Failed: ${description}. Error: ${lastError?.message || "Unknown"}`);
};

// ==========================================
// NANO BANANA GENERATION LOGIC
// ==========================================

const getStylePrompt = (style: ThumbnailStyle): string => {
  const styles: Record<ThumbnailStyle, string> = {
    cinematic: "PHOTOREALISTIC CINEMATIC. Unreal Engine 5. Nanite geometry. Lumen lighting. 8K textures. Depth of Field. Color Graded.",
    simulator: "HIGH-FIDELITY VIBRANCE. Pixar-style rendering. Smooth shading. Ambient Occlusion. Bright, saturated colors. Soft shadows.",
    obby: "NEON PARKOUR. High contrast. Emission shaders. Motion blur. Dynamic perspective. Glowing edges.",
    horror: "REALISTIC HORROR. PBR materials (wet, dirt, grunge). Volumetric fog. Low-key lighting. Film grain.",
    rpg: "FANTASY EPIC. Particle effects. Magic glows. Metallic reflections. Atmospheric perspective.",
    anime: "GUILTY GEAR STRIVE STYLE. Cel-shaded 3D. Dynamic rim lighting. Action lines. Vibrant effects.",
    "high-ctr": "YOUTUBE VIRAL. Hyper-saturated. Exaggerated expressions. High contrast. Glossy textures. 3D Emojis."
  };
  return styles[style] || styles.cinematic;
};

export const enhancePrompt = async (originalPrompt: string): Promise<string> => {
  if (getActiveNodeCount() === 0) return originalPrompt;

  // Enhance uses Flash
  return executeOnCluster(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Enhance this Roblox GFX prompt for a PHOTOREALISTIC 3D RENDER in Blender/Unreal Engine 5: "${originalPrompt}"`,
    });
    return response.text?.trim() || originalPrompt;
  }, "Prompt Enhancement").catch(e => {
      console.warn("Enhancement failed, returning original.", e);
      return originalPrompt;
  });
};

const runGeneration = async (config: ThumbnailConfig, modelOverride: ModelType): Promise<string> => {
    return executeOnCluster(async (ai) => {
    
    // Select Model
    const modelName = modelOverride === 'pro' 
      ? 'gemini-3-pro-image-preview' 
      : 'gemini-2.5-flash-image';    

    const finalPrompt = `
      [TASK]
      Render a Hyper-Realistic 3D Roblox Game Thumbnail (8K Resolution).
      
      [SCENE]
      ${config.prompt}
      
      [STYLE: ${config.style.toUpperCase()}]
      ${getStylePrompt(config.style)}
      
      [TECHNICAL REQUIREMENTS]
      - Engine: Unreal Engine 5 / Blender Cycles
      - Lighting: Raytraced Global Illumination
      - Avatar: ${config.avatarModel === 'Rthro' ? 'Realistic Rthro (Human proportions)' : 'High-Poly R15 (Rounded bevels)'}
      - NO: Plastic toy look, studs, low-poly jagged edges, blur.
      - YES: Subsurface scattering on skin, realistic fabric cloth simulation.
      
      [NEGATIVE PROMPT]
      ${config.negativePrompt || ""}
      low quality, jpeg artifacts, watermark, text overlay, ui, hud, pixelated
    `;

    const parts: any[] = [];

    if (config.referenceImage) {
      // Check if it's a URL or Base64
      if (config.referenceImage.startsWith('http')) {
         // It's a URL, we need to fetch it first or pass it if the model supported URLs (Gemini doesn't directly support URL parts for images usually, better to pass base64)
         // Assuming the generator component converts everything to base64 before calling this service.
         // If we happen to get a URL here, we'll try to add it as text context, but it's not ideal.
         parts.push({ text: `Reference Image URL: ${config.referenceImage}` });
      } else {
          const matches = config.referenceImage.match(/^data:(.+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            parts.push({
              inlineData: {
                mimeType: matches[1],
                data: matches[2],
              },
            });
            parts.push({ text: "Use this image as the composition reference. Upgrade visual fidelity to 8K." });
          }
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
    if (modelOverride === 'pro') {
      tools.push({ googleSearch: {} }); 
      generationConfig.imageConfig.imageSize = "2K"; 
    }

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

    throw new Error("Render complete, but output was empty. Try a different prompt.");

  }, `Image Gen (${modelOverride})`);
}

export const generateThumbnail = async (config: ThumbnailConfig): Promise<string> => {
  // ATTEMPT 1: Try requested model
  try {
     return await runGeneration(config, config.model);
  } catch (e: any) {
     const msg = e.message || "";
     // ATTEMPT 2: Fallback to flash if Pro fails
     if (config.model === 'pro' && (msg.includes("403") || msg.includes("400") || msg.includes("API key"))) {
         console.warn("⚠️ PRO MODEL FAILED. AUTO-DOWNGRADING TO FLASH.");
         return await runGeneration(config, 'flash');
     }
     throw e;
  }
};