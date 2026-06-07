'use client'

import { useState } from 'react'
import { GeneratedImage } from '@/lib/types'

interface ImageCardProps {
  image: GeneratedImage
  onEdit: (image: GeneratedImage) => void
  onRegenerateWithPrompt: (prompt: string, model: string) => void
  onGenerateVideo: (image: GeneratedImage) => void
}

export default function ImageCard({ image, onEdit, onRegenerateWithPrompt, onGenerateVideo }: ImageCardProps) {
  const [loaded, setLoaded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(image.prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = image.url
    a.download = `imagine-${image.id}.png`
    a.click()
  }

  const modelName = image.model ? image.model.split('/').pop() : 'AI'

  return (
    <div
      className="relative group rounded-xl overflow-hidden animate-scale-in border"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ background: 'var(--bg)' }}>
        {!loaded && (
          <div className="skeleton w-full" style={{ paddingBottom: '100%' }} />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.prompt}
          className={`w-full h-auto block transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
          onLoad={() => setLoaded(true)}
          loading="lazy"
        />
      </div>

      {/* Hover overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-200 flex flex-col justify-end p-3 ${
          hovered ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ background: 'linear-gradient(to top, rgba(10,10,11,0.95) 0%, rgba(10,10,11,0.4) 60%, transparent 100%)' }}
      >
        <p className="text-xs leading-relaxed mb-3 line-clamp-3" style={{ color: 'var(--text)' }}>
          {image.prompt}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onEdit(image)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 9.5V11h1.5l5.87-5.87-1.5-1.5L1 9.5zm7.73-5.93l-1.5-1.5.75-.75a.5.5 0 01.7 0l.8.8a.5.5 0 010 .7l-.75.75z" fill="currentColor"/>
            </svg>
            EDIT
          </button>
          <button
            onClick={() => onGenerateVideo(image)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5"
            style={{ background: 'rgba(168,85,247,0.2)', color: '#c084fc' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1.5 3l4 3-4 3V3zM7.5 2v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            VIDEO
          </button>
          <button
            onClick={handleCopyPrompt}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text)' }}
          >
            {copied ? 'COPIED' : 'COPY'}
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v7M3 5l3 3 3-3M1 9v1.5A.5.5 0 001.5 11h9a.5.5 0 00.5-.5V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={() => onRegenerateWithPrompt(image.prompt, image.model)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1.5 6A4.5 4.5 0 0110.5 6M1.5 6A4.5 4.5 0 0010.5 6M1.5 6H3m7.5 0H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.5 3.5L10.5 1.5M10.5 1.5L12 3M10.5 1.5v2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            REMIX
          </button>
        </div>
      </div>

      {/* Model badge */}
      <div
        className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider"
        style={{ background: 'rgba(10,10,11,0.8)', color: 'var(--accent)', border: '1px solid var(--border)' }}
      >
        {modelName}
      </div>
    </div>
  )
}
