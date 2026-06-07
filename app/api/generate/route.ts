import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_COUNT = 6
const DEFAULT_IMAGE_MODEL = 'openai/gpt-5.4-image-2'

// Grok chat models that enhance prompts (text-only, cannot output images directly)
const ENHANCER_MODELS = new Set([
  'x-ai/grok-4.3',
  'x-ai/grok-4.20',
])

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
    'X-Title': 'Imagine',
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, model, count: rawCount } = await req.json()
    const count = Math.max(1, Math.min(6, Number(rawCount) || DEFAULT_COUNT))

    if (!prompt || !model) {
      return NextResponse.json({ error: 'Prompt and model are required' }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
    }

    // Determine effective image model and whether to enhance
    const isEnhancer = ENHANCER_MODELS.has(model)
    const imageModel = isEnhancer ? DEFAULT_IMAGE_MODEL : model
    let finalPrompt = prompt

    if (isEnhancer) {
      // Step 1: Have Grok enhance the prompt
      try {
        const enhanceRes = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: 'You are a creative director for AI image generation. Given a user prompt, rewrite it into a vivid, detailed image generation prompt (2-4 sentences max). Add artistic style, lighting, composition, mood, and color palette details. Output ONLY the enhanced prompt — no intro, no quotes, no explanation.',
              },
              { role: 'user', content: prompt },
            ],
            max_tokens: 300,
            temperature: 0.8,
          }),
        })

        if (enhanceRes.ok) {
          const enhanceData = await enhanceRes.json()
          const enhanced = enhanceData?.choices?.[0]?.message?.content
          if (enhanced && enhanced.trim().length > 0) {
            finalPrompt = enhanced.trim()
            console.log(`Enhanced prompt via ${model}:`, finalPrompt.slice(0, 120))
          }
        } else {
          console.error(`Enhancer error: ${enhanceRes.status}`)
          // Fall through with original prompt
        }
      } catch (err: any) {
        console.error('Enhancer call failed:', err.message)
        // Fall through with original prompt
      }
    }

    // Step 2: Generate images using the image model
    const promises = Array.from({ length: count }, async (_, i) => {
      try {
        const response = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            model: imageModel,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Generate an image based on this prompt. Use a 2:3 portrait aspect ratio. Create a high-quality, detailed image. Variation ${i + 1} of ${count}:\n\n${finalPrompt}`,
                  },
                ],
              },
            ],
            max_tokens: 8192,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`OpenRouter error (${i + 1}/${count}):`, response.status, errorText)
          return null
        }

        const data = await response.json()
        const imageUrl = extractImageFromResponse(data)
        if (!imageUrl) {
          console.error(`No image in response (${i + 1}/${count}):`, JSON.stringify(data).slice(0, 200))
          return null
        }
        return imageUrl
      } catch (err: any) {
        console.error(`Generate error (${i + 1}/${count}):`, err.message)
        return null
      }
    })

    const results = await Promise.all(promises)
    const urls = results.filter(Boolean) as string[]

    if (urls.length === 0) {
      return NextResponse.json({ error: 'No images were generated' }, { status: 500 })
    }

    return NextResponse.json({
      urls,
      model: isEnhancer ? `${model} → ${imageModel}` : imageModel,
      enhancedPrompt: isEnhancer ? finalPrompt : undefined,
    })
  } catch (error: any) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

function extractImageFromResponse(data: any): string | null {
  const message = data?.choices?.[0]?.message
  if (!message) return null

  // PRIMARY: Check for images array (OpenRouter native format)
  const images = message.images
  if (images && images.length > 0) {
    const img = images[0]
    return img?.image_url?.url
      || img?.image_url
      || img?.url
      || (typeof img === 'string' ? img : null)
      || null
  }

  // SECONDARY: Check content field for inline images
  const content = message.content
  if (!content) return null

  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === 'image_url' && part.image_url?.url) {
        return part.image_url.url
      }
      if (part.type === 'image' && (part.url || part.image_url?.url)) {
        return part.url || part.image_url?.url
      }
      if (part.image_url) {
        return typeof part.image_url === 'string' ? part.image_url : part.image_url?.url || null
      }
    }
  }

  if (typeof content === 'string') {
    const b64Match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/)
    if (b64Match) return b64Match[0]

    const mdMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/)
    if (mdMatch) return mdMatch[1]

    const urlMatch = content.match(/(https?:\/\/[^\s]+\.(png|jpg|jpeg|gif|webp)(\?[^\s]*)?)/i)
    if (urlMatch) return urlMatch[0]

    try {
      const parsed = JSON.parse(content)
      if (parsed.url) return parsed.url
      if (parsed.data?.[0]?.url) return parsed.data[0].url
    } catch {}
  }

  return null
}
