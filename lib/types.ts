export interface GeneratedImage {
  id: string
  url: string
  prompt: string
  model: string
  timestamp: number
  width?: number
  height?: number
}

export interface ImageModel {
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
    description: 'Latest flagship image model — highest quality',
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
    description: 'Fast and efficient image generation',
  },
  {
    id: 'google/gemini-3.1-flash-image-preview',
    name: 'Gemini 3.1 Flash Image',
    provider: 'Google',
    description: 'Fast image generation with Gemini',
  },
  {
    id: 'google/gemini-3-pro-image-preview',
    name: 'Gemini 3 Pro Image',
    provider: 'Google',
    description: 'Pro-level image generation with Gemini',
  },
  {
    id: 'google/gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash Image',
    provider: 'Google',
    description: 'Efficient image generation with Gemini',
  },
]

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
