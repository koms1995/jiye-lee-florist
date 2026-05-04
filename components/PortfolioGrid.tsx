'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue } from 'framer-motion'

// ── Constants ──────────────────────────────────────────────────────────────────
const N_ROWS       = 5        // rows per column-strip (matches nrly.co 5-row page)
const N_COLORS     = 4
const STRIP_COPIES = 12       // must be multiple of N_COLORS; 12 = 3 color cycles, ample for wrap
const SCROLL_START = 500_000
const GAP          = 2        // px gap between every cell (row and column)

// ── Column config ──────────────────────────────────────────────────────────────
// nrly.co: 5 cols on both desktop and mobile; outer cols faster for parallax depth
const N_COLS   = 5
const SPEEDS   = [1.14, 0.88, 1.00, 0.88, 1.14] as const
const TEXT_COL = 2   // center column
const TEXT_ROW = 2   // middle row of 5

// nrly.co cell height ratios (measured: 414/900 desktop, 312/844 mobile)
const DESKTOP_CELL_H_RATIO = 0.46
const MOBILE_CELL_H_RATIO  = 0.37

// nrly.co mobile: each col ≈ 250px on 390px viewport → grid bleeds off both sides
const MOBILE_COL_W_RATIO = 0.641

// Image offsets: 5 cols — 5+5+4+5+5 = 24 images
const IMG_OFFSETS = [0, 5, 10, 14, 19] as const

