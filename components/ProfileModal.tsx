'use client'

import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import PillButtons from './PillButtons'

const PeonyCanvas = dynamic(() => import('@/components/PeonyCanvas'), {
  ssr: false,
  loading: () => null,
})

// Shared layout transition — matches the card's weight and feel
const LAYOUT_TRANSITION = { duration: 0.60, ease: [0.76, 0, 0.24, 1] as const }

interface Props {
  isOpen:         boolean
  onClose:        () => void
  fromBg:         string         // source colorway background
  activeStripSi:  number | null  // which strip's card was clicked
}

export default function ProfileModal({ isOpen, onClose, fromBg, activeStripSi }: Props) {
  const vw       = typeof window !== 'undefined' ? window.innerWidth  : 1440
  const vh       = typeof window !== 'undefined' ? window.innerHeight : 900
  const isMobile = vw < 768

  const cardLayoutId = activeStripSi !== null ? `card-${activeStripSi}` : undefined
  const nameLayoutId = activeStripSi !== null ? `name-${activeStripSi}` : undefined

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal"
          layoutId={cardLayoutId}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 900,
            overflow: 'hidden',
          }}
          initial={{ backgroundColor: fromBg }}
          animate={{ backgroundColor: '#EDE0D4' }}
          exit={{ backgroundColor: fromBg }}
          transition={LAYOUT_TRANSITION}
        >
          {/* Close button */}
          <motion.button
            onClick={onClose}
            aria-label="Close profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.30, duration: 0.20 }}
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
          </motion.button>

          {isMobile ? (
            /* ── Mobile layout ── */
            <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>

              {/* Name — shared element, top-left */}
              <div style={{ position: 'absolute', top: '3.5rem', left: '1.75rem', zIndex: 10 }}>
                <motion.h2
                  layoutId={nameLayoutId}
                  transition={LAYOUT_TRANSITION}
                  style={{
                    fontFamily:    'var(--font-cormorant), Georgia, serif',
                    fontWeight:    300, fontStyle: 'italic',
                    fontSize:      'clamp(4.5rem, 25vw, 7.5rem)',
                    lineHeight:    0.82, letterSpacing: '-0.04em',
                    color:         '#D8A9AC',
                  }}
                >
                  Jiye<br />Lee
                </motion.h2>
              </div>

              {/* Career titles — start at 37.5% from top, matching nrly.co reference */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.30, duration: 0.25 }}
                style={{
                  position: 'absolute',
                  top: '37.5%', left: '1.75rem',
                  zIndex: 10,
                  fontFamily: 'var(--font-inter), system-ui, sans-serif',
                  fontSize: '10px', letterSpacing: '0.04em',
                  lineHeight: 1.7, color: '#2E1F1F', textTransform: 'uppercase',
                }}
              >
                <p>① FLORAL DESIGNER</p>
                <p>② WEDDING &amp; EVENT SPECIALIST</p>
                <p>③ BOTANICAL INSTALLATION ARTIST</p>
              </motion.div>

              {/* Peony — occupies top 5%→75%, dramatically overlapping text layers */}
              <div style={{
                position: 'absolute',
                top: '5%', bottom: '25%',
                left: '-8vw', right: '-8vw',
                zIndex: 5,
              }}>
                <PeonyCanvas />
              </div>

              {/* Bio — above pill buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.32, duration: 0.25 }}
                style={{
                  position: 'absolute',
                  bottom: '8.5rem', left: '1.75rem', right: '1.75rem',
                  zIndex: 10,
                  fontFamily: 'var(--font-inter), system-ui, sans-serif',
                  fontSize: '10px', letterSpacing: '0.02em',
                  lineHeight: 1.75, color: '#7A5C5C', textTransform: 'uppercase',
                }}
              >
                <p>FLORAL ARTIST BASED IN SEOUL, WORKING ACROSS WEDDINGS, EVENTS, AND EDITORIAL PROJECTS.</p>
                <br />
                <p>TRAINED IN KOREA AND EUROPE, WITH A FOCUS ON SEASONAL BOTANICALS AND SPATIAL STORYTELLING.</p>
              </motion.div>

            </div>
          ) : (
            /* ── Desktop layout ── */
            <div style={{ position: 'relative', display: 'flex', height: '100%', width: '100%', alignItems: 'center' }}>

              {/* Left: large name — shared element */}
              <div style={{ flexShrink: 0, paddingLeft: '4rem', zIndex: 10, width: '42vw' }}>
                <motion.h2
                  layoutId={nameLayoutId}
                  transition={LAYOUT_TRANSITION}
                  style={{
                    fontFamily:    'var(--font-cormorant), Georgia, serif',
                    fontWeight:    300, fontStyle: 'italic',
                    fontSize:      '15vw', lineHeight: 0.80,
                    letterSpacing: '-0.04em', color: '#D8A9AC',
                  }}
                >
                  Jiye<br />Lee
                </motion.h2>
              </div>

              {/* Center: career + bio — fade in */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.32, duration: 0.28 }}
                style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '28rem' }}
              >
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
              </motion.div>

              {/* Right: 3D Peony — bleeds off right edge, width/right tuned to prevent clipping */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, right: '-10vw', width: '55vw', overflow: 'hidden' }}>
                <PeonyCanvas />
              </div>

            </div>
          )}

          <PillButtons />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
