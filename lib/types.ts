export interface GeneratedImage {
  id: string
  url: string
  prompt: string
  model: string
  timestamp: number
  width?: number
  height?: number
}

export interface GeneratedVideo {
  id: string
  url: string
  prompt: string
  sourceImageUrl: string
  model: string
  timestamp: number
}

export interface ImageModel {
  id: string
  name: string
  provider: string
  description: string
}

export interface VideoModel {
  id: string
  name: string
  provider: string
  description: string
}

export const IMAGE_MODELS: ImageModel[] = [
  {
    id: 'openai/gpt-5.4-image-2',
    name: 'GPT-5.4 Image 2',
    provider: 'OpenAI',
    description: 'Latest flagship — highest quality, photorealistic',
  },
  {
    id: 'openai/gpt-5-image',
    name: 'GPT-5 Image',
    provider: 'OpenAI',
    description: 'High-quality image generation',
  },
  {
    id: 'openai/gpt-5-image-mini',
    name: 'GPT-5 Image Mini',
    provider: 'OpenAI',
    description: 'Fast, efficient image generation',
  },
  {
    id: 'google/gemini-3-pro-image-preview',
    name: 'Gemini 3 Pro Image',
    provider: 'Google',
    description: 'Pro-level image generation with Gemini',
  },
  {
    id: 'google/gemini-3.1-flash-image-preview',
    name: 'Gemini 3.1 Flash Image',
    provider: 'Google',
    description: 'Fast image gen — Nano Banana 2',
  },
  {
    id: 'google/gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash Image',
    provider: 'Google',
    description: 'Efficient image gen — Nano Banana',
  },
]

export const VIDEO_MODELS: VideoModel[] = [
  {
    id: 'x-ai/grok-imagine-video',
    name: 'Grok Imagine Video',
    provider: 'xAI',
    description: 'Image-to-video generation',
  },
  {
    id: 'x-ai/grok-imagine-image-quality',
    name: 'Grok Imagine Image Quality',
    provider: 'xAI',
    description: 'High-quality image-to-video',
  },
  {
    id: 'kwaivgi/kling-video-o1',
    name: 'Kling Video O1',
    provider: 'Kling',
    description: 'Latest Kling video generation',
  },
  {
    id: 'kwaivgi/kling-v3.0-pro',
    name: 'Kling 3.0 Pro',
    provider: 'Kling',
    description: 'Pro-level video generation',
  },
  {
    id: 'kwaivgi/kling-v3.0-std',
    name: 'Kling 3.0 Standard',
    provider: 'Kling',
    description: 'Fast video generation',
  },
]

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
