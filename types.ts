
export type ThumbnailStyle = 'cinematic' | 'simulator' | 'obby' | 'horror' | 'rpg' | 'anime' | 'restaurant' | 'high-ctr' | 'shooter' | 'tycoon';
export type ModelType = 'flash' | 'pro';
export type AvatarModel = 'R6' | 'R15' | 'Rthro';
export type ViewType = 'home' | 'generator' | 'dashboard' | 'terms' | 'privacy' | 'updates';

// New Advanced Controls
export type RenderEngine = 'cycles' | 'eevee' | 'c4d' | 'studio';
export type Composition = 'auto' | 'closeup' | 'waist-shot' | 'wide-action' | 'isometric' | 'vs-mode';

export type FaceExpression = 'auto' | 'default' | 'shocked' | 'happy' | 'angry' | 'evil' | 'crying' | 'sigma' | 'silly';
export type LightingPreset = 'auto' | 'default' | 'neon-studio' | 'sun-drenched' | 'dark-void' | 'god-rays' | 'cyber-punk' | 'soft-box';
export type ParticleEffect = 'auto' | 'none' | 'sparkles' | 'fire' | 'money' | 'glitch' | 'lightning' | 'pet-trail' | 'hearts';
export type AspectRatio = 'auto' | '16:9' | '1:1' | '9:16';

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
}

export type FilterPreset = 'none' | 'matrix' | 'warm' | 'cool' | 'vintage' | 'pixelate' | 'blur';
export type OverlayType = 'none' | 'vignette' | 'scanlines' | 'noise' | 'rain' | 'snow' | 'embers';

// Updated Editor Tool Types
export type EditorTool = 'move' | 'eraser' | 'magic-wand' | 'text' | 'sticker' | 'background' | 'ai-edit';
