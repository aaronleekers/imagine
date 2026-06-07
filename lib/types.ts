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
    description: 'Image-to-video and text-to-video generation',
  },
  {
    id: 'minimax/video-01',
    name: 'Hailuo Video-01',
    provider: 'MiniMax',
    description: '5-second video generation (via MiniMax API)',
  },
  {
    id: 'minimax/video-02',
    name: 'Hailuo Video-02',
    provider: 'MiniMax',
    description: 'Latest MiniMax video model (via MiniMax API)',
  },
  {
    id: 'runway/gen-4',
    name: 'Gen-4',
    provider: 'Runway',
    description: 'High-quality video (needs RUNWAY_API_KEY)',
  },
  {
    id: 'runway/gen-3-turbo',
    name: 'Gen-3 Turbo',
    provider: 'Runway',
    description: 'Fast video (needs RUNWAY_API_KEY)',
  },
  {
    id: 'kling/v2.1',
    name: 'Kling 2.1',
    provider: 'Kling',
    description: 'High-fidelity video (needs KLING_API_KEY)',
  },
  {
    id: 'luma/ray-2',
    name: 'Ray 2',
    provider: 'Luma',
    description: 'Cinematic video (needs LUMA_API_KEY)',
  },
  {
    id: 'pika/pika-2.2',
    name: 'Pika 2.2',
    provider: 'Pika',
    description: 'Creative video (needs PIKA_API_KEY)',
  },
]

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
