'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { GeneratedImage, IMAGE_MODELS, generateId } from '@/lib/types'
import PromptInput from '@/components/PromptInput'
import ImageCard from '@/components/ImageCard'
import EditModal from '@/components/EditModal'

const DEFAULT_MODEL = 'openai/gpt-5.4-image-2'

export default function Home() {
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null)
  const [isRewriting, setIsRewriting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeModel, setActiveModel] = useState(DEFAULT_MODEL)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Clear error after 5s
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(t)
    }
  }, [error])

  const handleGenerate = useCallback(async (prompt: string, model: string) => {
    setIsGenerating(true)
    setError(null)
    setActiveModel(model)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      const newImage: GeneratedImage = {
        id: generateId(),
        url: data.url,
        prompt,
        model: data.model || model,
        timestamp: Date.now(),
      }

      setImages(prev => [newImage, ...prev])
    } catch (err: any) {
      setError(err.message || 'Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const handleEdit = useCallback((image: GeneratedImage) => {
    setEditingImage(image)
  }, [])

  const handleEditSubmit = useCallback(async (edit: string) => {
    if (!editingImage) return

    setIsRewriting(true)
    setError(null)

    try {
      // First, rewrite the prompt
      const rewriteRes = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPrompt: editingImage.prompt,
          edit,
        }),
      })

      const rewriteData = await rewriteRes.json()

      if (!rewriteRes.ok) {
        throw new Error(rewriteData.error || 'Rewrite failed')
      }

      const newPrompt = rewriteData.prompt

      // Then generate new image with rewritten prompt
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: newPrompt,
          model: editingImage.model,
        }),
      })

      const genData = await genRes.json()

      if (!genRes.ok) {
        throw new Error(genData.error || 'Generation failed')
      }

      const newImage: GeneratedImage = {
        id: generateId(),
        url: genData.url,
        prompt: newPrompt,
        model: genData.model || editingImage.model,
        timestamp: Date.now(),
      }

      setImages(prev => [newImage, ...prev])
      setEditingImage(null)
    } catch (err: any) {
      setError(err.message || 'Edit failed')
    } finally {
      setIsRewriting(false)
    }
  }, [editingImage])

  const handleRegenerateWithPrompt = useCallback((prompt: string, model: string) => {
    handleGenerate(prompt, model)
  }, [handleGenerate])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Input area */}
      <PromptInput
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        defaultModel={activeModel}
      />

      {/* Error toast */}
      {error && (
        <div className="fixed top-4 right-4 z-[90] animate-slide-up">
          <div
            className="px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2"
            style={{
              background: 'var(--surface)',
              borderColor: '#ff4444',
              color: '#ff6666',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 4v3.5M7 10v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Image wall */}
      {images.length > 0 && (
        <div className="image-wall">
          {images.map(image => (
            <ImageCard
              key={image.id}
              image={image}
              onEdit={handleEdit}
              onRegenerateWithPrompt={handleRegenerateWithPrompt}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && !isGenerating && (
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <div className="text-6xl mb-6 opacity-20">⌐◨-◨</div>
          <h2 className="font-display text-2xl tracking-wider mb-2" style={{ color: 'var(--text-dim)' }}>
            NO IMAGES YET
          </h2>
          <p className="text-sm max-w-md" style={{ color: 'var(--text-dim)' }}>
            Type a prompt above and hit generate. Your creations will appear here in an endless wall.
          </p>
        </div>
      )}

      {/* Loading indicator */}
      {isGenerating && (
        <div className="image-wall">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              <div
                className="skeleton w-full"
                style={{ paddingBottom: `${60 + Math.random() * 40}%` }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editingImage && (
        <EditModal
          image={editingImage}
          onClose={() => setEditingImage(null)}
          onSubmit={handleEditSubmit}
          isRewriting={isRewriting}
        />
      )}
    </div>
  )
}
