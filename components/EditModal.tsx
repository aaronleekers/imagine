'use client'

import { useState, useRef, useEffect } from 'react'
import { GeneratedImage } from '@/lib/types'

interface EditModalProps {
  image: GeneratedImage
  onClose: () => void
  onSubmit: (edit: string) => Promise<void>
  isRewriting: boolean
}

export default function EditModal({ image, onClose, onSubmit, isRewriting }: EditModalProps) {
  const [edit, setEdit] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleSubmit = async () => {
    if (!edit.trim() || isRewriting) return
    await onSubmit(edit.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
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
          <h2 className="font-display text-lg tracking-wider" style={{ color: 'var(--accent)' }}>
            EDIT IMAGE
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-dim)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Image preview */}
        <div className="relative" style={{ background: 'var(--bg)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt="Preview"
            className="w-full max-h-48 object-contain"
          />
        </div>

        {/* Original prompt */}
        <div className="px-5 pt-4">
          <div className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--text-dim)' }}>
            Original Prompt
          </div>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text)' }}>
            {image.prompt}
          </p>
        </div>

        {/* Edit input */}
        <div className="px-5 pb-2">
          <div className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--text-dim)' }}>
            What would you like to change?
          </div>
          <textarea
            ref={inputRef}
            value={edit}
            onChange={(e) => setEdit(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='e.g. "make it cyberpunk", "add a cat", "change the lighting to sunset"...'
            rows={3}
            className="w-full bg-transparent text-text placeholder:text-text-dim px-0 py-2 resize-none text-sm leading-relaxed font-sans"
            style={{ outline: 'none', borderBottom: '1px solid var(--border)' }}
            disabled={isRewriting}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ color: 'var(--text-dim)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!edit.trim() || isRewriting}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold font-display tracking-wider transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: edit.trim() && !isRewriting ? 'var(--accent)' : 'var(--border)',
              color: edit.trim() && !isRewriting ? 'var(--bg)' : 'var(--text-dim)',
            }}
          >
            {isRewriting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                REWRITING...
              </span>
            ) : (
              'REWRITE & GENERATE →'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
