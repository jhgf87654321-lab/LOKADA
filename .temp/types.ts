
export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export type ViewState = 'main' | 'gallery' | 'auth';

export interface Message {
  role: Role;
  text: string;
  isGenerating?: boolean;
  suggestions?: string[];
}

export interface ImageAsset {
  id: string;
  url: string;
  alt: string;
  timestamp: number;
}

export interface DesignState {
  beforeUrl: string;
  afterUrl: string;
  material: string;
  colorScheme: string;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  avatar: string;
}
