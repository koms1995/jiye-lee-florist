'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion'

// ── Constants ──────────────────────────────────────────────────────────────────
const GAP = 2           // px each side → 4px total gap between cells
const COLS = 5
const H_TILES = 5
const V_TILES = 4
const MID_H = Math.floor(H_TILES / 2)
const MID_V = Math.floor(V_TILES / 2)
const LERP_ALPHA = 0.07
const MOMENTUM_DECAY = 0.93
const WHEEL_SCALE = 0.8

// ── Layout ─────────────────────────────────────────────────────────────────────
// 5 cols × 3 rows.  row 0 = short, row 1 = tall (feature), row 2 = short.
// Bento variety: two 2-wide spans per supertile.
type CellSpec = { col: number; row: number; colSpan: number; type: 'image' | 'text' }

const TILE_LAYOUT: CellSpec[] = [
  // Row 0 — short
  { col: 0, row: 0, colSpan: 1, type: 'image' },
  { col: 1, row: 0, colSpan: 2, type: 'image' },  // 2-wide landscape
  { col: 3, row: 0, colSpan: 1, type: 'image' },
  { col: 4, row: 0, colSpan: 1, type: 'image' },
  // Row 1 — tall
  { col: 0, row: 1, colSpan: 1, type: 'image' },
  { col: 1, row: 1, colSpan: 1, type: 'image' },
  { col: 2, row: 1, colSpan: 1, type: 'text' },   // ← identity card
  { col: 3, row: 1, colSpan: 1, type: 'image' },
  { col: 4, row: 1, colSpan: 1, type: 'image' },
  // Row 2 — short
  { col: 0, row: 2, colSpan: 1, type: 'image' },
  { col: 1, row: 2, colSpan: 1, type: 'image' },
  { col: 2, row: 2, colSpan: 2, type: 'image' },  // 2-wide landscape
  { col: 4, row: 2, colSpan: 1, type: 'image' },
]

// ── Colorways ──────────────────────────────────────────────────────────────────
type Colorway = { bg: string; name: string; text: string }

const COLORWAYS: Colorway[] = [
  { bg: '#C9A99A', name: '#D8A9AC', text: '#2E1F1F' }, // dusty pink (original)
  { bg: '#2E1F1F', name: '#D8A9AC', text: '#D8A9AC' }, // dark brown + pink
  { bg: '#F5F0EB', name: '#2E1F1F', text: '#2E1F1F' }, // cream + brown
  { bg: '#7A5C5C', name: '#EDE0D4', text: '#EDE0D4' }, // warm plum + cream
]

// ── Helpers ────────────────────────────────────────────────────────────────────
type Dims = {
  unitW: number
  shortH: number
  tallH: number
  stW: number
  stH: number
  rowTops: readonly [number, number, number]
  rowHeights: readonly [number, number, number]
}

function computeDims(w: number, h: number): Dims {
  const unitW = Math.round(w / COLS)
  const shortH = Math.round(h * 0.26)
  const tallH = Math.round(h * 0.45)
  const stW = COLS * unitW
  const stH = 2 * shortH + tallH
  return {
    unitW, shortH, tallH, stW, stH,
    rowTops: [0, shortH, shortH + tallH],
    rowHeights: [shortH, tallH, shortH],
  }
}

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

// ── Main component ─────────────────────────────────────────────────────────────
interface Props { images: string[]; onProfileClick: () => void }

