'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { relativeLuminance, type Theme } from './themes'

// Default (no-theme) palette — used while the modal is closed.
const DEFAULT = {
  border:     '#D8A9AC',
  text:       '#2E1F1F',
  bg:         'rgba(237, 224, 212, 0.88)',
  wipe:       '#D8A9AC',
  textOnWipe: '#F5F0EB',
}

interface PillButtonProps {
  href: string
  label: string
  external?: boolean
  /** When set, button colors are derived from the theme instead of DEFAULT. */
  theme?: Theme | null
}

function PillButton({ href, label, external = false, theme }: PillButtonProps) {
  const [hovered, setHovered] = useState(false)

  // Theme-derived colors (when modal is open and a theme is active):
  // - border + wipe = theme.point (the accent color)
  // - resting text = theme.point (matches the border for unity)
  // - on-hover text = whichever of light/dark contrasts with the wipe.
  // - background = a translucent tint of theme.bg for readability over canvas.
  const palette = theme
    ? {
        border:     theme.point,
        text:       theme.point,
        bg:         hexToRgba(theme.bg, 0.55),
        wipe:       theme.point,
        textOnWipe: relativeLuminance(theme.point) > 0.55 ? '#2E1F1F' : '#FFFFFF',
      }
    : DEFAULT

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="relative overflow-hidden inline-flex items-center justify-center"
      style={{
        borderRadius:    999,
        border:          `1px solid ${palette.border}`,
        padding:         '0.7rem 1.8rem',
        textDecoration:  'none',
        backgroundColor: palette.bg,
        backdropFilter:  'blur(6px)',
        // Smooth cross-fade between themes (and between themed/default).
        transition:      'border-color 0.42s ease, background-color 0.42s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Wipe fill — accent color slides in on hover */}
      <motion.div
        className="absolute inset-0"
        style={{ borderRadius: 999, backgroundColor: palette.wipe }}
        initial={{ clipPath: 'inset(0 100% 0 0 round 999px)' }}
        animate={{ clipPath: hovered ? 'inset(0 0% 0 0 round 999px)' : 'inset(0 100% 0 0 round 999px)' }}
        transition={{ duration: 0.38, ease: [0.76, 0, 0.24, 1] }}
      />
      <span
        className="relative font-sans uppercase"
        style={{
          fontSize:      'clamp(11px, 1.2vw, 13px)',
          letterSpacing: '0.05em',
          color:         hovered ? palette.textOnWipe : palette.text,
          transition:    'color 0.20s ease',
          zIndex:        1,
        }}
      >
        {label}
      </span>
    </a>
  )
}

interface Props {
  theme?: Theme | null
}

export default function PillButtons({ theme }: Props) {
  return (
    <div
      className="fixed flex gap-3"
      style={{
        bottom:    '5rem',
        left:      '50%',
        transform: 'translateX(-50%)',
        zIndex:    1000,
      }}
    >
      <PillButton href="mailto:ueeuiue@gmail.com"        label="EMAIL" theme={theme} />
      <PillButton href="https://www.instagram.com/ueeuiue" label="Insta" external theme={theme} />
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const c = parseInt(m[1], 16)
  const r = (c >> 16) & 0xff
  const g = (c >> 8)  & 0xff
  const b =  c        & 0xff
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
