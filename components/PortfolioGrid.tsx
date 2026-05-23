'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { N_THEMES, themeForStrip, type Theme } from './themes'

// ── Constants ──────────────────────────────────────────────────────────────────
const N_ROWS       = 5
const N_COLORS     = N_THEMES   // colorway cycle aligned to themes module
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

// ── Hero overrides — fixed images that sit directly above and below the
// mauve-pink (colorway-0) text card. Initial scroll lands on this card, so
// these are the first images the user sees flanking the center. They also
// repeat for every colorway-0 strip across the wrap, keeping the visual
// signature consistent every time the user scrolls back to that card.
const HERO_TOP_IMG    = '/images/gallery/013.jpeg'
const HERO_BOTTOM_IMG = '/images/gallery/01.jpeg'
const HERO_TOP_ROW    = 1   // cell directly above the row-2 text card
const HERO_BOTTOM_ROW = 3   // cell directly below

// Momentum
const FRICTION = 0.92   // velocity decay per frame
const MIN_VEL  = 0.3    // stop threshold (px/frame)

// Colorways now come from `./themes` — each card uses themeForStrip(si).

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
  /** Receives the strip index. The theme is then derived via themeForStrip(si). */
  onProfileClick: (si: number) => void
  onImageClick?: (layoutId: string, src: string) => void
  /** When the modal is open, this is the active card's strip index — TextCards
   *  whose si matches will fade out their bio/PROFILE elements during the
   *  layoutId expansion to the modal. */
  activeProfileSi?: number | null
}

