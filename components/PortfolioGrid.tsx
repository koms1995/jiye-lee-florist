'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// ── Constants ──────────────────────────────────────────────────────────────────
const N_ROWS       = 5
const N_COLORS     = 4
const STRIP_COPIES = 12
const GAP          = 15

const N_COLS   = 5
const SPEEDS   = [1.14, 0.88, 1.00, 0.88, 1.14] as const
const TEXT_COL = 2
const TEXT_ROW = 2

const DESKTOP_CELL_H_RATIO = 0.46
const MOBILE_CELL_H_RATIO  = 0.37
const MOBILE_COL_W_RATIO   = 0.641
const IMG_OFFSETS           = [0, 5, 10, 14, 19] as const

// Momentum
const FRICTION = 0.92   // velocity decay per frame
const MIN_VEL  = 0.3    // stop threshold (px/frame)

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

  const dimsRef        = useRef<Dims | null>(null)
  const initYRef       = useRef(0)
  const accumRef       = useRef(0)
  const containerRef   = useRef<HTMLDivElement | null>(null)
  const colRefs        = useRef<(HTMLDivElement | null)[]>(Array(N_COLS).fill(null))

  // Inertia
  const inertia    = useRef<{ vel: number; rafId: number | null }>({ vel: 0, rafId: null })
  const isDragging = useRef(false)

  // RAF batching: prevents >1 DOM update per frame during fast input
  const pendingRaf   = useRef<number | null>(null)
  const pendingAccum = useRef(0)

  // Keep onProfileClick fresh inside stable native event handlers
  const onProfileClickRef = useRef(onProfileClick)
  useEffect(() => { onProfileClickRef.current = onProfileClick }, [onProfileClick])

  // ── Core: direct DOM transform (no framer-motion overhead in scroll loop) ──
  function updateColumns(accum: number) {
    const d = dimsRef.current
    if (!d) return
    const wrapSize = N_COLORS * d.stripH
    const lo       = -(STRIP_COPIES - N_COLORS) * d.stripH
    for (let c = 0; c < d.nCols; c++) {
      const y  = wrappedY(initYRef.current - accum * d.speeds[c], lo, wrapSize)
      const el = colRefs.current[c]
      if (el) el.style.transform = `translateY(${y}px)`
    }
  }

  // Schedule one DOM update per animation frame (batches rapid input events)
  function scheduleUpdate(accum: number) {
    pendingAccum.current = accum
    if (pendingRaf.current === null) {
      pendingRaf.current = requestAnimationFrame(() => {
        pendingRaf.current = null
        updateColumns(pendingAccum.current)
      })
    }
  }

  // Inertia decay loop (runs in its own RAF — calls updateColumns directly, not scheduled)
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

  function stopInertia() {
    const ia = inertia.current
    if (ia.rafId !== null) { cancelAnimationFrame(ia.rafId); ia.rafId = null }
    ia.vel = 0
  }

  // ── Init + resize ──────────────────────────────────────────────────────────
  useEffect(() => {
    function init() {
      const w = window.innerWidth
      const h = window.innerHeight
      const d = computeDims(w, h)
      dimsRef.current = d

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
      if (pendingRaf.current  !== null) cancelAnimationFrame(pendingRaf.current)
    }
  }, [])

  // ── Native event listeners ─────────────────────────────────────────────────
  // Runs once after ready→true, so containerRef and colRefs are populated.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Set initial column transforms now that colRefs are populated
    updateColumns(accumRef.current)

    const safeEl = el  // narrowed const; closures can't widen it back to null

    // Helper: walk DOM upward looking for a TextCard (has data-si)
    function findCard(x: number, y: number, root: HTMLElement): { si: number; bg: string } | null {
      let node = document.elementFromPoint(x, y) as HTMLElement | null
      while (node && node !== root) {
        if (node.dataset.si !== undefined) {
          return { si: parseInt(node.dataset.si), bg: node.dataset.bg ?? '' }
        }
        node = node.parentElement
      }
      return null
    }

    // ── Touch (mobile) ──────────────────────────────────────────────────────
    let touchStartY = 0
    let touchLastY  = 0
    let touchLastT  = 0
    let touching    = false

    function onTouchStart(e: TouchEvent) {
      touching    = true
      touchStartY = touchLastY = e.touches[0].clientY
      touchLastT  = performance.now()
      isDragging.current = false
      stopInertia()
    }

    function onTouchMove(e: TouchEvent) {
      if (!touching) return
      e.preventDefault()                     // blocks iOS rubber-band scroll
      const t   = e.touches[0]
      const now = performance.now()
      const dy  = t.clientY - touchLastY
      const dt  = Math.max(now - touchLastT, 1)

      if (Math.abs(t.clientY - touchStartY) > 3) isDragging.current = true

      inertia.current.vel = (-dy / dt) * 16.67  // negated: vel tracks accum change rate
      touchLastY = t.clientY
      touchLastT = now

      accumRef.current -= dy
      scheduleUpdate(accumRef.current)
    }

    function onTouchEnd(e: TouchEvent) {
      if (!touching) return
      touching = false
      if (!isDragging.current) {
        const t    = e.changedTouches[0]
        const card = findCard(t.clientX, t.clientY, safeEl)
        if (card) onProfileClickRef.current(card.bg, card.si)
      } else {
        startInertia()
      }
    }

    // ── Mouse drag (desktop) ────────────────────────────────────────────────
    let mouseDown   = false
    let mouseLastY  = 0
    let mouseLastT  = 0
    let mouseStartY = 0

    function onMouseDown(e: MouseEvent) {
      mouseDown   = true
      mouseStartY = mouseLastY = e.clientY
      mouseLastT  = performance.now()
      isDragging.current = false
      stopInertia()
    }

    function onMouseMove(e: MouseEvent) {
      if (!mouseDown) return
      const now = performance.now()
      const dy  = e.clientY - mouseLastY
      const dt  = Math.max(now - mouseLastT, 1)

      if (Math.abs(e.clientY - mouseStartY) > 3) isDragging.current = true

      inertia.current.vel = (-dy / dt) * 16.67  // negated: vel tracks accum change rate
      mouseLastY = e.clientY
      mouseLastT = now

      accumRef.current -= dy
      scheduleUpdate(accumRef.current)
    }

    function onMouseUp(e: MouseEvent) {
      if (!mouseDown) return
      mouseDown = false
      if (!isDragging.current) {
        const card = findCard(e.clientX, e.clientY, safeEl)
        if (card) onProfileClickRef.current(card.bg, card.si)
      } else {
        startInertia()
      }
    }

    // ── Wheel (trackpad + mouse wheel) ──────────────────────────────────────
    function onWheel(e: WheelEvent) {
      stopInertia()
      accumRef.current += e.deltaY
      // Mouse wheel: large discrete delta → add mild inertia kick
      if (Math.abs(e.deltaY) > 40) {
        inertia.current.vel = e.deltaY * 0.15
        startInertia()
      } else {
        scheduleUpdate(accumRef.current)
      }
    }

    el.addEventListener('touchstart',  onTouchStart, { passive: true  })
    el.addEventListener('touchmove',   onTouchMove,  { passive: false }) // needs preventDefault
    el.addEventListener('touchend',    onTouchEnd,   { passive: true  })
    el.addEventListener('touchcancel', onTouchEnd,   { passive: true  })
    el.addEventListener('mousedown',   onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    el.addEventListener('wheel',       onWheel,      { passive: true  })

    return () => {
      el.removeEventListener('touchstart',  onTouchStart)
      el.removeEventListener('touchmove',   onTouchMove)
      el.removeEventListener('touchend',    onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
      el.removeEventListener('mousedown',   onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
      el.removeEventListener('wheel',       onWheel)
    }
  }, [ready]) // re-runs once ready→true so containerRef is actually in the DOM

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
    // Full-viewport overlay — no native scroll; we drive it ourselves
    <div
      ref={containerRef}
      className="fixed inset-0 select-none"
      style={{
        overflow:    'clip',
        opacity:     ready ? 1 : 0,
        transition:  'opacity 0.5s ease',
        touchAction: 'none',   // disable native scroll; our touchmove handles it
        cursor:      'ns-resize',
      }}
    >
      {Array.from({ length: nCols }, (_, c) => (
        // Regular div: transform set directly via colRefs — no framer-motion overhead
        <div
          key={c}
          ref={el => { colRefs.current[c] = el }}
          style={{
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

                  const imgIdx        = (c === textCol && r > TEXT_ROW) ? r - 1 : r
                  const imgs          = colImages[c]
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
        </div>
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
// Tap detection is handled by the parent container's native event handlers.
// data-si / data-bg let those handlers identify which card was tapped.
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
