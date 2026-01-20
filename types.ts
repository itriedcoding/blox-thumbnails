export type ThumbnailStyle = 'cinematic' | 'simulator' | 'obby' | 'horror' | 'rpg' | 'anime' | 'high-ctr';
export type ModelType = 'flash' | 'pro';
export type AvatarModel = 'R6' | 'R15' | 'Rthro';
export type ViewType = 'home' | 'generator' | 'dashboard' | 'top-games' | 'terms' | 'privacy';

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
  pose?: string;
  timestamp: number;
  seed?: number;
  isRefined?: boolean;
}

export interface ThumbnailConfig {
  prompt: string;
  negativePrompt?: string;
  referenceImage?: string; // Base64 string
  secondReferenceImage?: string; // Base64 string for 2nd avatar
  aspectRatio: "16:9" | "1:1" | "9:16";
  style: ThumbnailStyle;
  model: ModelType;
  avatarModel: AvatarModel;
  pose?: string;
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

export type FilterPreset = 'none' | 'matrix' | 'warm' | 'cool' | 'vintage';
export type OverlayType = 'none' | 'vignette' | 'scanlines' | 'noise';