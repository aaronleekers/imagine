import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, prompt, model } = await req.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    const provider = model?.split('/')[0] || 'x-ai'

    // OpenRouter-native models use chat completions
    if (provider === 'x-ai') {
      return handleOpenRouterVideo(imageUrl, prompt, model)
    }

    // External providers
    switch (provider) {
      case 'runway':
        return handleRunway(imageUrl, prompt, model)
      case 'kling':
        return handleKling(imageUrl, prompt, model)
      case 'luma':
        return handleLuma(imageUrl, prompt, model)
      case 'minimax':
        return handleMinimax(imageUrl, prompt, model)
      case 'pika':
        return handlePika(imageUrl, prompt, model)
      default:
        return NextResponse.json({ error: `Unknown video provider: ${provider}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Video generation error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

async function handleOpenRouterVideo(imageUrl: string, prompt: string, model: string) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
              type: 'image_url',
              image_url: { url: imageUrl },
            },
            {
              type: 'text',
              text: `Generate a video based on this image. ${prompt || 'Smooth cinematic motion, natural camera movement.'}`,
            },
          ],
        },
      ],
      max_tokens: 8192,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('OpenRouter video error:', response.status, errorText)
    return NextResponse.json(
      { error: `Video generation failed: ${response.status}` },
      { status: response.status }
    )
  }

  const data = await response.json()

  // Extract video from response (similar format to image generation)
  const videoUrl = extractVideoFromResponse(data)

  if (!videoUrl) {
    console.error('No video in response:', JSON.stringify(data).slice(0, 500))
    return NextResponse.json({ error: 'No video generated in response' }, { status: 500 })
  }

  return NextResponse.json({ url: videoUrl, model })
}

function extractVideoFromResponse(data: any): string | null {
  const message = data?.choices?.[0]?.message
  if (!message) return null

  // Check for videos array (similar to images)
  const videos = message.videos || message.media
  if (videos && videos.length > 0) {
    const vid = videos[0]
    return vid?.video_url?.url || vid?.video_url || vid?.url || (typeof vid === 'string' ? vid : null)
  }

  // Check for images array (some models return video as image/gif)
  const images = message.images
  if (images && images.length > 0) {
    const img = images[0]
    const url = img?.image_url?.url || img?.image_url || img?.url || null
    if (url?.includes('video') || url?.includes('.mp4') || url?.includes('.webm') || url?.includes('data:video')) {
      return url
    }
  }

  // Check content for video URLs
  const content = message.content
  if (typeof content === 'string') {
    // Look for video URLs
    const vidMatch = content.match(/(https?:\/\/[^\s]+\.(mp4|webm|mov)(\?[^\s]*)?)/i)
    if (vidMatch) return vidMatch[0]

    // Base64 video
    const b64Match = content.match(/data:video\/[^;]+;base64,[A-Za-z0-9+/=]+/)
    if (b64Match) return b64Match[0]
  }

  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === 'video_url' && part.video_url?.url) {
        return part.video_url.url
      }
      if (part.type === 'video' && part.url) {
        return part.url
      }
    }
  }

  return null
}

// External provider handlers below...

async function handleRunway(imageUrl: string, prompt: string, model: string) {
  const apiKey = process.env.RUNWAY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Runway API key not configured. Set RUNWAY_API_KEY env var.' }, { status: 501 })
  }

  const modelSlug = model?.split('/')[1] || 'gen4'

  const taskRes = await fetch('https://api.runwayml.com/v1/tasks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-11-06',
    },
    body: JSON.stringify({
      taskType: 'image_to_video',
      taskInput: {
        model: `runway/${modelSlug}`,
        promptImage: imageUrl,
        promptText: prompt || 'Smooth cinematic motion',
        duration: modelSlug === 'gen3-turbo' ? 5 : 10,
        watermark: false,
      },
    }),
  })

  if (!taskRes.ok) {
    return NextResponse.json({ error: `Runway error: ${taskRes.status}` }, { status: taskRes.status })
  }

  const task = await taskRes.json()
  let attempts = 0
  while (attempts < 60) {
    await new Promise(r => setTimeout(r, 5000))
    attempts++
    const pollRes = await fetch(`https://api.runwayml.com/v1/tasks/${task.id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'X-Runway-Version': '2024-11-06' },
    })
    const pollData = await pollRes.json()
    if (pollData.status === 'SUCCEEDED') {
      return NextResponse.json({ url: pollData.output?.[0], model })
    }
    if (pollData.status === 'FAILED') break
  }
  return NextResponse.json({ error: 'Runway timed out' }, { status: 504 })
}

