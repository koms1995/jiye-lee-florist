'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface PillButtonProps {
  href: string
  label: string
  external?: boolean
}

function PillButton({ href, label, external = false }: PillButtonProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="relative overflow-hidden inline-flex items-center justify-center"
      style={{
        borderRadius: 999,
        border: '1px solid #D8A9AC',
        padding: '0.7rem 1.8rem',
        textDecoration: 'none',
        backgroundColor: 'rgba(237, 224, 212, 0.88)',
        backdropFilter: 'blur(6px)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Wipe fill */}
      <motion.div
        className="absolute inset-0"
        style={{ borderRadius: 999, backgroundColor: '#D8A9AC' }}
        initial={{ clipPath: 'inset(0 100% 0 0 round 999px)' }}
        animate={{ clipPath: hovered ? 'inset(0 0% 0 0 round 999px)' : 'inset(0 100% 0 0 round 999px)' }}
        transition={{ duration: 0.38, ease: [0.76, 0, 0.24, 1] }}
      />
      <span
        className="relative font-sans uppercase"
        style={{
          fontSize: 'clamp(11px, 1.2vw, 13px)',
          letterSpacing: '0.05em',
          color: hovered ? '#F5F0EB' : '#2E1F1F',
          transition: 'color 0.2s ease',
          zIndex: 1,
        }}
      >
        {label}
      </span>
    </a>
  )
}

export default function PillButtons() {
  return (
    <div
      className="fixed flex gap-3"
      style={{
        bottom: '5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
      }}
    >
      <PillButton href="mailto:ueeuiue@gmail.com" label="EMAIL" />
      <PillButton href="https://www.instagram.com/ueeuiue" label="Insta" external />
    </div>
  )
}
