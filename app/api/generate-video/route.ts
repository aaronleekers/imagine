import { NextRequest, NextResponse } from 'next/server'

// Generic video generation endpoint that supports multiple providers
// Currently configured for Runway API as default

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, prompt, model } = await req.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    const provider = model?.split('/')[0] || 'runway'

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

async function handleRunway(imageUrl: string, prompt: string, model: string) {
  const apiKey = process.env.RUNWAY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Runway API key not configured. Set RUNWAY_API_KEY env var.' }, { status: 501 })
  }

  const modelSlug = model?.split('/')[1] || 'gen4'

  // Start a video generation task
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
    const err = await taskRes.text()
    console.error('Runway task error:', taskRes.status, err)
    return NextResponse.json(
      { error: `Runway task creation failed: ${taskRes.status}` },
      { status: taskRes.status }
    )
  }

  const task = await taskRes.json()

  // Poll for completion (Runway tasks are async)
  const taskId = task.id
  let videoUrl: string | null = null
  let attempts = 0
  const maxAttempts = 60 // 5 minutes max

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000))
    attempts++

    const pollRes = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Runway-Version': '2024-11-06',
      },
    })

    if (!pollRes.ok) continue

    const pollData = await pollRes.json()

    if (pollData.status === 'SUCCEEDED') {
      videoUrl = pollData.output?.[0]
      break
    }

    if (pollData.status === 'FAILED') {
      return NextResponse.json(
        { error: `Video generation failed: ${pollData.failure || 'Unknown error'}` },
        { status: 500 }
      )
    }

    // Still processing: THROTTLED, RUNNING, etc.
  }

  if (!videoUrl) {
    return NextResponse.json({ error: 'Video generation timed out' }, { status: 504 })
  }

  return NextResponse.json({ url: videoUrl, model })
}

async function handleKling(imageUrl: string, prompt: string, model: string) {
  const apiKey = process.env.KLING_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Kling API key not configured. Set KLING_API_KEY env var.' }, { status: 501 })
  }

  const res = await fetch('https://api.klingai.com/v1/videos/image2video', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model_name: model?.includes('pro') ? 'kling-v2-1-pro' : 'kling-v2-1',
      image: imageUrl,
      prompt: prompt || 'Smooth motion',
      duration: '5',
      mode: 'std',
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: `Kling API error: ${res.status}` }, { status: res.status })
  }

  const data = await res.json()
  if (data.code !== 0) {
    return NextResponse.json({ error: data.message || 'Kling error' }, { status: 500 })
  }

  // Kling returns a task ID, poll similarly
  const taskId = data.data.task_id
  let videoUrl: string | null = null
  let attempts = 0

  while (attempts < 60) {
    await new Promise(r => setTimeout(r, 5000))
    attempts++

    const pollRes = await fetch(`https://api.klingai.com/v1/videos/image2video/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    const pollData = await pollRes.json()

    if (pollData.code === 0 && pollData.data.task_status === 'succeed') {
      videoUrl = pollData.data.task_result?.videos?.[0]?.url
      break
    }
    if (pollData.data?.task_status === 'failed') break
  }

  if (!videoUrl) {
    return NextResponse.json({ error: 'Kling video generation timed out' }, { status: 504 })
  }

  return NextResponse.json({ url: videoUrl, model })
}

async function handleLuma(imageUrl: string, prompt: string, model: string) {
  const apiKey = process.env.LUMA_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Luma API key not configured. Set LUMA_API_KEY env var.' }, { status: 501 })
  }

  const res = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      generation_type: 'image_to_video',
      model: model?.includes('photon') ? 'photon-2' : 'ray-2',
      image_url: imageUrl,
      prompt: prompt || 'Cinematic motion',
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: `Luma API error: ${res.status}` }, { status: res.status })
  }

  const data = await res.json()

  // Luma is also async
  const generationId = data.id
  let videoUrl: string | null = null
  let attempts = 0

  while (attempts < 60) {
    await new Promise(r => setTimeout(r, 5000))
    attempts++

    const pollRes = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${generationId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    const pollData = await pollRes.json()

    if (pollData.state === 'completed' && pollData.assets?.video) {
      videoUrl = pollData.assets.video
      break
    }
    if (pollData.state === 'failed') break
  }

  if (!videoUrl) {
    return NextResponse.json({ error: 'Luma generation timed out' }, { status: 504 })
  }

  return NextResponse.json({ url: videoUrl, model })
}

async function handleMinimax(imageUrl: string, prompt: string, model: string) {
  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'MiniMax API key not configured. Set MINIMAX_API_KEY env var.' }, { status: 501 })
  }

  const res = await fetch('https://api.minimaxi.com/v1/video_generation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'video-01',
      prompt: prompt || 'Smooth motion',
      first_frame_image: imageUrl,
      duration: 5,
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: `MiniMax API error: ${res.status}` }, { status: res.status })
  }

  const data = await res.json()

  if (data.base_resp?.status_code !== 0) {
    return NextResponse.json({ error: data.base_resp?.status_msg || 'MiniMax error' }, { status: 500 })
  }

  // MiniMax returns the submit result with task_id
  const taskId = data.task_id || data.submit_id
  if (!taskId) {
    // Some versions return direct URL
    if (data.video_url) {
      return NextResponse.json({ url: data.video_url, model })
    }
    return NextResponse.json({ error: 'No video returned' }, { status: 500 })
  }

  // Poll for result
  let videoUrl: string | null = null
  let attempts = 0

  while (attempts < 60) {
    await new Promise(r => setTimeout(r, 5000))
    attempts++

    const pollRes = await fetch(`https://api.minimaxi.com/v1/query/video_generation?task_id=${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    const pollData = await pollRes.json()

    if (pollData.status === 'SUCCESS' || pollData.base_resp?.status_code === 0) {
      videoUrl = pollData.video_url || pollData.file?.download_url
      break
    }
    if (pollData.status === 'FAILED') break
  }

  if (!videoUrl) {
    return NextResponse.json({ error: 'MiniMax generation timed out' }, { status: 504 })
  }

  return NextResponse.json({ url: videoUrl, model })
}

async function handlePika(imageUrl: string, prompt: string, model: string) {
  const apiKey = process.env.PIKA_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Pika API key not configured. Set PIKA_API_KEY env var.' }, { status: 501 })
  }

  const res = await fetch('https://api.pika.art/v1/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model?.includes('turbo') ? 'pika-2.2-turbo' : 'pika-2.2',
      images: [{ imageUrl }],
      prompt: prompt || 'Smooth motion',
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: `Pika API error: ${res.status}` }, { status: res.status })
  }

  const data = await res.json()
  let videoUrl = data.video_url || data.result?.video

  // Poll if async
  if (!videoUrl && data.id) {
    let attempts = 0
    while (attempts < 60) {
      await new Promise(r => setTimeout(r, 5000))
      attempts++
      const pollRes = await fetch(`https://api.pika.art/v1/generate/${data.id}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
      const pollData = await pollRes.json()
      if (pollData.video_url || pollData.result?.video) {
        videoUrl = pollData.video_url || pollData.result?.video
        break
      }
      if (pollData.status === 'failed') break
    }
  }

  if (!videoUrl) {
    return NextResponse.json({ error: 'Pika generation timed out' }, { status: 504 })
  }

  return NextResponse.json({ url: videoUrl, model })
}
