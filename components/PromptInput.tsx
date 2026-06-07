'use client'

import { useState, useRef, useEffect } from 'react'
import { IMAGE_MODELS } from '@/lib/types'

interface PromptInputProps {
  onGenerate: (prompt: string, model: string) => void
  isGenerating: boolean
  defaultModel: string
}

export default function PromptInput({ onGenerate, isGenerating, defaultModel }: PromptInputProps) {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState(defaultModel)
  const [showModels, setShowModels] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedModel = IMAGE_MODELS.find(m => m.id === model) || IMAGE_MODELS[0]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowModels(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = () => {
    const trimmed = prompt.trim()
    if (!trimmed || isGenerating) return
    onGenerate(trimmed, model)
    setPrompt('')
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }

  return (
    <div className="sticky top-0 z-50 pb-6" style={{ background: 'linear-gradient(to bottom, var(--bg) 70%, transparent)' }}>
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6 pt-8">
          <h1 className="font-display text-5xl sm:text-6xl tracking-tight glow-text" style={{ color: 'var(--accent)' }}>
            IMAGINE
          </h1>
          <p className="text-sm mt-2 font-mono tracking-wide" style={{ color: 'var(--text-dim)' }}>
            GENERATE · EDIT · EXPLORE
          </p>
        </div>

        {/* Input area */}
        <div
          className={`
            relative rounded-xl overflow-hidden
            border transition-all duration-300
            ${focused ? 'border-accent shadow-[0_0_20px_rgba(0,240,255,0.08)]' : 'border-border'}
          `}
          style={{ background: 'var(--surface)' }}
        >
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Describe what you want to see..."
            rows={2}
            className="w-full bg-transparent text-text placeholder:text-text-dim px-5 pt-5 pb-3 resize-none text-base leading-relaxed font-sans"
            style={{ outline: 'none' }}
            disabled={isGenerating}
          />

          {/* Bottom bar */}
          <div className="flex items-center gap-2 px-5 pb-4">
            {/* Model selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowModels(!showModels)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 border"
                style={{
                  background: 'var(--bg)',
                  borderColor: showModels ? 'var(--accent)' : 'var(--border)',
                  color: 'var(--text-dim)',
                }}
              >
                <span style={{ color: 'var(--accent)' }}>{selectedModel.provider}</span>
                <span style={{ color: 'var(--text)' }}>{selectedModel.name}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>

              {showModels && (
                <div
                  className="absolute top-full left-0 mt-2 w-72 rounded-xl border overflow-hidden animate-scale-in z-50"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div className="p-1.5 max-h-72 overflow-y-auto">
                    {IMAGE_MODELS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setModel(m.id); setShowModels(false) }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 ${
                          m.id === model ? '' : ''
                        }`}
                        style={m.id === model
                          ? { background: 'rgba(0,240,255,0.08)', color: 'var(--accent)' }
                          : { color: 'var(--text)' }
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{m.name}</div>
                            <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                              {m.provider} — {m.description}
                            </div>
                          </div>
                          {m.id === model && (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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

            {/* Spacer */}
            <div className="flex-1" />

            {/* Char count */}
            <span className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
              {prompt.length}
            </span>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isGenerating}
              className="relative px-4 py-1.5 rounded-lg text-sm font-semibold font-display tracking-wider transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: prompt.trim() && !isGenerating ? 'var(--accent)' : 'var(--border)',
                color: prompt.trim() && !isGenerating ? 'var(--bg)' : 'var(--text-dim)',
              }}
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                  CREATING
                </span>
              ) : (
                'GENERATE →'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
