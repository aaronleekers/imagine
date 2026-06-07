import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function POST(req: NextRequest) {
  try {
    const { originalPrompt, edit } = await req.json()

    if (!originalPrompt || !edit) {
      return NextResponse.json({ error: 'Original prompt and edit are required' }, { status: 400 })
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
        model: 'openai/gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `You are a prompt engineer. Your job is to rewrite an image generation prompt to incorporate an edit request.

Rules:
1. OUTPUT ONLY the rewritten prompt — no explanation, no conversation
2. Keep all important details from the original prompt
3. Apply the edit naturally and precisely
4. Maintain or improve the level of descriptive detail
5. Keep the prompt concise but vivid
6. Do NOT add "Generate an image of..." or similar preambles — just the prompt itself`,
          },
          {
            role: 'user',
            content: `Original prompt: "${originalPrompt}"

Edit request: "${edit}"

Rewritten prompt:`,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Rewrite error:', response.status, errorText)
      return NextResponse.json(
        { error: `Prompt rewrite failed: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const rewritten = data?.choices?.[0]?.message?.content?.trim() || originalPrompt

    return NextResponse.json({ prompt: rewritten })
  } catch (error: any) {
    console.error('Rewrite error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
