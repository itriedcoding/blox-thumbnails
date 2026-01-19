import { GoogleGenAI } from "@google/genai";
import { ThumbnailConfig, ThumbnailStyle } from "../types";

// ==========================================
// 🚀 NANO BANANA CLUSTER ENGINE (V3.0)
// ==========================================
// This engine manages a pool of 100+ API Keys to provide unlimited throughput.
// It automatically handles rate limits, load balancing, and failover.

// 1. CLUSTER STATE
let keyCursor = 0;
const BLACKLIST_TIMEOUT = 1000 * 60 * 5; // 5 Minutes
const failedKeys = new Map<string, number>();

// 2. KEY INGESTION
const getKeyPool = (): string[] => {
  // Parsing logic for massive key lists (Comma, Newline, or Semicolon separated)
  const rawData = process.env.API_KEY || "";
  const candidates = rawData.split(/[\n,;]+/).map(k => k.trim());
  
  // Strict Validation: Only accept keys that look like Google API Keys
  const validKeys = candidates.filter(k => 
    k.startsWith("AIza") && 
    k.length > 35 && 
    !isKeyBlacklisted(k)
  );

  return validKeys;
};

const isKeyBlacklisted = (key: string): boolean => {
  if (!failedKeys.has(key)) return false;
  const timestamp = failedKeys.get(key) || 0;
  if (Date.now() - timestamp > BLACKLIST_TIMEOUT) {
    failedKeys.delete(key); // Release key back to pool
    return false;
  }
  return true;
};

const blacklistKey = (key: string) => {
  console.warn(`[Cluster] Node Blacklisted due to instability: ${key.substring(0, 8)}...`);
  failedKeys.set(key, Date.now());
};

// 3. LOAD BALANCER (ROUND ROBIN)
const getNextNode = (): string => {
  const pool = getKeyPool();
  
  if (pool.length === 0) {
    // If all keys are blacklisted or missing, throw critical
    if (process.env.API_KEY && failedKeys.size > 0) {
       // Emergency reset if we ran out of keys
       failedKeys.clear();
       return getNextNode();
    }
    throw new Error("CLUSTER_OFFLINE: No active nodes available. Please configure API_KEY.");
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
  // If we have 100 keys, we can retry many times. If 1 key, strict limits.
  const maxRetries = Math.max(3, Math.min(poolSize, 10)); 

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let currentKey = "";
    try {
      currentKey = getNextNode();
      const ai = getAIInstance(currentKey);
      return await operation(ai);
    } catch (error: any) {
      const msg = error.message || '';
      const isAuthError = msg.includes("403") || msg.includes("API key");
      const isQuotaError = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
      const isServerError = msg.includes("503") || msg.includes("500");

      if (isAuthError || isQuotaError || isServerError) {
         console.warn(`[Cluster] Node Failure (${description}): ${msg}. Switching node...`);
         
         // If it's a hard failure (Quota/Auth), blacklist this specific key temporarily
         if (currentKey) blacklistKey(currentKey);
         
         // Continue to next iteration (Next Key)
         continue;
      }
      
      // If it's a prompt safety error or bad request, don't retry
      throw error;
    }
  }
  throw new Error(`Cluster Busy: Unable to complete ${description} after ${maxRetries} node switches.`);
};

// ==========================================
// PUBLIC METHODS
// ==========================================

