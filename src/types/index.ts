export interface Message {
  role: "user" | "model" | string;
  txt?: string; // The markdown text
  images?: string[]; // Array of local paths or object URLs
  characterId?: number;
  isSystem?: boolean;
  isImageRequest?: boolean; // True if it triggered image generation
  imagePrompt?: string; // The derived SD prompt used to generate this image
  imageParams?: any; // The derived SD params
  sampler_name?: string; // The specific sampler name used
}

export interface Chat {
  id: number;
  title: string;
  timestamp: number;
  content: Message[];
  characterId?: number | null;
}

export interface Character {
  id: number;
  name: string;
  description: string;
  prompt: string;
  relationship?: string;
  appearance?: string;
  appearanceImages?: string[];
  avatar?: string;
  gallery?: string[];
}

export interface UserProfile {
  name: string;
  bio: string;
}

export interface AISafetySettings {
  harassment: string;
  hate_speech: string;
  sexual: string;
  dangerous: string;
}
