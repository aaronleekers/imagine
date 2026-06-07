import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function POST(req: NextRequest) {
  try {
    const { prompt, model } = await req.json()

    if (!prompt || !model) {
      return NextResponse.json({ error: 'Prompt and model are required' }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
    }

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
        'X-Title': 'Imagine',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Generate an image based on this prompt. Create a high-quality, detailed image:\n\n${prompt}`,
              },
            ],
          },
        ],
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter error:', response.status, errorText)
      return NextResponse.json(
        { error: `Image generation failed: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Extract image from response
    const imageUrl = extractImageFromResponse(data)

    if (!imageUrl) {
      console.error('No image in response:', JSON.stringify(data).slice(0, 500))
      return NextResponse.json({ error: 'No image generated in response' }, { status: 500 })
    }

    return NextResponse.json({ url: imageUrl, model })
  } catch (error: any) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

function extractImageFromResponse(data: any): string | null {
  // Try different response formats
  const content = data?.choices?.[0]?.message?.content
  if (!content) return null

  // If content is a string, look for image URLs or base64
  if (typeof content === 'string') {
    // Markdown image: ![alt](url)
    const mdMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/)
    if (mdMatch) return mdMatch[1]

    // Direct URL
    const urlMatch = content.match(/(https?:\/\/[^\s]+\.(png|jpg|jpeg|gif|webp)(\?[^\s]*)?)/i)
    if (urlMatch) return urlMatch[0]

    // Base64 data URI
    const b64Match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/)
    if (b64Match) return b64Match[0]

    // Try parsing as JSON with url field
    try {
      const parsed = JSON.parse(content)
      if (parsed.url) return parsed.url
    } catch {}
  }

  // If content is an array (multimodal response)
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === 'image_url' && part.image_url?.url) {
        return part.image_url.url
      }
      if (part.type === 'image' && part.url) {
        return part.url
      }
    }
  }

  // Check for images in the message directly
  const images = data?.choices?.[0]?.message?.images
  if (images && images.length > 0) {
    return images[0]?.image_url?.url || images[0]?.url || null
  }

  return null
}