const getStylePrompt = (style: ThumbnailStyle): string => {
  const styles: Record<ThumbnailStyle, string> = {
    cinematic: "PHOTOREALISTIC CINEMATIC. Unreal Engine 5 level detail. 8K resolution. Raytraced reflections. Volumetric fog. Depth of field (bokeh). The characters must look like high-budget movie assets, not toys. Skin has subsurface scattering. Clothing has realistic fabric textures and folds.",
    simulator: "HIGH-FIDELITY VIBRANCE. Pixar-level rendering. Soft, global illumination. No sharp polygon edges. Everything is smooth and rounded. Textures are high resolution (4K). Bright, cheerful, but physically accurate lighting. Grass and environment must look lush and detailed, not flat.",
    obby: "EXTREME DYNAMICS. Motion blur on edges. High contrast neon lighting against dark backgrounds. The character is performing a dynamic parkour move with realistic anatomy bending (no rigid block joints). Glowing textures with bloom. Reflections on surfaces.",
    horror: "HYPER-REALISTIC HORROR. PBR materials: Rust, dirt, grime, blood, wet surfaces. Cinematic low-key lighting. The character looks genuinely terrified with detailed facial expressions. Volumetric smoke. Film grain. Chromatic aberration. Looks like a Resident Evil cutscene starring a stylized avatar.",
    rpg: "FANTASY EPIC. Particle effects are volumetric and glowing. Armor looks like real metal with scratches and reflections. Magic effects cast real dynamic light on the environment. Atmospheric perspective. Majestic scale.",
    anime: "HIGH-BUDGET ANIME 3D. Like a Arc System Works game (Guilty Gear Strive style). Cell-shaded but with dynamic lighting and rim lights. intense action lines. Glowing auras. The character model is stylized but high-poly, not blocky.",
    "high-ctr": "VIRAL THUMBNAIL AESTHETIC. Maximum texture clarity. Exaggerated but high-quality lighting (Rim lights + Key light). The character pops out from the background. hyper-detailed facial expression. 3D rendered emojis/arrows with glossy textures."
  };
  return styles[style] || styles.cinematic;
};

export const enhancePrompt = async (originalPrompt: string): Promise<string> => {
  return executeOnCluster(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Reword this Roblox GFX prompt for maximum photorealism in Blender/Unreal Engine 5: "${originalPrompt}"`,
    });
    return response.text?.trim() || originalPrompt;
  }, "Prompt Enhancement");
};

export const generateThumbnail = async (config: ThumbnailConfig): Promise<string> => {
  return executeOnCluster(async (ai) => {
    
    const styleKeywords = getStylePrompt(config.style);
    
    // Pro Model for high fidelity, Flash for speed
    const modelName = config.model === 'pro' 
      ? 'gemini-3-pro-image-preview' 
      : 'gemini-2.5-flash-image';

    const finalPrompt = `
      [TASK: GENERATE HYPER-REALISTIC 3D ART]
      Create a stunning 8K resolution 3D render.
      The subject is a stylized character (Roblox-based) but rendered with PHOTOREALISM.

      [SCENE DESCRIPTION]
      ${config.prompt}

      [VISUAL STYLE: ${config.style.toUpperCase()}]
      ${styleKeywords}
      
      [CHARACTER RULES]
      - Use "BENT LIMBS" style (smooth joints, no blocky edges).
      - Realistic fabric textures for clothing.
      - Subsurface scattering for skin.
      - High-emotion facial expression.

      [TECHNICAL]
      - Unreal Engine 5 render.
      - Raytracing enabled.
      - 8K Textures.
      
      [NEGATIVE PROMPT]
      - ${config.negativePrompt || ""}
      - plastic, toy, low poly, pixelated, blur, watermark, text
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
        parts.push({ text: "Use this image as the character reference. Upgrade graphics to 8K photorealism." });
      }
    }
    
    parts.push({ text: finalPrompt });

    const generationConfig: any = {
      imageConfig: {
        aspectRatio: config.aspectRatio,
      },
    };

    if (config.seed) (generationConfig as any).seed = config.seed; 

    // Enable Google Search Tooling ONLY for Pro model
    const tools: any[] = [];
    if (config.model === 'pro') {
      tools.push({ googleSearch: {} }); 
      generationConfig.imageConfig.imageSize = "2K"; 
    }

    console.log(`[Cluster] Job Dispatched to ${modelName} | Node #${keyCursor}`);

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

    throw new Error("Render completed but no visual data returned.");

  }, "Image Generation");
};