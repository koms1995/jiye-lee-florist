'use client'

import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import PillButtons from './PillButtons'

const PeonyCanvas = dynamic(() => import('@/components/PeonyCanvas'), {
  ssr: false,
  loading: () => null,
})

interface Props {
  isOpen:   boolean
  onClose:  () => void
  fromRect: DOMRect | null
  fromBg:   string
}

export default function ProfileModal({ isOpen, onClose, fromRect, fromBg }: Props) {
  const vw       = typeof window !== 'undefined' ? window.innerWidth  : 1440
  const vh       = typeof window !== 'undefined' ? window.innerHeight : 900
  const isMobile = vw < 768

  const expandInitial = fromRect
    ? { left: fromRect.left, top: fromRect.top, width: fromRect.width, height: fromRect.height, backgroundColor: fromBg }
    : { left: 0, top: 0, width: vw, height: vh, backgroundColor: '#EDE0D4', opacity: 0 }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          style={{ position: 'fixed', overflow: 'hidden', zIndex: 900 }}
          initial={expandInitial}
          animate={{ left: 0, top: 0, width: vw, height: vh, backgroundColor: '#EDE0D4', opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } }}
          transition={{ duration: 0.62, ease: [0.76, 0, 0.24, 1] }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close profile"
            style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 20,
              width: '2.75rem', height: '2.75rem',
              borderRadius: '50%',
              border: '1px solid #D8A9AC',
              background: 'transparent',
              cursor: 'pointer',
              color: '#D8A9AC',
              fontSize: '1.3rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>

          {/* Content — delayed fade-in after expand */}
          <motion.div
            style={{ position: 'absolute', inset: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.40, duration: 0.28, ease: 'easeOut' }}
          >
            {isMobile ? (
              /* ── Mobile layout — peony hero, text layered over it ── */
              <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>

                {/* Name + career titles — top, z above peony */}
                <div style={{ position: 'absolute', top: '3.5rem', left: '1.75rem', zIndex: 10 }}>
                  <h2 style={{
                    fontFamily:    'var(--font-cormorant), Georgia, serif',
                    fontWeight:    300, fontStyle: 'italic',
                    fontSize:      'clamp(4.5rem, 25vw, 7.5rem)',
                    lineHeight:    0.82, letterSpacing: '-0.04em',
                    color:         '#D8A9AC',
                  }}>
                    Jiye<br />Lee
                  </h2>
                  <div style={{
                    marginTop: '1.25rem',
                    fontFamily: 'var(--font-inter), system-ui, sans-serif',
                    fontSize: '10px', letterSpacing: '0.04em',
                    lineHeight: 1.7, color: '#2E1F1F', textTransform: 'uppercase',
                  }}>
                    <p>① FLORAL DESIGNER</p>
                    <p>② WEDDING &amp; EVENT SPECIALIST</p>
                    <p>③ BOTANICAL INSTALLATION ARTIST</p>
                  </div>
                </div>

                {/* Peony — fills most of screen, bleeds off bottom, overlaps text layers */}
                <div style={{
                  position: 'absolute',
                  top: '26%', bottom: '-12%',
                  left: '-8vw', right: '-8vw',
                  zIndex: 5,
                }}>
                  <PeonyCanvas />
                </div>

                {/* Bio — above pill buttons (PillButtons fixed at bottom:5rem) */}
                <div style={{
                  position: 'absolute',
                  bottom: '8.5rem', left: '1.75rem', right: '1.75rem',
                  zIndex: 10,
                  fontFamily: 'var(--font-inter), system-ui, sans-serif',
                  fontSize: '10px', letterSpacing: '0.02em',
                  lineHeight: 1.75, color: '#7A5C5C', textTransform: 'uppercase',
                }}>
                  <p>FLORAL ARTIST BASED IN SEOUL, WORKING ACROSS WEDDINGS, EVENTS, AND EDITORIAL PROJECTS.</p>
                  <br />
                  <p>TRAINED IN KOREA AND EUROPE, WITH A FOCUS ON SEASONAL BOTANICALS AND SPATIAL STORYTELLING.</p>
                </div>

              </div>
            ) : (
              /* ── Desktop layout ── */
              <div style={{ position: 'relative', display: 'flex', height: '100%', width: '100%', alignItems: 'center' }}>
                {/* Left: large name */}
                <div style={{ flexShrink: 0, paddingLeft: '4rem', zIndex: 10, width: '42vw' }}>
                  <h2 style={{
                    fontFamily:    'var(--font-cormorant), Georgia, serif',
                    fontWeight:    300, fontStyle: 'italic',
                    fontSize:      '15vw', lineHeight: 0.80,
                    letterSpacing: '-0.04em', color: '#D8A9AC',
                  }}>
                    Jiye<br />Lee
                  </h2>
                </div>

                {/* Center: career + bio */}
                <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '28rem' }}>
                  <div style={{
                    fontFamily: 'var(--font-inter), system-ui, sans-serif',
                    fontSize: '20px', letterSpacing: '-0.5px',
                    lineHeight: 1.5, color: '#2E1F1F', textTransform: 'uppercase',
                  }}>
                    <p>① FLORAL DESIGNER</p>
                    <p>② WEDDING &amp; EVENT SPECIALIST</p>
                    <p>③ BOTANICAL INSTALLATION ARTIST</p>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-inter), system-ui, sans-serif',
                    fontSize: '20px', letterSpacing: '-0.5px',
                    lineHeight: 1.6, color: '#7A5C5C', textTransform: 'uppercase',
                    maxWidth: '24rem',
                  }}>
                    <p>FLORAL ARTIST BASED IN SEOUL, WORKING ACROSS WEDDINGS, EVENTS, AND EDITORIAL PROJECTS.</p>
                    <br />
                    <p>TRAINED IN KOREA AND EUROPE, WITH A FOCUS ON SEASONAL BOTANICALS AND SPATIAL STORYTELLING.</p>
                  </div>
                </div>

                {/* Right: 3D Peony — bleeds off right edge */}
                <div style={{ position: 'absolute', top: 0, bottom: 0, right: '-20vw', width: '60vw', overflow: 'hidden' }}>
                  <PeonyCanvas />
                </div>
              </div>
            )}
          </motion.div>

          <PillButtons />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
