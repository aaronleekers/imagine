'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { GeneratedImage, GeneratedVideo, generateId } from '@/lib/types'
import PromptInput from '@/components/PromptInput'
import ImageCard from '@/components/ImageCard'
import EditModal from '@/components/EditModal'

const DEFAULT_MODEL = 'openai/gpt-5.4-image-2'
const PAGE_SIZE = 10

export default function Home() {
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
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

  // Infinite scroll: IntersectionObserver on sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < images.length) {
          setVisibleCount(prev => Math.min(prev + PAGE_SIZE, images.length))
        }
      },
      { rootMargin: '400px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [visibleCount, images.length])

  // Reset visible count when new images are generated
  useEffect(() => {
    if (images.length > 0 && visibleCount < PAGE_SIZE) {
      setVisibleCount(Math.min(PAGE_SIZE, images.length))
    }
  }, [images.length])

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

  const handleGenerateVideo = useCallback((image: GeneratedImage) => {
    setError('Video generation requires a Runway/Kling/Luma/MiniMax/Pika API key. OpenRouter does not support video generation.')
  }, [])

  const visibleImages = images.slice(0, visibleCount)
  const hasMore = visibleCount < images.length

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <PromptInput
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        defaultModel={activeModel}
      />

      {/* Error toast */}
      {error && (
        <div className="fixed top-4 right-4 z-[90] animate-slide-up max-w-sm">
          <div
            className="px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2"
            style={{ background: 'var(--surface)', borderColor: '#ff4444', color: '#ff6666' }}
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
          {visibleImages.map(image => (
            <ImageCard
              key={image.id}
              image={image}
              onEdit={handleEdit}
              onRegenerateWithPrompt={handleRegenerateWithPrompt}
              onGenerateVideo={handleGenerateVideo}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="flex justify-center py-8"
        >
          <div className="flex items-center gap-2 text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
            <span>SCROLL FOR MORE</span>
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
          </div>
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
