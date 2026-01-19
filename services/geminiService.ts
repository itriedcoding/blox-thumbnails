import { GoogleGenAI } from "@google/genai";
import { ThumbnailConfig, ThumbnailStyle } from "../types";

// ==========================================
// 🚀 NANO BANANA CLUSTER ENGINE (V6.0 - UNLIMITED)
// ==========================================
// - Injected Community Keys (Instant Start)
// - Deep Environment Scanning
// - Auto-Healing Neural Mesh
// - Unlimited Throughput Load Balancer

// 1. CLUSTER STATE
let keyCursor = 0;
const BLACKLIST_TIMEOUT = 1000 * 60 * 1; // Reduced to 1 Minute for faster cycling
const failedKeys = new Map<string, number>();

// 2. INTELLIGENT KEY INGESTION
const getKeyPool = (): string[] => {
  // DEEP SCAN: Check all possible environment locations for keys
  // Added the specific user-provided key as a primary source
  const rawSources = [
    "AIzaSyDtoJH6iCdc9zlm5dpmaqFt9CMrET5S0ag", // Primary Community Node
    process.env.API_KEY,
    process.env.VITE_API_KEY,
    process.env.NEXT_PUBLIC_API_KEY,
    (import.meta as any).env?.VITE_API_KEY,
    (import.meta as any).env?.API_KEY
  ];

  // Combine all sources into one massive block
  const rawData = rawSources.filter(Boolean).join("\n");

  if (!rawData.trim()) {
      return [];
  }
  
  // STRATEGY A: Google Key Regex (Strict & Accurate)
  const regex = /AIza[0-9A-Za-z-_]{35}/g;
  let foundKeys: string[] = rawData.match(regex) || [];

  // STRATEGY B: Permissive Fallback
  if (foundKeys.length === 0) {
      foundKeys = rawData.split(/[\n,;\s]+/).filter(k => k.startsWith("AIza") && k.length >= 39);
  }
  
  // Remove duplicates and blacklisted keys
  const uniqueKeys = Array.from(new Set(foundKeys));
  const activeKeys = uniqueKeys.filter(k => !isKeyBlacklisted(k));

  // EMERGENCY AUTO-HEALING
  // If we have keys but all are blacklisted, reset the blacklist immediately to prevent total lockout.
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

// 3. LOAD BALANCER
const getNextNode = (): string => {
  const pool = getKeyPool();
  
  if (pool.length === 0) {
    throw new Error("CLUSTER_OFFLINE: No API Keys detected. Please add 'AIza...' keys to your API_KEY environment variable.");
  }

  // Round Robin Selection
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
  // ROBUSTNESS UPGRADE: Increased minimum retries to 5 to handle single-key rate limits gracefully
  const maxRetries = Math.max(5, Math.min(poolSize * 3, 15)); 

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
      const isQuotaError = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
      const isServerOverload = msg.includes("503") || msg.includes("500") || msg.includes("overloaded");

      if (isAuthError || isQuotaError || isServerOverload) {
         if (currentKey) {
             const reason = isAuthError ? "Auth Fail" : isQuotaError ? "Quota Limit" : "Server Error";
             // Only blacklist on hard auth errors, soften the blow for quota
             if (isAuthError) blacklistKey(currentKey, reason);
             else console.warn(`[Cluster] Node Busy (${reason}). Retrying...`);
         }
         
         // Exponential Backoff for stability
         const delay = attempt * 1000;
         await new Promise(resolve => setTimeout(resolve, delay));
         
         continue; // Retry loop
      }
      
      throw error; 
    }
  }
  
  throw new Error(`Cluster Failed: ${description} could not be completed after ${maxRetries} attempts. Last error: ${lastError?.message || "Unknown"}`);
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

  return executeOnCluster(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Enhance this Roblox GFX prompt for a PHOTOREALISTIC 3D RENDER in Blender/Unreal Engine 5: "${originalPrompt}"`,
    });
    return response.text?.trim() || originalPrompt;
  }, "Prompt Enhancement");
};

export const generateThumbnail = async (config: ThumbnailConfig): Promise<string> => {
  return executeOnCluster(async (ai) => {
    
    const modelName = config.model === 'pro' 
      ? 'gemini-3-pro-image-preview' // Pro (High Quality)
      : 'gemini-2.5-flash-image';    // Flash (Fast / Nano Banana)

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

    // Pro Model Capabilities - Search Enabled
    const tools: any[] = [];
    if (config.model === 'pro') {
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

  }, "Image Generation");
};