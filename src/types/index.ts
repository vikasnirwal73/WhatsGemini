export interface Message {
  role: "user" | "model" | string;
  txt?: string; // The markdown text
  characterId?: number;
  isSystem?: boolean;
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
  avatar?: string;
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
