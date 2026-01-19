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
    cinematic: "MASTERPIECE CGI RENDER. Unreal Engine 5.4. Path Traced. Cinematic Lighting (Rembrandt). Volumetric Fog. Anamorphic Lens Flares. 8K UHD. High Poly Nanite Meshes. Subsurface Scattering on Skin. Raytraced Reflections. Color Graded (Teal & Orange). Hyper-Detailed Textures. NO PLASTIC LOOK.",
    simulator: "PIXAR MOVIE QUALITY. High-Fidelity Vibrance. Smooth Shading. Ambient Occlusion. Global Illumination. Bright, saturated colors. Soft shadows. Commercial Polish. Detailed textures on surfaces. No jagged edges.",
    obby: "RETROWAVE NEON. High contrast. Emission shaders. Motion blur. Dynamic perspective. Glowing edges. Cyberpunk aesthetic. Smooth geometry. Reflection probes.",
    horror: "REALISTIC HORROR. PBR materials (wet, dirt, grunge). Volumetric fog. Low-key lighting. Film grain. Chromatic aberration. Unsettling atmosphere. Hyper-detailed textures. Raytraced shadows.",
    rpg: "FANTASY EPIC. Particle effects. Magic glows. Metallic reflections. Atmospheric perspective. God rays. Detailed armor textures. Cinematic lighting. Fantasy landscape background.",
    anime: "GUILTY GEAR STRIVE STYLE. Cel-shaded 3D. Dynamic rim lighting. Action lines. Vibrant effects. 2.5D Composition. High definition. Crisp lines.",
    "high-ctr": "YOUTUBE VIRAL THUMBNAIL. Hyper-saturated. Exaggerated expressions. High contrast. Glossy textures. 3D Emojis. Clickbait Composition. Rendered in 8K. Sharp focus."
  };
  return styles[style] || styles.cinematic;
};

export const enhancePrompt = async (originalPrompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a World-Class Creative Director for High-End Game Art.
      
      Your task is to take a basic user idea and transform it into a PRODUCTION-READY 3D RENDER PROMPT.
      
      Input: "${originalPrompt}"
      
      Instructions:
      1. EXPAND on the scene. Add environmental details (weather, time of day, background objects).
      2. DEFINE the lighting specifically (e.g., "volumetric morning sun", "neon cyberpunk rim lights", "dramatic three-point lighting").
      3. DEFINE the camera (e.g., "low angle hero shot", "dynamic wide angle fisheye", "close-up macro").
      4. ADD texture keywords (e.g., "4k pbr", "raytraced reflections", "subsurface scattering on skin").
      5. KEEP the core subject intact but make it sound epic.
      6. CRITICAL: Ensure the description calls for a HIGH-FIDELITY 3D RENDER. Avoid "blocky" or "lego" terms. Use "smooth", "detailed", "high-poly".
      
      Output ONLY the final enhanced prompt string. Do not add intro/outro text.`,
    });
    return response.text?.trim() || originalPrompt;
  } catch (e) {
    console.warn("Enhancement failed:", e);
    return originalPrompt;
  }
};

export const generateThumbnail = async (config: ThumbnailConfig): Promise<string> => {
  // Select Model
  const modelName = config.model === 'pro' 
    ? 'gemini-3-pro-image-preview' 
    : 'gemini-2.5-flash-image';    

  let avatarDesc = "";
  if (config.avatarModel === 'Rthro') {
    avatarDesc = 'Hyper-Realistic Humanoid (Rthro), detailed skin pores, realistic hair strands, cloth simulation, human proportions, cinematic lighting';
  } else if (config.avatarModel === 'R15') {
    avatarDesc = 'High-Fidelity 3D Character (R15), bevelled edges, subsurface scattering on materials, NO visible studs, NO plastic seams, smooth joints, semi-realistic style';
  } else {
    // R6
    avatarDesc = 'Stylized Classic 3D Character (R6), but rendered with high-end CGI materials. Smooth bends (blender rig style), no sharp polygon edges, glowing textures, ambient occlusion, polished finish.';
  }

  const finalPrompt = `
    [TASK]
    Render a Hyper-Realistic 3D Roblox Game Thumbnail (8K Resolution).
    IMPORTANT: The output must look like a high-end CGI movie render (Pixar/Dreamworks level) or Unreal Engine 5 tech demo. 
    AVOID the "classic lego toy" look. Characters should have realistic proportions, detailed skin/material textures, and smooth geometry.
    
    [SCENE DESCRIPTION]
    ${config.prompt}
    
    [CHARACTERS]
    ${config.secondReferenceImage ? "The scene MUST feature TWO characters interacting." : "The scene features the main character."}
    ${config.pose ? `Action/Pose: ${config.pose}. Ensure the pose looks natural and dynamic, avoiding stiff 'toy' joints.` : "Dynamic composition."}
    
    [MATERIAL OVERRIDE - CRITICAL]
    - SKIN: Convert plastic skin to REALISTIC HUMAN SKIN with subsurface scattering (SSS) and pore detail.
    - CLOTHING: Convert blocky textures to SIMULATED FABRIC with folds, stitching, and high-res normal maps.
    - JOINTS: SMOOTH OUT all limb connections. Do not show robotic joints or gaps. The character must look like a cohesive 3D model, not a toy.
    - EYES: Use high-quality glossy shaders for eyes with reflections.
    
    [ART STYLE: ${config.style.toUpperCase()}]
    ${getStylePrompt(config.style)}
    
    [TECHNICAL SPECIFICATIONS]
    - Engine: Unreal Engine 5.3 Path Tracing
    - Global Illumination: Lumen / Raytraced
    - Geometry: Nanite High-Poly Meshes (No visible polygons)
    - Avatar Appearance: ${avatarDesc}
    - Materials: 4K PBR Textures, Displacement maps, Fresnel reflections, Subsurface Scattering
    - Post-Processing: ACES Color Profile, Depth of Field, volumetric fog, motion blur, bloom.
    
    [NEGATIVE PROMPT]
    ${config.negativePrompt || ""}
    lego, lego blocks, plastic studs, toy-like, rigid joints, low poly, pixelated, blurry, flat lighting, simple textures, distorted faces, jpeg artifacts, watermark, text overlay, ui, hud, plastic skin, doll-like, jagged edges, low resolution, artifacts, blurry background, blocky hands, square torso
  `;

  const parts: any[] = [];

  // 1. First Avatar
  if (config.referenceImage) {
    if (config.referenceImage.startsWith('http')) {
       parts.push({ text: `Reference Image URL (Main Character): ${config.referenceImage}` });
       parts.push({ text: "Use the character from this URL as the MAIN SUBJECT. Adapt them to the requested HIGH-FIDELITY style." });
    } else {
        const matches = config.referenceImage.match(/^data:(.+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2],
            },
          });
          parts.push({ text: "Use this image as the MAIN CHARACTER reference. Adapt the character to the requested HIGH-FIDELITY art style (remove plastic look, smooth joints, realistic materials)." });
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
        parts.push({ text: "Use this image as the SECOND CHARACTER reference. Place them next to or interacting with the main character. Adapt to HIGH-FIDELITY style." });
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
    // Simple fallback logic if pro fails
    if (config.model === 'pro' && error.message?.includes('403')) {
        console.warn("Pro model failed, retrying with Flash...");
        return generateThumbnail({...config, model: 'flash'});
    }
    throw new Error(`Generation failed: ${error.message}`);
  }
};