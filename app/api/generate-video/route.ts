import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, prompt, model } = await req.json()
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
    }

    const videoPrompt = prompt || 'Smooth cinematic motion, natural camera movement'

    // Build message content - image is optional (some models are text-to-video)
    const contentParts: any[] = []
    if (imageUrl) {
      contentParts.push({ type: 'image_url', image_url: { url: imageUrl } })
    }
    contentParts.push({ type: 'text', text: videoPrompt })

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
        'X-Title': 'Imagine',
      },
      body: JSON.stringify({
        model: model || 'x-ai/grok-imagine-video',
        messages: [{ role: 'user', content: contentParts }],
        max_tokens: 16384,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Video generation error:', model, response.status, errorText.slice(0, 500))
      return NextResponse.json(
        { error: `${model}: ${response.status} — ${errorText.slice(0, 200)}` },
        { status: response.status < 500 ? 400 : 500 }
      )
    }

    const data = await response.json()
    const videoUrl = extractVideoFromResponse(data)

    if (!videoUrl) {
      console.error('No video in response:', JSON.stringify(data).slice(0, 500))
      return NextResponse.json({ error: 'No video generated in response' }, { status: 500 })
    }

    return NextResponse.json({ url: videoUrl, model })
  } catch (error: any) {
    console.error('Video generation error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

function extractVideoFromResponse(data: any): string | null {
  const message = data?.choices?.[0]?.message
  if (!message) return null

  // videos array (like images array)
  const videos = message.videos || message.media
  if (videos?.length > 0) {
    const v = videos[0]
    return v?.video_url?.url || v?.video_url || v?.url || (typeof v === 'string' ? v : null)
  }

  // images array (some models return video as image/gif)
  const images = message.images
  if (images?.length > 0) {
    const img = images[0]
    const url = img?.image_url?.url || img?.image_url || img?.url || null
    if (url) return url
  }

  // string content
  const content = message.content
  if (typeof content === 'string') {
    const vidMatch = content.match(/(https?:\/\/[^\s]+\.(mp4|webm|mov)(\?[^\s]*)?)/i)
    if (vidMatch) return vidMatch[0]
    const b64Match = content.match(/data:video\/[^;]+;base64,[A-Za-z0-9+/=]+/)
    if (b64Match) return b64Match[0]
    // Also check for any URL (could be video without extension)
    const anyMatch = content.match(/https?:\/\/[^\s"<>]+/)
    if (anyMatch) return anyMatch[0]
  }

  // array content parts
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === 'video_url' && part.video_url?.url) return part.video_url.url
      if (part.type === 'video' && part.url) return part.url
      if (part.type === 'image_url' && part.image_url?.url) return part.image_url.url
    }
  }

  return null
}
