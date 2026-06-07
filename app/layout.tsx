import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Imagine — AI Image Generator',
  description: 'Generate stunning images with AI. Edit, remix, and explore.',
  openGraph: {
    title: 'Imagine',
    description: 'AI image generation with infinite scroll and smart edits',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
