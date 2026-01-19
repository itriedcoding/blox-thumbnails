import { GoogleGenAI } from "@google/genai";
import { ThumbnailConfig, ThumbnailStyle, ModelType } from "../types";

// ==========================================
// 🚀 NANO BANANA CLUSTER ENGINE (V8.2 - SECURITY PATCH)
// ==========================================
// - Removed Compromised Nodes
// - Added LocalStorage Override (Emergency Key Injection)
// - Enhanced Error Telemetry for Leaked Keys
// - Auto-Downgrade Protection

// 1. CLUSTER STATE
let keyCursor = 0;
const BLACKLIST_TIMEOUT = 1000 * 60 * 1; 
const failedKeys = new Map<string, number>();

// Track global cooldown to update UI
let globalCooldownEnd = 0;
export const getCooldownStatus = (): number => {
    const remaining = globalCooldownEnd - Date.now();
    return remaining > 0 ? remaining : 0;
};

// 2. INTELLIGENT KEY INGESTION
const getKeyPool = (): string[] => {
  const rawSources = [
    // 1. Emergency Override (Browser Storage) - Highest Priority for quick fixes
    typeof window !== 'undefined' ? localStorage.getItem('bloxthumb_override_key') : null,
    
    // 2. Environment Variables
    process.env.API_KEY,
    process.env.VITE_API_KEY,
    process.env.NEXT_PUBLIC_API_KEY,
    (import.meta as any).env?.VITE_API_KEY,
    (import.meta as any).env?.API_KEY
  ];

  const rawData = rawSources.filter(Boolean).join("\n");

  if (!rawData.trim()) return [];
  
  const regex = /AIza[0-9A-Za-z-_]{35}/g;
  let foundKeys: string[] = rawData.match(regex) || [];

  if (foundKeys.length === 0) {
      // Fallback: try splitting by newlines/commas if regex fails but data exists
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
    throw new Error("CLUSTER_OFFLINE: No Valid API Keys found. Please update .env or use the Emergency Input.");
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
  // If we only have 1 key, we must be patient. If many, we can fail fast and rotate.
  const maxRetries = poolSize === 1 ? 8 : Math.max(5, Math.min(poolSize * 3, 15)); 

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

      // SMART RATE LIMIT BYPASS
      const retryMatch = msg.match(/retry in (\d+(\.\d+)?)s/);
      
      if (retryMatch || isQuotaError) {
         let waitTime = 2000; 
         if (retryMatch) {
             waitTime = parseFloat(retryMatch[1]) * 1000 + 1000; 
         } else {
             waitTime = attempt * 2000;
         }

         console.warn(`[Cluster] Rate Limit Hit via Node ${currentKey.substring(0,6)}... Cooling down for ${(waitTime/1000).toFixed(1)}s`);
         
         globalCooldownEnd = Date.now() + waitTime;
         
         await new Promise(resolve => setTimeout(resolve, waitTime));
         
         if (poolSize > 1) {
             continue; // Rotate
         } else {
             attempt--; // Don't count waiting as a failed attempt for single key
             continue; // Retry same key
         }
      }

      if (isAuthError) {
         if (isLeakedKey) {
             blacklistKey(currentKey, "KEY LEAKED");
             // If this was our only key, we need to stop immediately and ask for a new one
             if (getActiveNodeCount() === 0) {
                 throw new Error("SECURITY ALERT: API Key was reported as leaked by Google. Please generate a new key at aistudio.google.com");
             }
         } else if (msg.includes("API key not valid") || msg.includes("deleted") || msg.includes("project not found")) {
             blacklistKey(currentKey, "Invalid Key");
         } else {
             console.warn(`[Cluster] Auth/Billing Error on Node ${currentKey.substring(0,8)}. Key retained for fallback.`);
         }
         
         // Throw immediately so we can trigger the model fallback logic in generateThumbnail
         // unless we have other keys to try
         if (poolSize === 1) throw error;
         continue;
      }
      
      if (isServerOverload) {
         await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
         continue;
      }
      
      throw error; 
    }
  }
  
  throw new Error(`Cluster Failed: ${description} could not be completed. Last error: ${lastError?.message || "Unknown"}`);
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

  // Enhance uses Flash, so it should be safe on free tier
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

    console.log(`[Cluster] Request sent to ${modelName} via Node #${keyCursor}`);

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
     // ATTEMPT 2: If Pro failed due to Auth/Billing/Quota, fallback to Flash
     if (config.model === 'pro' && (msg.includes("403") || msg.includes("400") || msg.includes("API key"))) {
         console.warn("⚠️ PRO MODEL FAILED (BILLING/AUTH). AUTO-DOWNGRADING TO FLASH FREE TIER. ⚠️");
         return await runGeneration(config, 'flash');
     }
     throw e;
  }
};