// ── Colorways ──────────────────────────────────────────────────────────────────
type Colorway = { bg: string; name: string; text: string }
const COLORWAYS: Colorway[] = [
  { bg: '#C9A99A', name: '#2E1F1F', text: '#2E1F1F' },
  { bg: '#2E1F1F', name: '#EDE0D4', text: '#EDE0D4' },
  { bg: '#F5F0EB', name: '#3D2B2B', text: '#3D2B2B' },
  { bg: '#7A5C5C', name: '#F5F0EB', text: '#F5F0EB' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]
  let s = seed
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Dims ───────────────────────────────────────────────────────────────────────
type Dims = {
  nCols:      number
  colW:       number
  cellH:      number
  stripH:     number
  textCol:    number
  speeds:     readonly number[]
  imgOffsets: readonly number[]
  isMobile:   boolean
  gridOffset: number   // left shift so center col (col 2) sits in viewport center on mobile
}

function computeDims(w: number, h: number): Dims {
  const isMobile = w < 640
  const cellH    = Math.round(h * (isMobile ? MOBILE_CELL_H_RATIO : DESKTOP_CELL_H_RATIO))
  // Trailing GAP after last row becomes the inter-strip gap — keeps wrap seamless
  const stripH   = N_ROWS * (cellH + GAP)

  let colW: number, gridOffset: number
  if (isMobile) {
    colW       = Math.round(w * MOBILE_COL_W_RATIO)
    gridOffset = Math.round((w - (N_COLS * colW + (N_COLS - 1) * GAP)) / 2)
  } else {
    colW       = Math.round((w - (N_COLS - 1) * GAP) / N_COLS)
    gridOffset = 0
  }

  return {
    nCols: N_COLS, colW, cellH, stripH,
    textCol:    TEXT_COL,
    speeds:     SPEEDS,
    imgOffsets: IMG_OFFSETS,
    isMobile,
    gridOffset,
  }
}

// ── Main component ─────────────────────────────────────────────────────────────
interface Props {
  images: string[]
  onProfileClick: (bg: string, si: number) => void
}

export default function PortfolioGrid({ images, onProfileClick }: Props) {
  const [dims, setDims]   = useState<Dims | null>(null)
  const [ready, setReady] = useState(false)
  const dimsRef  = useRef<Dims | null>(null)
  const initYRef = useRef(0)

  // 5 MotionValues — one per column. Declared at top level (hooks can't be in loops).
  const dispY0 = useMotionValue(0)
  const dispY1 = useMotionValue(0)
  const dispY2 = useMotionValue(0)
  const dispY3 = useMotionValue(0)
  const dispY4 = useMotionValue(0)
  const dispYs = useRef([dispY0, dispY1, dispY2, dispY3, dispY4])

  // ── Setup: scroll plumbing, init, resize ────────────────────────────────────
  useEffect(() => {
    if (typeof history !== 'undefined') history.scrollRestoration = 'manual'

    document.documentElement.style.overflow = 'visible'
    document.documentElement.style.height   = 'auto'
    document.body.style.overflow             = 'visible'
    document.body.style.height               = 'auto'
    document.body.style.minHeight            = `${SCROLL_START * 2}px`
    document.documentElement.style.overscrollBehavior = 'none'
    document.body.style.overscrollBehavior             = 'none'

    let rafId: number | null = null

    // Modular wrap: brings y into [lo, lo+wrapSize) without while-loops.
    // wrapSize = N_COLORS * stripH → colorway index is preserved across teleports.
    function wrappedY(y: number, lo: number, wrapSize: number): number {
      return ((y - lo) % wrapSize + wrapSize) % wrapSize + lo
    }

    function updateColumns() {
      rafId = null
      const d = dimsRef.current
      if (!d) return
      const delta    = window.scrollY - SCROLL_START
      const initY    = initYRef.current
      const wrapSize = N_COLORS * d.stripH
      const lo       = -(STRIP_COPIES - N_COLORS) * d.stripH
      for (let c = 0; c < d.nCols; c++) {
        dispYs.current[c].set(wrappedY(initY - delta * d.speeds[c], lo, wrapSize))
      }
    }

    function onScroll() {
      // Batch multiple scroll events into one RAF — avoids redundant updates.
      if (rafId === null) rafId = requestAnimationFrame(updateColumns)
    }

    function init() {
      const w = window.innerWidth
      const h = window.innerHeight
      const d = computeDims(w, h)
      dimsRef.current = d

      const midCopy    = Math.floor(STRIP_COPIES / 2)
      const textCenter = midCopy * d.stripH + TEXT_ROW * d.cellH + d.cellH / 2
      initYRef.current = Math.round(-(textCenter - h / 2))

      // Apply initial positions directly (no scroll event yet)
      updateColumns()
      setDims(d)
      setReady(true)
    }

    init()
    window.scrollTo(0, SCROLL_START)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', init)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', init)
      if (rafId !== null) cancelAnimationFrame(rafId)
      document.documentElement.style.overflow = ''
      document.documentElement.style.height   = ''
      document.body.style.overflow             = ''
      document.body.style.height               = ''
      document.body.style.minHeight            = ''
      document.documentElement.style.overscrollBehavior = ''
      document.body.style.overscrollBehavior             = ''
    }
  }, [])

  // ── Per-column image arrays ────────────────────────────────────────────────
  // Desktop: offsets [0,5,10,14,19] → 5+5+4+5+5 = 24 images, all used
  // Mobile:  col 2 (center, only fully-visible col) gets all 24 images so every
  //          image is eventually seen as the user scrolls; side cols use offsets.
  const colImages = useMemo((): string[][] => {
    if (!dims || images.length === 0) return []
    const shuffled = seededShuffle(images, 42)
    const { nCols, imgOffsets, textCol, isMobile } = dims

    return Array.from({ length: nCols }, (_, c) => {
      if (isMobile && c === textCol) return shuffled   // all 24 cycle through center col
      const off = imgOffsets[c]
      return Array.from({ length: N_ROWS }, (_, i) =>
        shuffled[(off + i) % shuffled.length]
      )
    })
  }, [dims, images])

  if (!dims) return null
  const { nCols, colW, cellH, stripH, textCol, isMobile, gridOffset } = dims

  return (
    // Fixed visual layer — pointer-events none so scroll events reach document;
    // touch-action pan-y explicitly allows iOS vertical touch-scroll.
    <div
      className="fixed inset-0 select-none"
      style={{
        overflow: 'clip',
        opacity: ready ? 1 : 0,
        transition: 'opacity 0.5s ease',
        pointerEvents: 'none',
        touchAction: 'pan-y',
      }}
    >
      {Array.from({ length: nCols }, (_, c) => (
        <motion.div
          key={c}
          style={{
            y:                dispYs.current[c],
            position:         'absolute',
            left:             gridOffset + c * (colW + GAP),
            top:              0,
            width:            colW,
            height:           STRIP_COPIES * stripH,
            willChange:       'transform',
            backfaceVisibility: 'hidden',
          }}
        >
          {Array.from({ length: STRIP_COPIES }, (_, si) => {
            const colorway = COLORWAYS[si % N_COLORS]
            return (
              <div
                key={si}
                style={{
                  position:        'absolute',
                  top:             si * stripH,
                  left:            0,
                  width:           colW,
                  height:          stripH,
                  backgroundColor: colorway.bg,
                  contain:         'layout paint',
                }}
              >
                {Array.from({ length: N_ROWS }, (_, r) => {
                  const isText = c === textCol && r === TEXT_ROW
                  const top    = r * (cellH + GAP)

                  if (isText) {
                    return (
                      <TextCard
                        key={r}
                        top={top}
                        width={colW}
                        height={cellH}
                        colorway={colorway}
                        onProfileClick={onProfileClick}
                        isMobile={isMobile}
                        si={si}
                      />
                    )
                  }

                  // Map row index → image array index, skipping text-card slot
                  const imgIdx = (c === textCol && r > TEXT_ROW) ? r - 1 : r
                  const imgs   = colImages[c]
                  // Mobile center col: advance by strip so all 24 images cycle through
                  const IMGS_PER_STRIP = N_ROWS - 1
                  const src = (isMobile && c === textCol && imgs.length > N_ROWS)
                    ? imgs[(si * IMGS_PER_STRIP + imgIdx) % imgs.length] ?? ''
                    : imgs?.[imgIdx % (imgs?.length || 1)] ?? ''

                  return (
                    <ImageCell
                      key={r}
                      top={top}
                      width={colW}
                      height={cellH}
                      src={src}
                    />
                  )
                })}
              </div>
            )
          })}
        </motion.div>
      ))}
    </div>
  )
}

