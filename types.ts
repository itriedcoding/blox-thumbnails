
export type ThumbnailStyle = 'cinematic' | 'simulator' | 'obby' | 'horror' | 'rpg' | 'anime' | 'restaurant' | 'high-ctr' | 'shooter' | 'tycoon';
export type ModelType = 'flash' | 'pro';
export type AvatarModel = 'R6' | 'R15' | 'Rthro' | 'Noob' | 'Guest' | 'Bacon';
export type ViewType = 'home' | 'generator' | 'dashboard' | 'terms' | 'privacy' | 'updates';

export type RenderEngine = 'cycles' | 'eevee' | 'c4d' | 'studio';
export type Composition = 'auto' | 'closeup' | 'waist-shot' | 'wide-action' | 'isometric' | 'vs-mode';

export type FaceExpression = 'auto' | 'default' | 'shocked' | 'happy' | 'angry' | 'evil' | 'crying' | 'sigma' | 'silly';
export type LightingPreset = 'auto' | 'default' | 'neon-studio' | 'sun-drenched' | 'dark-void' | 'god-rays' | 'cyber-punk' | 'soft-box';
export type ParticleEffect = 'auto' | 'none' | 'sparkles' | 'fire' | 'money' | 'glitch' | 'lightning' | 'pet-trail' | 'hearts';
export type AspectRatio = 'auto' | '16:9' | '1:1' | '9:16';

export type RobloxMaterial = 'auto' | 'Plastic' | 'SmoothPlastic' | 'Neon' | 'Glass' | 'ForceField' | 'Slate' | 'Concrete' | 'CorrodedMetal' | 'DiamondPlate' | 'Foil' | 'Ice' | 'WoodPlanks';
export type TimeOfDay = 'auto' | 'Sunrise' | 'Noon' | 'Sunset' | 'Midnight';
export type Weather = 'auto' | 'Clear' | 'Rain' | 'Snow' | 'Fog' | 'Sandstorm' | 'AcidRain';

// v12.0 New Features
export type CameraLens = 'auto' | '16mm' | '35mm' | '50mm' | '85mm' | '200mm';
export type ColorGrading = 'auto' | 'none' | 'vibrant' | 'noir' | 'matrix' | 'vintage' | 'teal-orange' | 'pastel';
export interface RenderPhysics {
    shadowSoftness: number; // 0-100
    reflectionStrength: number; // 0-100
    dirtAndScratches: number; // 0-100 (Surface Imperfections)
    globalIllumination: boolean;
}

declare global {
  interface AIStudio {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
  }
}

export interface GeneratedImage {
  id: string;
  data: string; // Base64 string
  prompt: string;
  negativePrompt?: string;
  style: ThumbnailStyle;
  model: ModelType;
  avatarModel: AvatarModel;
  renderEngine?: RenderEngine;
  composition?: Composition;
  pose?: string;
  expression?: FaceExpression;
  lighting?: LightingPreset;
  particles?: ParticleEffect;
  material?: RobloxMaterial;
  timeOfDay?: TimeOfDay;
  weather?: Weather;
  cameraLens?: CameraLens;
  colorGrading?: ColorGrading;
  chaos?: number;
  timestamp: number;
  seed?: number;
  isRefined?: boolean;
  parentId?: string; // For Before/After comparison
  analysis?: string; // AI Vision critique
  isFavorite?: boolean;
}

export interface ThumbnailConfig {
  prompt: string;
  negativePrompt?: string;
  referenceImage?: string; // Base64 string
  secondReferenceImage?: string; // Base64 string for 2nd avatar
  aspectRatio: AspectRatio;
  style: ThumbnailStyle;
  model: ModelType;
  avatarModel: AvatarModel;
  renderEngine: RenderEngine;
  composition: Composition;
  pose?: string;
  expression?: FaceExpression;
  lighting?: LightingPreset;
  particles?: ParticleEffect;
  material: RobloxMaterial;
  timeOfDay: TimeOfDay;
  weather: Weather;
  cameraLens: CameraLens;
  colorGrading: ColorGrading;
  renderPhysics: RenderPhysics;
  chaos: number;
  seed?: number;
}

export interface RobloxAvatar {
  username: string;
  userId: number;
  imageUrl: string;
  base64: string;
  model: AvatarModel;
}

export interface RobloxGame {
  id: number; // Universe ID
  rootPlaceId: number;
  name: string;
  description: string;
  playerCount: number;
  visits: number;
  creatorName: string;
  thumbnailUrl?: string; // Fetched separately
  upVotes: number;
  downVotes: number;
}

export interface PromptTemplate {
  label: string;
  category: string;
  style: ThumbnailStyle;
  prompt: string;
}

// New Types for Editor
export interface Sticker {
  id: string;
  content: string; // Emoji or char
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

export type FilterPreset = 'none' | 'matrix' | 'warm' | 'cool' | 'vintage' | 'pixelate' | 'blur';
export type OverlayType = 'none' | 'vignette' | 'scanlines' | 'noise' | 'rain' | 'snow' | 'embers';

// Updated Editor Tool Types
export type EditorTool = 'move' | 'eraser' | 'magic-wand' | 'text' | 'sticker' | 'background' | 'ai-edit';
