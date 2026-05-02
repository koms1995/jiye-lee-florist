'use client'

import { useEffect, useRef } from 'react'

export default function GrainCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.createImageData(canvas.width, canvas.height)
    for (let i = 0; i < imageData.data.length; i += 4) {
      const val = Math.random() * 255
      imageData.data[i] = val
      imageData.data[i + 1] = val
      imageData.data[i + 2] = val
      imageData.data[i + 3] = 35
    }
    ctx.putImageData(imageData, 0, 0)
  }, [])

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 999, mixBlendMode: 'overlay', opacity: 0.6 }}
    />
  )
}