// ── ImageCell ──────────────────────────────────────────────────────────────────
function ImageCell({ top, width, height, src }: {
  top: number; width: number; height: number; src: string
}) {
  return (
    <div style={{ position: 'absolute', top, left: 0, width, height, overflow: 'hidden' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        draggable={false}
        loading="lazy"
        decoding="async"
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover', display: 'block',
          pointerEvents: 'none', userSelect: 'none',
        }}
      />
    </div>
  )
}

// ── TextCard ───────────────────────────────────────────────────────────────────
function TextCard({ top, width, height, colorway, onProfileClick, isMobile, si }: {
  top: number; width: number; height: number
  colorway: Colorway
  onProfileClick: (bg: string, si: number) => void
  isMobile: boolean
  si: number
}) {
  const [hovered, setHovered] = useState(false)
  const nameFontSize = Math.round(width * 0.38)
  const padV = Math.round(height * 0.09)
  const padH = Math.round(width * 0.10)

  return (
    <motion.div
      layoutId={`card-${si}`}
      onClick={() => onProfileClick(colorway.bg, si)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute', top, left: 0, width, height,
        backgroundColor: colorway.bg,
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: `${padV}px ${padH}px`,
        userSelect: 'none',
        overflow: 'hidden',
        filter: hovered ? 'brightness(0.92)' : 'none',
        transition: 'filter 0.18s ease',
        pointerEvents: 'auto',
        touchAction: 'pan-y',
      }}
    >
      <motion.h1
        layoutId={`name-${si}`}
        style={{
          fontFamily:    'var(--font-cormorant), Georgia, serif',
          fontWeight:    300,
          fontStyle:     'italic',
          fontSize:      nameFontSize,
          lineHeight:    0.85,
          letterSpacing: '-0.04em',
          color:         colorway.name,
          pointerEvents: 'none',
        }}
      >
        Jiye<br />Lee
      </motion.h1>

      <div style={{ pointerEvents: 'none' }}>
        <p style={{
          fontFamily:    'var(--font-inter), system-ui, sans-serif',
          fontSize:      isMobile ? '10px' : '11px',
          letterSpacing: '0.02em',
          lineHeight:    1.4,
          color:         colorway.text,
          textTransform: 'uppercase',
          marginBottom:  '0.6rem',
        }}>
          FLORAL ARTIST BASED IN SEOUL.
          <br />CRAFTING SEASONAL ARRANGEMENTS
          <br />FOR WEDDINGS, EVENTS & EDITORIAL.
        </p>
        <p style={{
          fontFamily:    'var(--font-inter), system-ui, sans-serif',
          fontSize:      isMobile ? '10px' : '11px',
          letterSpacing: '0.06em',
          color:         colorway.text,
          textTransform: 'uppercase',
        }}>
          PROFILE ↗
        </p>
      </div>
    </motion.div>
  )
}