async function handleKling(imageUrl: string, prompt: string, model: string) {
  const apiKey = process.env.KLING_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Set KLING_API_KEY' }, { status: 501 })

  const res = await fetch('https://api.klingai.com/v1/videos/image2video', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model_name: model?.includes('pro') ? 'kling-v2-1-pro' : 'kling-v2-1', image: imageUrl, prompt: prompt || 'Smooth motion', duration: '5', mode: 'std' }),
  })
  if (!res.ok) return NextResponse.json({ error: `Kling error: ${res.status}` }, { status: res.status })
  const data = await res.json()
  if (data.code !== 0) return NextResponse.json({ error: data.message }, { status: 500 })

  let attempts = 0
  while (attempts < 60) {
    await new Promise(r => setTimeout(r, 5000))
    attempts++
    const pollRes = await fetch(`https://api.klingai.com/v1/videos/image2video/${data.data.task_id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    const pollData = await pollRes.json()
    if (pollData.code === 0 && pollData.data.task_status === 'succeed') {
      return NextResponse.json({ url: pollData.data.task_result?.videos?.[0]?.url, model })
    }
    if (pollData.data?.task_status === 'failed') break
  }
  return NextResponse.json({ error: 'Kling timed out' }, { status: 504 })
}

async function handleLuma(imageUrl: string, prompt: string, model: string) {
  const apiKey = process.env.LUMA_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Set LUMA_API_KEY' }, { status: 501 })

  const res = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ generation_type: 'image_to_video', model: model?.includes('photon') ? 'photon-2' : 'ray-2', image_url: imageUrl, prompt: prompt || 'Cinematic motion' }),
  })
  if (!res.ok) return NextResponse.json({ error: `Luma error: ${res.status}` }, { status: res.status })
  const data = await res.json()

  let attempts = 0
  while (attempts < 60) {
    await new Promise(r => setTimeout(r, 5000))
    attempts++
    const pollRes = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${data.id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    const pollData = await pollRes.json()
    if (pollData.state === 'completed' && pollData.assets?.video) {
      return NextResponse.json({ url: pollData.assets.video, model })
    }
    if (pollData.state === 'failed') break
  }
  return NextResponse.json({ error: 'Luma timed out' }, { status: 504 })
}

async function handleMinimax(imageUrl: string, prompt: string, model: string) {
  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Set MINIMAX_API_KEY' }, { status: 501 })

  const res = await fetch('https://api.minimaxi.com/v1/video_generation', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'video-01', prompt: prompt || 'Smooth motion', first_frame_image: imageUrl, duration: 5 }),
  })
  if (!res.ok) return NextResponse.json({ error: `MiniMax error: ${res.status}` }, { status: res.status })
  const data = await res.json()
  if (data.video_url) return NextResponse.json({ url: data.video_url, model })

  let attempts = 0
  const taskId = data.task_id || data.submit_id
  while (attempts < 60 && taskId) {
    await new Promise(r => setTimeout(r, 5000))
    attempts++
    const pollRes = await fetch(`https://api.minimaxi.com/v1/query/video_generation?task_id=${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    const pollData = await pollRes.json()
    if (pollData.status === 'SUCCESS' || pollData.base_resp?.status_code === 0) {
      return NextResponse.json({ url: pollData.video_url || pollData.file?.download_url, model })
    }
    if (pollData.status === 'FAILED') break
  }
  return NextResponse.json({ error: 'MiniMax timed out' }, { status: 504 })
}

async function handlePika(imageUrl: string, prompt: string, model: string) {
  const apiKey = process.env.PIKA_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Set PIKA_API_KEY' }, { status: 501 })

  const res = await fetch('https://api.pika.art/v1/generate', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: model?.includes('turbo') ? 'pika-2.2-turbo' : 'pika-2.2', images: [{ imageUrl }], prompt: prompt || 'Smooth motion' }),
  })
  if (!res.ok) return NextResponse.json({ error: `Pika error: ${res.status}` }, { status: res.status })
  const data = await res.json()
  let videoUrl = data.video_url || data.result?.video
  if (videoUrl) return NextResponse.json({ url: videoUrl, model })

  let attempts = 0
  while (attempts < 60 && data.id) {
    await new Promise(r => setTimeout(r, 5000))
    attempts++
    const pollRes = await fetch(`https://api.pika.art/v1/generate/${data.id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    const pollData = await pollRes.json()
    if (pollData.video_url || pollData.result?.video) {
      return NextResponse.json({ url: pollData.video_url || pollData.result?.video, model })
    }
    if (pollData.status === 'failed') break
  }
  return NextResponse.json({ error: 'Pika timed out' }, { status: 504 })
}
