'use client'

import { useEffect, useState } from 'react'
import type { Theme } from './themes'

// ── Intro reveal sequence — frame-precise nrly.co replication ────────────────
// Total duration: 1000ms.
//   0–1000ms: bg shrinks via clip-path: inset() AND its `round` value
//             interpolates 0px → 24px so the four corners "curl inward"
//             toward the center, producing the "card condensation" feel
//             rather than a hard rectangular collapse.
//   300–700ms: handled by the grid's gridIntro CSS keyframe (PortfolioGrid).
//   600–900ms: TextCard's own y:20 → 0 / opacity 0 → 1 transitions kick in
//             so the name + bio rise into place as the bg settles.

const ANIM_S = 1.0    // total clip-path animation duration (matches spec)

type Insets = { top: number; right: number; bottom: number; left: number }

function computeInsets(w: number, h: number): Insets {
  const isMobile = w < 640
  const N_COLS   = 5
  const GAP      = 15
  const colW = isMobile
    ? Math.round(w * 0.641)
    : Math.round((w - (N_COLS - 1) * GAP) / N_COLS)
  const cellH = isMobile ? Math.round(colW * 1.30) : Math.round(h * 0.46)

  const cardTop  = (h - cellH) / 2
  const cardLeft = (w - colW)  / 2

  return {
    top:    (cardTop  / h) * 100,
    bottom: (cardTop  / h) * 100,
    left:   (cardLeft / w) * 100,
    right:  (cardLeft / w) * 100,
  }
}

interface Props {
  theme: Theme
  onComplete?: () => void
}

export default function IntroReveal({ theme, onComplete }: Props) {
  const [ins] = useState<Insets>(() =>
    typeof window === 'undefined'
      ? { top: 30, right: 42, bottom: 30, left: 42 }
      : computeInsets(window.innerWidth, window.innerHeight)
  )
  const [revealing, setRevealing] = useState(false)

  useEffect(() => {
    // Start the reveal on next frame so the initial clip-path renders first
    // and the CSS transition has two distinct values to interpolate between.
    const start = window.requestAnimationFrame(() => setRevealing(true))
    const done  = onComplete
      ? window.setTimeout(onComplete, ANIM_S * 1000 + 60)
      : null
    return () => {
      cancelAnimationFrame(start)
      if (done) clearTimeout(done)
    }
  }, [onComplete])

  // Sharp rectangle throughout — center card has no border-radius, so the
  // shrinking plate stays as a clean axis-aligned rectangle. The "organic"
  // feel comes from the cubic-bezier ease curve plus the simultaneous grid
  // bloom (gridIntro CSS keyframe).
  const fullClip = 'inset(0% 0% 0% 0%)'
  const cardClip = `inset(${ins.top}% ${ins.right}% ${ins.bottom}% ${ins.left}%)`

  return (
    <div
      aria-hidden
      style={{
        position:        'fixed',
        inset:           0,
        zIndex:          800,
        backgroundColor: theme.bg,
        pointerEvents:   'none',
        willChange:      'clip-path',
        clipPath:        revealing ? cardClip : fullClip,
        transition:      `clip-path ${ANIM_S}s cubic-bezier(0.43, 0.13, 0.23, 0.96)`,
      }}
    />
  )
}