export default function PortfolioGrid({ images, onProfileClick, onImageClick, activeProfileSi }: Props) {
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
    // Pick the variant the browser is most likely to request on this device
    // so the preload aligns with the actual <Image> fetches and warms the
    // HTTP cache. Mobile uses 640 (covers retina), desktop uses 1080 (covers
    // wide retina monitors with sizes=22vw at q=80).
    const isMob = window.innerWidth < 640
    const variantW = isMob ? 640 : 1080
    const optimized = (src: string) =>
      `/_next/image?url=${encodeURIComponent(src)}&w=${variantW}&q=80`

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

      // Center the initial view on a strip whose colorway is THEMES[2]
      // (the cream / hot-pink theme). midCopy must satisfy
      // midCopy % N_COLORS === 2 so the wrap-aligned hero override images
      // also land on this colorway every cycle.
      //
      // BUG FIX: the previous textCenter formula multiplied TEXT_ROW by
      // cellH alone — but rows are spaced by (cellH + GAP), so the actual
      // card center sits 2*GAP=30px BELOW the formula's result. That
      // discrepancy made the IntroReveal's clip-path land 30px above the
      // real TextCard, producing a 30px snap when the overlay unmounted.
      const midCopy    = 6   // 6 % N_COLORS(4) === 2 → colorway 2 (cream)
      const textCenter = midCopy * d.stripH + TEXT_ROW * (d.cellH + GAP) + d.cellH / 2
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

    // Note: the page-load intro is now handled visually by PortfolioApp's
    // IntroReveal overlay (clip-path shrink) + a CSS keyframe (gridIntro)
    // applied to this container's `animation` style — see the outer JSX
    // below. We no longer drift columns from accumRef = -300, because the
    // IntroReveal already centers the user's attention; doubling up with a
    // column-translate animation just delays the reveal of the surrounding
    // images.
    introPlayed.current = true

    const safeEl = el  // narrowed const; closures can't widen it back to null

    // Helper: walk DOM upward looking for either a TextCard (data-si) or an
    // ImageCell (data-img-id). Returns whichever is hit first.
    type Hit =
      | { kind: 'card'; si: number }
      | { kind: 'image'; layoutId: string; src: string }
    function findHit(x: number, y: number, root: HTMLElement): Hit | null {
      let node = document.elementFromPoint(x, y) as HTMLElement | null
      while (node && node !== root) {
        if (node.dataset.si !== undefined) {
          return { kind: 'card', si: parseInt(node.dataset.si) }
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
      if (hit.kind === 'card') onProfileClickRef.current(hit.si)
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
    // Full-viewport overlay — no native scroll; we drive it ourselves.
    // gridIntro: 0.85 → 1 + 0 → 1 over 400ms starting at 300ms (matches
    // the user's 300–700ms grid-bloom window). Pairs with IntroReveal's
    // clip-path shrink to give the bg-condense / grid-bloom rhythm.
    <div
      ref={containerRef}
      className="fixed inset-0 select-none"
      style={{
        overflow:        'clip',
        touchAction:     'none',
        cursor:          'ns-resize',
        backgroundColor: '#fffbf5',
        animation:       ready ? 'gridIntro 0.4s cubic-bezier(0.43, 0.13, 0.23, 0.96) 0.3s both' : 'none',
        opacity:         ready ? undefined : 0,
        transformOrigin: 'center center',
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
            const theme = themeForStrip(si)
            return (
              <div
                key={si}
                style={{
                  position:        'absolute',
                  top:             si * stripH,
                  left:            0,
                  width:           colW,
                  height:          stripH,
                  backgroundColor: '#fffbf5',
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
                        theme={theme}
                        isMobile={isMobile}
                        si={si}
                        isActive={activeProfileSi === si}
                      />
                    )
                  }

                  const imgIdx        = (c === textCol && r > TEXT_ROW) ? r - 1 : r
                  const imgs          = colImages[c]
                  const IMGS_PER_STRIP = N_ROWS - 1

                  // Hero override: rows directly above/below the centered
                  // text card. Anchored to colorway-2 (cream) strips because
                  // that's where the initial scroll lands (midCopy=6, 6%4=2),
                  // so the user always sees these images flanking the
                  // centered card. Wraps seamlessly to strips 2 and 10 too.
                  const isHeroSlot = c === textCol && (si % N_COLORS) === 2
                  let src: string
                  if (isHeroSlot && r === HERO_TOP_ROW) {
                    src = HERO_TOP_IMG
                  } else if (isHeroSlot && r === HERO_BOTTOM_ROW) {
                    src = HERO_BOTTOM_IMG
                  } else if (isMobile && c === textCol && imgs.length > N_ROWS) {
                    // Mobile center column uses ALL images for variety, but
                    // the strip index is modulo'd by N_COLORS so wrap-aligned
                    // strips (0, 4, 8…) show the same images — no abrupt
                    // image swap at the wrap boundary.
                    src = imgs[((si % N_COLORS) * IMGS_PER_STRIP + imgIdx) % imgs.length] ?? ''
                  } else {
                    src = imgs?.[imgIdx % (imgs?.length || 1)] ?? ''
                  }

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
        // Mobile: fixed 250px (matches MOBILE_COL_W_RATIO * width).
        // Desktop: 22vw scales with the actual cell width on any monitor —
        // a 1920px display gets a much larger variant than a 1280px one,
        // so cells stay sharp on big screens instead of being upscaled.
        sizes="(max-width: 640px) 250px, 22vw"
        quality={80}
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
// data-si lets those handlers identify which card was tapped — the theme is
// derived from si on the consumer side via themeForStrip(si).
function TextCard({ top, width, height, theme, isMobile, si, isActive }: {
  top: number; width: number; height: number
  theme: Theme
  isMobile: boolean
  si: number
  /** True for the card whose modal is currently open — bio/PROFILE fades
   *  down + out so only the empty bg morphs to fullscreen. */
  isActive: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const nameFontSize = Math.round(width * 0.38)
  const padV = Math.round(height * 0.09)
  const padH = Math.round(width * 0.10)

  return (
    <motion.div
      layoutId={`card-${si}`}
      data-si={String(si)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // Mobile parity for the PROFILE underline: hover events don't fire
      // on touch devices, so use touchstart to flip `hovered` for the
      // duration of the touch. The native grid handlers in PortfolioGrid
      // still own drag/inertia detection — we just piggyback on touchstart
      // for the visual underline, and clear on touchend / touchcancel.
      onTouchStart={() => setHovered(true)}
      onTouchEnd={()   => setHovered(false)}
      onTouchCancel={() => setHovered(false)}
      // Spring physics for the card → modal layoutId expansion. Stiffness
      // 160 / damping 22 / mass 1 matches ProfileModal's LAYOUT_TRANSITION,
      // giving the card-to-fullscreen morph a weighty but slightly springy
      // landing — nrly.co's signature physics.
      transition={{ layout: { type: 'spring', stiffness: 160, damping: 22, mass: 1 } }}
      style={{
        position:        'absolute',
        top, left:       0,
        width, height,
        backgroundColor: theme.bg,
        cursor:          'pointer',
        display:         'flex',
        flexDirection:   'column',
        justifyContent:  'space-between',
        padding:         `${padV}px ${padH}px`,
        userSelect:      'none',
        overflow:        'hidden',
        filter:          hovered ? 'brightness(0.92)' : 'none',
        transition:      'filter 0.18s ease',
        touchAction:     'none',
      }}
    >
      <motion.h1
        layoutId={`name-${si}`}
        // 600–900ms: Jiye Lee rises y:20 → 0 + opacity 0 → 1 just as the
        // bg's clip-path is finishing its shrink. layoutId takes over on
        // subsequent modal open/close, smoothly interpolating the font size
        // between card (small) and modal (large) sizes.
        initial={{ y: 20, opacity: 0 }}
        animate={{
          y: 0, opacity: 1,
          transition: { delay: 0.6, duration: 0.3, ease: [0.43, 0.13, 0.23, 0.96] },
        }}
        style={{
          fontFamily:    'var(--font-cormorant), Georgia, serif',
          fontWeight:    300,
          fontStyle:     'italic',
          fontSize:      nameFontSize,
          lineHeight:    0.85,
          letterSpacing: '-0.04em',
          color:         theme.title,
          pointerEvents: 'none',
        }}
      >
        Jiye<br />Lee
      </motion.h1>

      {/* Bio + PROFILE container — shares the same intro rise (y:20→0,
          opacity 0→1) at 600–900ms. When the card becomes the active modal
          (isActive), the entire block fades DOWN (y:0→15) and OUT so the
          empty bg can morph to fullscreen unobstructed. */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={
          isActive
            ? { y: 15, opacity: 0, transition: { duration: 0.30, ease: 'easeOut' } }
            : { y: 0, opacity: 1, transition: { delay: 0.6, duration: 0.3, ease: [0.43, 0.13, 0.23, 0.96] } }
        }
        style={{ pointerEvents: 'none' }}
      >
        <p style={{
          fontFamily:    'var(--font-inter), system-ui, sans-serif',
          fontSize:      isMobile ? '10px' : '11px',
          letterSpacing: '0.02em',
          lineHeight:    1.4,
          color:         theme.body,
          textTransform: 'uppercase',
          marginBottom:  '0.6rem',
        }}>
          FLORAL DESIGNER BASED IN KOREA.
          <br />CRAFTING SEASONAL ARRANGEMENTS
          <br />FOR COMMERCIAL, EVENTS &amp; EDITORIAL.
        </p>
        <p style={{
          fontFamily:    'var(--font-inter), system-ui, sans-serif',
          fontSize:      isMobile ? '10px' : '11px',
          letterSpacing: '0.06em',
          color:         theme.body,
          textTransform: 'uppercase',
        }}>
          {/* PROFILE underline — 1px line wipes left→right on hover/touch.
              0.3s timing per spec. */}
          <span style={{ position: 'relative', display: 'inline-block' }}>
            PROFILE
            <span
              aria-hidden
              style={{
                position:        'absolute',
                left:            0,
                right:           0,
                bottom:          -2,
                height:          1,
                backgroundColor: 'currentColor',
                transformOrigin: 'left center',
                transform:       hovered ? 'scaleX(1)' : 'scaleX(0)',
                transition:      'transform 0.30s cubic-bezier(0.76, 0, 0.24, 1)',
              }}
            />
          </span>
          {' ↗'}
        </p>
      </motion.div>
    </motion.div>
  )
}
