
export enum GenerationModel {
  FLASH_IMAGE = 'gemini-2.5-flash-image',
  PRO_IMAGE = 'gemini-3-pro-image-preview',
  IMAGEN_4 = 'imagen-4.0-generate-001'
}

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
export type ImageSize = '1K' | '2K' | '4K';
export type OutputFormat = 'image/png' | 'image/jpeg';

export interface ReferenceImage {
  id: string;
  base64: string;
  mimeType: string;
  previewUrl: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  base64Data?: string; // Stored for multi-turn editing
  mimeType?: string;
  prompt: string;
  model: string;
  timestamp: number;
}

export interface GenerationConfig {
  apiKey?: string;
  model: GenerationModel;
  prompt: string;
  aspectRatio: AspectRatio;
  imageSize?: ImageSize;
  numberOfImages: number;
  outputFormat: OutputFormat;
  googleSearch: boolean;
  referenceImages: ReferenceImage[];
  safetySettings: {
    harassment: boolean;
    hateSpeech: boolean;
                sexuallyExplicit: boolean;
    dangerousContent: boolean;
  };
}
