'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue } from 'framer-motion'

// ── Constants ──────────────────────────────────────────────────────────────────
const N_ROWS       = 5
const N_COLORS     = 4
const STRIP_COPIES = 12
const GAP          = 2

const N_COLS   = 5
const SPEEDS   = [1.14, 0.88, 1.00, 0.88, 1.14] as const
const TEXT_COL = 2
const TEXT_ROW = 2

const DESKTOP_CELL_H_RATIO = 0.46
const MOBILE_CELL_H_RATIO  = 0.37
const MOBILE_COL_W_RATIO   = 0.641
const IMG_OFFSETS           = [0, 5, 10, 14, 19] as const

// Momentum decay: 0.92^60 ≈ 0.007 → stops within ~1 second
const FRICTION = 0.92
const MIN_VEL  = 0.3   // px/frame threshold to stop inertia

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

function wrappedY(y: number, lo: number, wrapSize: number): number {
  return ((y - lo) % wrapSize + wrapSize) % wrapSize + lo
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
  gridOffset: number
}

function computeDims(w: number, h: number): Dims {
  const isMobile = w < 640
  const cellH    = Math.round(h * (isMobile ? MOBILE_CELL_H_RATIO : DESKTOP_CELL_H_RATIO))
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

  // Virtual scroll accumulator — replaces window.scrollY (no 1M px body needed)
  const accumRef = useRef(0)

  // Inertia state
  const inertia = useRef<{ vel: number; rafId: number | null }>({ vel: 0, rafId: null })

  // Pointer tracking
  const ptr = useRef<{ active: boolean; lastY: number; lastT: number }>({ active: false, lastY: 0, lastT: 0 })

  // Drag vs tap detection (shared with TextCard via data attributes)
  const isDragging = useRef(false)

  // MotionValues — one per column, declared at top level (no loops)
  const dispY0 = useMotionValue(0)
  const dispY1 = useMotionValue(0)
  const dispY2 = useMotionValue(0)
  const dispY3 = useMotionValue(0)
  const dispY4 = useMotionValue(0)
  const dispYs = useRef([dispY0, dispY1, dispY2, dispY3, dispY4])

  // ── Column update ──────────────────────────────────────────────────────────
  function updateColumns(accum: number) {
    const d = dimsRef.current
    if (!d) return
    const wrapSize = N_COLORS * d.stripH
    const lo       = -(STRIP_COPIES - N_COLORS) * d.stripH
    for (let c = 0; c < d.nCols; c++) {
      dispYs.current[c].set(wrappedY(initYRef.current - accum * d.speeds[c], lo, wrapSize))
    }
  }

  // ── Inertia decay loop ─────────────────────────────────────────────────────
  function startInertia() {
    const ia = inertia.current
    if (ia.rafId !== null) cancelAnimationFrame(ia.rafId)
    function step() {
      if (Math.abs(ia.vel) < MIN_VEL) { ia.rafId = null; return }
      ia.vel       *= FRICTION
      accumRef.current += ia.vel
      updateColumns(accumRef.current)
      ia.rafId = requestAnimationFrame(step)
    }
    ia.rafId = requestAnimationFrame(step)
  }

  // ── Init + resize ──────────────────────────────────────────────────────────
  useEffect(() => {
    function init() {
      const w = window.innerWidth
      const h = window.innerHeight
      const d = computeDims(w, h)
      dimsRef.current = d

      // Position text card in viewport center at accum=0
      const midCopy    = Math.floor(STRIP_COPIES / 2)
      const textCenter = midCopy * d.stripH + TEXT_ROW * d.cellH + d.cellH / 2
      initYRef.current = Math.round(-(textCenter - h / 2))

      updateColumns(accumRef.current)
      setDims(d)
      setReady(true)
    }

    init()
    window.addEventListener('resize', init)
    return () => {
      window.removeEventListener('resize', init)
      if (inertia.current.rafId !== null) cancelAnimationFrame(inertia.current.rafId)
    }
  }, [])

  // ── Pointer handlers ───────────────────────────────────────────────────────
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const ia = inertia.current
    if (ia.rafId !== null) { cancelAnimationFrame(ia.rafId); ia.rafId = null }
    ia.vel = 0
    ptr.current = { active: true, lastY: e.clientY, lastT: performance.now() }
    isDragging.current = false
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch {}
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const p = ptr.current
    if (!p.active) return
    const now = performance.now()
    const dy  = e.clientY - p.lastY
    const dt  = Math.max(now - p.lastT, 1)

    if (Math.abs(e.clientY - ptr.current.lastY) > 3) isDragging.current = true

    // velocity in px/frame at 60fps — used for inertia on release
    inertia.current.vel = (dy / dt) * 16.67

    p.lastY = e.clientY
    p.lastT = now

    // Drag UP (dy < 0) → accum increases → content scrolls up
    accumRef.current -= dy
    updateColumns(accumRef.current)
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    ptr.current.active = false

    // Tap: small movement → find TextCard and fire profile click
    if (!isDragging.current) {
      let node = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      while (node && node !== e.currentTarget) {
        if (node.dataset.si !== undefined) {
          onProfileClick(node.dataset.bg ?? '', parseInt(node.dataset.si))
          return
        }
        node = node.parentElement
      }
    }

    startInertia()
  }

  // Wheel: trackpad delivers natural momentum, mouse wheel gets mild inertia
  function onWheel(e: React.WheelEvent<HTMLDivElement>) {
    const ia = inertia.current
    if (ia.rafId !== null) { cancelAnimationFrame(ia.rafId); ia.rafId = null }
    accumRef.current += e.deltaY
    // Mouse wheel: add inertia kick. Trackpad: OS momentum handles it.
    if (Math.abs(e.deltaY) > 30) {
      ia.vel = e.deltaY * 0.25
      startInertia()
    } else {
      ia.vel = 0
      updateColumns(accumRef.current)
    }
  }

  // ── Per-column image arrays ────────────────────────────────────────────────
  const colImages = useMemo((): string[][] => {
    if (!dims || images.length === 0) return []
    const shuffled = seededShuffle(images, 42)
    const { nCols, imgOffsets, textCol, isMobile } = dims

    return Array.from({ length: nCols }, (_, c) => {
      if (isMobile && c === textCol) return shuffled
      const off = imgOffsets[c]
      return Array.from({ length: N_ROWS }, (_, i) =>
        shuffled[(off + i) % shuffled.length]
      )
    })
  }, [dims, images])

  if (!dims) return null
  const { nCols, colW, cellH, stripH, textCol, isMobile, gridOffset } = dims

  return (
    // Fixed overlay — no native scroll, pointer events drive the grid
    <div
      className="fixed inset-0 select-none"
      style={{
        overflow:    'clip',
        opacity:     ready ? 1 : 0,
        transition:  'opacity 0.5s ease',
        touchAction: 'none',   // prevent native scroll; we handle it ourselves
        cursor:      'ns-resize',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      {Array.from({ length: nCols }, (_, c) => (
        <motion.div
          key={c}
          style={{
            y:                  dispYs.current[c],
            position:           'absolute',
            left:               gridOffset + c * (colW + GAP),
            top:                0,
            width:              colW,
            height:             STRIP_COPIES * stripH,
            willChange:         'transform',
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
                        isMobile={isMobile}
                        si={si}
                      />
                    )
                  }

                  const imgIdx = (c === textCol && r > TEXT_ROW) ? r - 1 : r
                  const imgs   = colImages[c]
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
// Click is handled by the parent container's onPointerUp (tap detection).
// data-si / data-bg allow the parent to identify which card was tapped.
function TextCard({ top, width, height, colorway, isMobile, si }: {
  top: number; width: number; height: number
  colorway: Colorway
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
      data-si={String(si)}
      data-bg={colorway.bg}
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
        touchAction: 'none',
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
          <br />FOR WEDDINGS, EVENTS &amp; EDITORIAL.
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
