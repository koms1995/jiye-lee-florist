'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion'

// ── Constants ──────────────────────────────────────────────────────────────────
const GAP          = 1
const N_COLORS     = 4
const STRIP_COPIES = N_COLORS * 5  // 20 copies, 5 full colorway cycles
// Large scroll buffer — user can scroll ~125 full colorway loops before edge
const SCROLL_START = 500_000

// ── Colorways — all high-contrast pairs ───────────────────────────────────────
type Colorway = { bg: string; name: string; text: string }

const COLORWAYS: Colorway[] = [
  { bg: '#C9A99A', name: '#2E1F1F', text: '#2E1F1F' },  // dusty rose + dark
  { bg: '#2E1F1F', name: '#EDE0D4', text: '#EDE0D4' },  // dark brown + cream
  { bg: '#F5F0EB', name: '#3D2B2B', text: '#3D2B2B' },  // parchment + dark
  { bg: '#7A5C5C', name: '#F5F0EB', text: '#F5F0EB' },  // warm plum + parchment
]

// ── Layout specs ───────────────────────────────────────────────────────────────
type CellSpec = { col: number; row: number; colSpan: number; type: 'image' | 'text' }

const DESKTOP_LAYOUT: CellSpec[] = [
  { col:0, row:0, colSpan:1, type:'image' },
  { col:1, row:0, colSpan:2, type:'image' },
  { col:3, row:0, colSpan:1, type:'image' },
  { col:4, row:0, colSpan:1, type:'image' },
  { col:0, row:1, colSpan:1, type:'image' },
  { col:1, row:1, colSpan:1, type:'image' },
  { col:2, row:1, colSpan:1, type:'text'  },
  { col:3, row:1, colSpan:1, type:'image' },
  { col:4, row:1, colSpan:1, type:'image' },
  { col:0, row:2, colSpan:1, type:'image' },
  { col:1, row:2, colSpan:1, type:'image' },
  { col:2, row:2, colSpan:2, type:'image' },
  { col:4, row:2, colSpan:1, type:'image' },
]

const MOBILE_LAYOUT: CellSpec[] = [
  { col:0, row:0, colSpan:1, type:'image' },
  { col:1, row:0, colSpan:1, type:'image' },
  { col:2, row:0, colSpan:1, type:'image' },
  { col:3, row:0, colSpan:1, type:'image' },
  { col:4, row:0, colSpan:1, type:'image' },
  { col:0, row:1, colSpan:1, type:'image' },
  { col:1, row:1, colSpan:1, type:'image' },
  { col:2, row:1, colSpan:1, type:'text'  },
  { col:3, row:1, colSpan:1, type:'image' },
  { col:4, row:1, colSpan:1, type:'image' },
  { col:0, row:2, colSpan:1, type:'image' },
  { col:1, row:2, colSpan:1, type:'image' },
  { col:2, row:2, colSpan:1, type:'image' },
  { col:3, row:2, colSpan:1, type:'image' },
  { col:4, row:2, colSpan:1, type:'image' },
]

// ── Dims ───────────────────────────────────────────────────────────────────────
type Dims = {
  unitW:      number
  shortH:     number
  tallH:      number
  stripW:     number
  stripH:     number
  xOffset:    number
  rowTops:    readonly [number, number, number]
  rowHeights: readonly [number, number, number]
  layout:     CellSpec[]
  isMobile:   boolean
}

function computeDims(w: number, h: number): Dims {
  const isMobile = w < 640
  const unitW    = isMobile ? Math.round(w * 0.641) : Math.round(w / 5)
  const stripW   = 5 * unitW
  const shortH   = Math.round(h * 0.26)
  const tallH    = Math.round(h * 0.45)
  const stripH   = 2 * shortH + tallH
  const xOffset  = isMobile ? Math.round(w / 2 - 2.5 * unitW) : 0
  const layout   = isMobile ? MOBILE_LAYOUT : DESKTOP_LAYOUT

  return {
    unitW, stripW, shortH, tallH, stripH, xOffset, layout, isMobile,
    rowTops:    [0, shortH, shortH + tallH],
    rowHeights: [shortH, tallH, shortH],
  }
}

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