export default function PortfolioGrid({ images, onProfileClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stWRef = useRef(0)
  const stHRef = useRef(0)

  const [dims, setDims] = useState<Dims | null>(null)
  const [ready, setReady] = useState(false)

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const dispX = useMotionValue(0)
  const dispY = useMotionValue(0)

  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const vel = useRef({ x: 0, y: 0 })
  const momId = useRef<number | null>(null)

  useEffect(() => {
    function init() {
      const w = window.innerWidth
      const h = window.innerHeight
      const d = computeDims(w, h)

      stWRef.current = d.stW
      stHRef.current = d.stH

      // Center viewport on identity card of MID supertile
      // Card: col=2, row=1 in supertile (MID_H, MID_V)
      const cardCX = MID_H * d.stW + 2 * d.unitW + GAP + d.unitW / 2
      const cardCY = MID_V * d.stH + d.rowTops[1] + GAP + d.tallH / 2
      const ix = Math.round(-(cardCX - w / 2))
      const iy = Math.round(-(cardCY - h / 2))

      rawX.set(ix); rawY.set(iy)
      dispX.set(ix); dispY.set(iy)
      setDims(d)
      setReady(true)
    }

    init()
    window.addEventListener('resize', init)
    return () => window.removeEventListener('resize', init)
  }, [rawX, rawY, dispX, dispY])

  // ── Lerp + 2D infinite wrap ──────────────────────────────────────────────────
  useAnimationFrame((_, dt) => {
    const stW = stWRef.current
    const stH = stHRef.current
    if (!stW || !stH) return

    let rx = rawX.get()
    if (rx > -stW) {
      rawX.set(rx - stW); dispX.set(dispX.get() - stW); rx -= stW
    } else if (rx < -stW * (H_TILES - 1)) {
      rawX.set(rx + stW); dispX.set(dispX.get() + stW); rx += stW
    }

    let ry = rawY.get()
    if (ry > -stH) {
      rawY.set(ry - stH); dispY.set(dispY.get() - stH); ry -= stH
    } else if (ry < -stH * (V_TILES - 1)) {
      rawY.set(ry + stH); dispY.set(dispY.get() + stH); ry += stH
    }

    const f = 1 - Math.pow(1 - LERP_ALPHA, dt / 16.67)
    dispX.set(dispX.get() + (rx - dispX.get()) * f)
    dispY.set(dispY.get() + (ry - dispY.get()) * f)
  })

  // ── Momentum ─────────────────────────────────────────────────────────────────
  const applyMomentum = useCallback(function applyMomentum() {
    const { x: vx, y: vy } = vel.current
    if (Math.abs(vx) < 0.5 && Math.abs(vy) < 0.5) return
    rawX.set(rawX.get() + vx)
    rawY.set(rawY.get() + vy)
    vel.current = { x: vx * MOMENTUM_DECAY, y: vy * MOMENTUM_DECAY }
    momId.current = requestAnimationFrame(applyMomentum)
  }, [rawX, rawY])

  // ── Pointer events ────────────────────────────────────────────────────────────
  const handleDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    isDragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    vel.current = { x: 0, y: 0 }
    if (momId.current) cancelAnimationFrame(momId.current)
    e.currentTarget.setPointerCapture(e.pointerId)
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing'
  }, [])

  const handleMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    rawX.set(rawX.get() + dx)
    rawY.set(rawY.get() + dy)
    vel.current = { x: dx, y: dy }
    lastPos.current = { x: e.clientX, y: e.clientY }
  }, [rawX, rawY])

  const handleUp = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    if (containerRef.current) containerRef.current.style.cursor = 'grab'
    momId.current = requestAnimationFrame(applyMomentum)
  }, [applyMomentum])

  // ── Wheel ─────────────────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    if (momId.current) { cancelAnimationFrame(momId.current); momId.current = null }
    rawX.set(rawX.get() - e.deltaX * WHEEL_SCALE)
    rawY.set(rawY.get() - e.deltaY * WHEEL_SCALE)
    vel.current = {
      x: -e.deltaX * WHEEL_SCALE * 0.2,
      y: -e.deltaY * WHEEL_SCALE * 0.2,
    }
    momId.current = requestAnimationFrame(applyMomentum)
  }, [rawX, rawY, applyMomentum])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // ── Build cell list ───────────────────────────────────────────────────────────
  type CellRender = {
    key: string
    left: number; top: number; width: number; height: number
    type: 'image' | 'text'
    src?: string
    colorway: Colorway
  }

  const cells = useMemo((): CellRender[] => {
    if (!dims || images.length === 0) return []
    const { unitW, rowTops, rowHeights, stW, stH } = dims
    const result: CellRender[] = []

    for (let tv = 0; tv < V_TILES; tv++) {
      for (let th = 0; th < H_TILES; th++) {
        const colorway = COLORWAYS[(th + tv * 2) % COLORWAYS.length]
        const shuffled = seededShuffle(images, th * 31 + tv * 97 + 7)
        let imgIdx = 0

        for (const spec of TILE_LAYOUT) {
          const left = th * stW + spec.col * unitW + GAP
          const top = tv * stH + rowTops[spec.row] + GAP
          const width = spec.colSpan * unitW - GAP * 2
          const height = rowHeights[spec.row] - GAP * 2

          if (spec.type === 'text') {
            result.push({ key: `t-${th}-${tv}`, left, top, width, height, type: 'text', colorway })
          } else {
            result.push({
              key: `i-${th}-${tv}-${spec.col}-${spec.row}`,
              left, top, width, height,
              type: 'image',
              src: shuffled[imgIdx % shuffled.length],
              colorway,
            })
            imgIdx++
          }
        }
      }
    }
    return result
  }, [dims, images])

  if (!dims) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden select-none"
      style={{ cursor: 'grab', opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease' }}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerLeave={handleUp}
    >
      <motion.div
        style={{
          x: dispX, y: dispY,
          width: H_TILES * dims.stW,
          height: V_TILES * dims.stH,
          position: 'relative',
          willChange: 'transform',
        }}
      >
        {cells.map(cell =>
          cell.type === 'text' ? (
            <TextCard
              key={cell.key}
              left={cell.left} top={cell.top}
              width={cell.width} height={cell.height}
              colorway={cell.colorway}
              onProfileClick={onProfileClick}
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
      </motion.div>
    </div>
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

function TextCard({ left, top, width, height, colorway, onProfileClick }: {
  left: number; top: number; width: number; height: number
  colorway: Colorway
  onProfileClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const nameFontSize = Math.round(width * 0.38)
  const padV = Math.round(height * 0.09)
  const padH = Math.round(width * 0.1)

  return (
    <div
      onClick={onProfileClick}
      onPointerDown={(e) => e.stopPropagation()}
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
          fontSize: '11px',
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
          fontSize: '11px',
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
