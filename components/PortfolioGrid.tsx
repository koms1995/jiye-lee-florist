'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

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
const MOBILE_CELL_ASPECT   = 1.30   // cellH / colW — keeps cells portrait
const MOBILE_COL_W_RATIO   = 0.641  //  regardless of viewport height (which
                                    //  shrinks on iOS Safari with URL bar).
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

  let colW: number, cellH: number, gridOffset: number
  if (isMobile) {
    // Derive cellH from colW (NOT viewport height). iOS Safari's innerHeight
    // shrinks when the URL bar is visible, which would make cells more square.
    // Fixed aspect ratio guarantees portrait cells across all environments.
    colW       = Math.round(w * MOBILE_COL_W_RATIO)
    cellH      = Math.round(colW * MOBILE_CELL_ASPECT)
    gridOffset = Math.round((w - (N_COLS * colW + (N_COLS - 1) * GAP)) / 2)
  } else {
    colW       = Math.round((w - (N_COLS - 1) * GAP) / N_COLS)
    cellH      = Math.round(h * DESKTOP_CELL_H_RATIO)
    gridOffset = 0
  }

  const stripH = N_ROWS * (cellH + GAP)

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
  onImageClick?: (layoutId: string, src: string) => void
}

export default function PortfolioGrid({ images, onProfileClick, onImageClick }: Props) {
  const [dims, setDims]   = useState<Dims | null>(null)
  const [ready, setReady] = useState(false)

  const dimsRef        = useRef<Dims | null>(null)
  const initYRef       = useRef(0)
  const accumRef       = useRef(0)
  const containerRef   = useRef<HTMLDivElement | null>(null)
  const colRefs        = useRef<(HTMLDivElement | null)[]>(Array(N_COLS).fill(null))

  // Inertia
  const inertia      = useRef<{ vel: number; rafId: number | null }>({ vel: 0, rafId: null })
  const isDragging   = useRef(false)
  const introPlayed  = useRef(false)

  // RAF batching: prevents >1 DOM update per frame during fast input
  const pendingRaf   = useRef<number | null>(null)
  const pendingAccum = useRef(0)

  // Keep callbacks fresh inside stable native event handlers
  const onProfileClickRef = useRef(onProfileClick)
  useEffect(() => { onProfileClickRef.current = onProfileClick }, [onProfileClick])
  const onImageClickRef = useRef(onImageClick)
  useEffect(() => { onImageClickRef.current = onImageClick }, [onImageClick])

  // ── Cache-warming preloader ───────────────────────────────────────────────
  // The grid cycles through STRIP_COPIES copies of the same set of images.
  // With native lazy-loading, the user sees a brief fetch hiccup the first
  // time each unique image enters the viewport — so the first full scroll
  // cycle stutters before everything is cached.
  //
  // Fix: as soon as the page is interactive, kick off background fetches for
  // every unique image at the optimized variant Next.js will request anyway.
  // Browser dedupes the in-flight requests with the actual <Image>'s ones, so
  // by the time strips scroll into view, frames hit the HTTP cache instantly.
  useEffect(() => {
    if (typeof window === 'undefined' || images.length === 0) return
    const unique = Array.from(new Set(images))
    // 640 covers up to ~3x DPR for our 250px-wide mobile cells with q=70.
    // Same variant Next.js's <Image> picks for the visible cells, so the
    // cache entries align and the actual <Image> mounts hit a warm cache.
    const optimized = (src: string) =>
      `/_next/image?url=${encodeURIComponent(src)}&w=640&q=70`

    let cancelled = false
    const fire = () => {
      if (cancelled) return
      for (const src of unique) {
        // Fire-and-forget — browser HTTP cache holds the response
        const img = new window.Image()
        img.decoding = 'async'
        img.src = optimized(src)
      }
    }

    // Defer to idle time so it doesn't compete with first paint / hydration
    type IdleHandle = number
    type IdleWin = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => IdleHandle
      cancelIdleCallback?:  (id: IdleHandle) => void
    }
    const w = window as IdleWin
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(fire, { timeout: 1500 })
      return () => { cancelled = true; w.cancelIdleCallback?.(id) }
    }
    const id = window.setTimeout(fire, 500)
    return () => { cancelled = true; clearTimeout(id) }
  }, [images])

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

    // Page-load intro: grid drifts upward into centered position
    const introRaf = { id: null as number | null }
    if (!introPlayed.current) {
      introPlayed.current = true
      const INTRO    = -300
      const DURATION = 850
      const start    = performance.now()
      accumRef.current = INTRO
      updateColumns(INTRO)
      function stepIntro() {
        const p = Math.min((performance.now() - start) / DURATION, 1)
        const e = 1 - Math.pow(1 - p, 3)          // ease-out cubic
        accumRef.current = INTRO * (1 - e)
        updateColumns(accumRef.current)
        if (p < 1) { introRaf.id = requestAnimationFrame(stepIntro) }
      }
      introRaf.id = requestAnimationFrame(stepIntro)
    }

    const safeEl = el  // narrowed const; closures can't widen it back to null

    // Helper: walk DOM upward looking for either a TextCard (data-si) or an
    // ImageCell (data-img-id). Returns whichever is hit first — TextCards
    // and image cells are siblings, so the inner one wins.
    type Hit =
      | { kind: 'card'; si: number; bg: string }
      | { kind: 'image'; layoutId: string; src: string }
    function findHit(x: number, y: number, root: HTMLElement): Hit | null {
      let node = document.elementFromPoint(x, y) as HTMLElement | null
      while (node && node !== root) {
        if (node.dataset.si !== undefined) {
          return { kind: 'card', si: parseInt(node.dataset.si), bg: node.dataset.bg ?? '' }
        }
        if (node.dataset.imgId !== undefined) {
          return { kind: 'image', layoutId: node.dataset.imgId, src: node.dataset.imgSrc ?? '' }
        }
        node = node.parentElement
      }
      return null
    }
    const dispatchHit = (hit: Hit | null) => {
      if (!hit) return
      if (hit.kind === 'card') onProfileClickRef.current(hit.bg, hit.si)
      else if (onImageClickRef.current) onImageClickRef.current(hit.layoutId, hit.src)
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
        const t = e.changedTouches[0]
        dispatchHit(findHit(t.clientX, t.clientY, safeEl))
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
        dispatchHit(findHit(e.clientX, e.clientY, safeEl))
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
      if (introRaf.id !== null) cancelAnimationFrame(introRaf.id)
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
        overflow:        'clip',
        opacity:         ready ? 1 : 0,
        transition:      'opacity 0.5s ease',
        touchAction:     'none',
        cursor:          'ns-resize',
        backgroundColor: '#F3E5CD',
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
                  backgroundColor: '#F3E5CD',
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
                      layoutId={`img-${c}-${si}-${r}`}
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
// motion.div + layoutId enables shared-layout animation to the lightbox.
// next/image gives Vercel-side image optimization: the source 1800×3000
// JPEGs get resized + served as WebP/AVIF responsive variants, dropping
// payload from megabytes per image to ~50KB per cell.
function ImageCell({ top, width, height, src, layoutId }: {
  top: number; width: number; height: number; src: string; layoutId: string
}) {
  return (
    <motion.div
      layoutId={layoutId}
      data-img-id={layoutId}
      data-img-src={src}
      transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
      style={{
        position:      'absolute',
        top, left:     0,
        width, height,
        overflow:      'hidden',
        pointerEvents: 'auto',
        cursor:        'zoom-in',
      }}
    >
      <Image
        src={src}
        alt=""
        fill
        // Tell the browser/Next which size variant to fetch for each viewport
        sizes="(max-width: 640px) 250px, 280px"
        quality={70}
        draggable={false}
        style={{
          objectFit:     'cover',
          pointerEvents: 'none',
          userSelect:    'none',
        }}
      />
    </motion.div>
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
          <br />FOR EVENTS &amp; EDITORIAL.
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