// ── Cell render type ───────────────────────────────────────────────────────────
type CellRender = {
  key: string
  left: number; top: number; width: number; height: number
  type: 'image' | 'text'
  src?: string
}

// ── Main component ─────────────────────────────────────────────────────────────
interface Props { images: string[]; onProfileClick: () => void }

export default function PortfolioGrid({ images, onProfileClick }: Props) {
  const stripHRef = useRef(0)
  const initYRef  = useRef(0)
  const [dims, setDims] = useState<Dims | null>(null)
  const [ready, setReady] = useState(false)

  const rawY  = useMotionValue(0)
  const dispY = useMotionValue(0)

  // ── Init dims + scroll position ───────────────────────────────────────────────
  useEffect(() => {
    if (typeof history !== 'undefined') history.scrollRestoration = 'manual'
    // Prevent pull-to-refresh / overscroll bounce at boundaries
    document.documentElement.style.overscrollBehavior = 'none'
    document.body.style.overscrollBehavior             = 'none'

    function init() {
      const w = window.innerWidth
      const h = window.innerHeight
      const d = computeDims(w, h)
      stripHRef.current = d.stripH

      const cardCenterY = d.shortH + d.tallH / 2
      const midCopy     = Math.floor(STRIP_COPIES / 2)
      const initY = Math.round(-(midCopy * d.stripH + cardCenterY - h / 2))
      initYRef.current = initY

      rawY.set(initY)
      dispY.set(initY)
      setDims(d)
      setReady(true)
    }

    init()
    // Scroll track div is already in DOM (rendered below), so body IS scrollable here
    window.scrollTo(0, SCROLL_START)

    window.addEventListener('resize', init)
    return () => {
      window.removeEventListener('resize', init)
      document.documentElement.style.overscrollBehavior = ''
      document.body.style.overscrollBehavior             = ''
    }
  }, [rawY, dispY])

  // ── Native scroll → rawY ──────────────────────────────────────────────────────
  useEffect(() => {
    function onScroll() {
      // scrollY increases when scrolling down → rawY decreases → strips move up
      rawY.set(initYRef.current - (window.scrollY - SCROLL_START))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [rawY])

  // ── Colorway-safe wrap + direct visual sync ───────────────────────────────────
  useAnimationFrame(() => {
    const stripH = stripHRef.current
    if (!stripH) return

    let ry = rawY.get()
    const wrapSize = N_COLORS * stripH
    const hi = -N_COLORS * stripH
    const lo = -(STRIP_COPIES - N_COLORS) * stripH

    // Seamless wrap: strip[n] and strip[n+N_COLORS] are visually identical
    while (ry > hi) { ry -= wrapSize; rawY.set(ry); dispY.set(dispY.get() - wrapSize) }
    while (ry < lo) { ry += wrapSize; rawY.set(ry); dispY.set(dispY.get() + wrapSize) }

    // Direct 1:1 — OS handles all scroll physics (trackpad momentum, iOS inertia)
    dispY.set(ry)
  })

  // ── Cells ─────────────────────────────────────────────────────────────────────
  const cells = useMemo((): CellRender[] => {
    if (!dims || images.length === 0) return []
    const { unitW, rowTops, rowHeights, layout } = dims
    const shuffled = seededShuffle(images, 42)
    let imgIdx = 0
    return layout.map((spec, si) => {
      const left   = spec.col * unitW + GAP
      const top    = rowTops[spec.row] + GAP
      const width  = spec.colSpan * unitW - GAP * 2
      const height = rowHeights[spec.row] - GAP * 2
      if (spec.type === 'text') {
        return { key: `t${si}`, left, top, width, height, type: 'text' as const }
      }
      const c: CellRender = {
        key: `i${si}`, left, top, width, height,
        type: 'image' as const,
        src:  shuffled[imgIdx % shuffled.length],
      }
      imgIdx++
      return c
    })
  }, [dims, images])

  const { stripW = 0, stripH = 0, xOffset = 0, isMobile = false } = dims ?? {}

  return (
    <>
      {/*
        Scroll track — always present from initial render so document.body IS
        scrollable before any JS effects run. window.scrollTo(0, SCROLL_START)
        needs this to already exist in the DOM.
      */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '1px',
          height: SCROLL_START * 2,
          pointerEvents: 'none',
        }}
      />

      {/*
        Fixed visual layer.
        pointer-events:none → all events fall through to document scroll.
        touch-action:pan-y  → iOS honours vertical touch-scroll on this element.
        Interactive children (TextCard) override pointer-events back to auto.
      */}
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
        <div style={{ position: 'absolute', left: xOffset, top: 0 }}>
          <motion.div
            style={{
              y: dispY,
              width:  stripW,
              height: STRIP_COPIES * stripH,
              position: 'relative',
              willChange: 'transform',
            }}
          >
            {Array.from({ length: STRIP_COPIES }, (_, ci) => {
              const colorway = COLORWAYS[ci % N_COLORS]
              return (
                <div
                  key={ci}
                  style={{
                    position: 'absolute',
                    top:    ci * stripH,
                    left:   0,
                    width:  stripW,
                    height: stripH,
                  }}
                >
                  {cells.map(cell =>
                    cell.type === 'text' ? (
                      <TextCard
                        key={cell.key}
                        left={cell.left} top={cell.top}
                        width={cell.width} height={cell.height}
                        onProfileClick={onProfileClick}
                        colorway={colorway}
                        isMobile={isMobile}
                      />
                    ) : (
                      <ImageCell
                        key={cell.key}
                        left={cell.left} top={cell.top}
                        width={cell.width} height={cell.height}
                        src={cell.src!}
                      />
                    )
                  )}
                </div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </>
  )
}

// ── ImageCell ──────────────────────────────────────────────────────────────────
function ImageCell({ left, top, width, height, src }: {
  left: number; top: number; width: number; height: number; src: string
}) {
  return (
    <div style={{ position: 'absolute', left, top, width, height, overflow: 'hidden' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        draggable={false}
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
function TextCard({ left, top, width, height, onProfileClick, colorway, isMobile }: {
  left: number; top: number; width: number; height: number
  onProfileClick: () => void
  colorway: Colorway
  isMobile: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const nameFontSize = Math.round(width * 0.38)
  const padV = Math.round(height * 0.09)
  const padH = Math.round(width * 0.10)

  return (
    <div
      onClick={onProfileClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute', left, top, width, height,
        backgroundColor: colorway.bg,
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: `${padV}px ${padH}px`,
        userSelect: 'none',
        overflow: 'hidden',
        filter: hovered ? 'brightness(0.92)' : 'none',
        transition: 'filter 0.18s ease',
        // Restore pointer events for this interactive card (parent has none)
        pointerEvents: 'auto',
        // Allow touch scrolling through the card (vertical swipe still scrolls page)
        touchAction: 'pan-y',
      }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-cormorant), Georgia, serif',
          fontWeight: 300,
          fontStyle: 'italic',
          fontSize: nameFontSize,
          lineHeight: 0.85,
          letterSpacing: '-0.04em',
          color: colorway.name,
          pointerEvents: 'none',
        }}
      >
        Jiye
        <br />
        Lee
      </h1>

      <div style={{ pointerEvents: 'none' }}>
        <p style={{
          fontFamily: 'var(--font-inter), system-ui, sans-serif',
          fontSize: isMobile ? '10px' : '11px',
          letterSpacing: '0.02em',
          lineHeight: 1.4,
          color: colorway.text,
          textTransform: 'uppercase',
          marginBottom: '0.6rem',
        }}>
          FLORAL ARTIST BASED IN SEOUL.
          <br />CRAFTING SEASONAL ARRANGEMENTS
          <br />FOR WEDDINGS, EVENTS & EDITORIAL.
        </p>
        <p style={{
          fontFamily: 'var(--font-inter), system-ui, sans-serif',
          fontSize: isMobile ? '10px' : '11px',
          letterSpacing: '0.06em',
          color: colorway.text,
          textTransform: 'uppercase',
        }}>
          PROFILE ↗
        </p>
      </div>
    </div>
  )
}
