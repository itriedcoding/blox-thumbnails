export type ThumbnailStyle = 'cinematic' | 'simulator' | 'obby' | 'horror' | 'rpg' | 'anime' | 'high-ctr';
export type ModelType = 'flash' | 'pro';
export type AvatarModel = 'R15' | 'Rthro';
export type ViewType = 'home' | 'generator' | 'dashboard' | 'terms' | 'privacy';

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

export interface PromptTemplate {
  category: string;
  label: string;
  prompt: string;
  style: ThumbnailStyle;
}