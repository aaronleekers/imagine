'use client'

import { useState, useRef, useEffect } from 'react'
import { GeneratedImage, VIDEO_MODELS } from '@/lib/types'

interface VideoModalProps {
  image: GeneratedImage
  onClose: () => void
  onSubmit: (prompt: string, model: string) => Promise<void>
  isGenerating: boolean
}

export default function VideoModal({ image, onClose, onSubmit, isGenerating }: VideoModalProps) {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState(VIDEO_MODELS[0].id)
  const [showModels, setShowModels] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedModel = VIDEO_MODELS.find(m => m.id === model) || VIDEO_MODELS[0]

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowModels(false)
      }
    }
    document.addEventListener('keydown', handleEsc)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  const handleSubmit = async () => {
    if (isGenerating) return
    await onSubmit(prompt || 'Smooth cinematic motion', model)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden animate-slide-up border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-display text-lg tracking-wider flex items-center gap-2" style={{ color: '#c084fc' }}>
            <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
              <path d="M1.5 3l4 3-4 3V3zM7.5 2v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            GENERATE VIDEO
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors" style={{ color: 'var(--text-dim)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Image preview */}
        <div className="relative" style={{ background: 'var(--bg)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt="Source" className="w-full max-h-48 object-contain" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.3)', backdropFilter: 'blur(4px)' }}>
              <svg width="20" height="20" viewBox="0 0 12 12" fill="none">
                <path d="M1.5 3l4 3-4 3V3zM7.5 2v8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Video prompt */}
        <div className="px-5 pt-4">
          <div className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--text-dim)' }}>
            Motion prompt (optional)
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Describe the motion, e.g. "slow zoom in, gentle breeze through hair, cinematic lighting"...'
            rows={2}
            className="w-full bg-transparent text-text placeholder:text-text-dim px-3 py-2 resize-none text-sm leading-relaxed font-sans rounded-lg border mb-4"
            style={{ borderColor: 'var(--border)', outline: 'none' }}
            disabled={isGenerating}
          />
        </div>

        {/* Source prompt info */}
        <div className="px-5 pb-2">
          <div className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--text-dim)' }}>
            Source image prompt
          </div>
          <p className="text-xs leading-relaxed text-text-dim line-clamp-2">{image.prompt}</p>
        </div>

        {/* Model selector + submit */}
        <div className="px-5 pb-4 pt-3 flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowModels(!showModels)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 border"
              style={{
                background: 'var(--bg)',
                borderColor: showModels ? '#c084fc' : 'var(--border)',
                color: 'var(--text-dim)',
              }}
            >
              <span style={{ color: '#c084fc' }}>{selectedModel.provider}</span>
              <span style={{ color: 'var(--text)' }}>{selectedModel.name}</span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            {showModels && (
              <div
                className="absolute top-full left-0 mt-2 w-64 rounded-xl border overflow-hidden animate-scale-in z-50"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div className="p-1.5 max-h-64 overflow-y-auto">
                  {VIDEO_MODELS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setModel(m.id); setShowModels(false) }}
                      className="w-full text-left px-3 py-2 rounded-lg transition-all duration-150"
                      style={m.id === model
                        ? { background: 'rgba(168,85,247,0.12)', color: '#c084fc' }
                        : { color: 'var(--text)' }
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium">{m.name}</div>
                          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
                            {m.provider} — {m.description}
                          </div>
                        </div>
                        {m.id === model && (
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                            <path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isGenerating}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold font-display tracking-wider transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: !isGenerating ? '#a855f7' : 'var(--border)',
              color: !isGenerating ? 'white' : 'var(--text-dim)',
            }}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                GENERATING...
              </span>
            ) : (
              'GENERATE VIDEO →'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
