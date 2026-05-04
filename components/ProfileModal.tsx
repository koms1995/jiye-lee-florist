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
            /* ── Mobile layout — proportions extracted from nrly.co mobile CSS ── */
            <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>

              {/* Name — nrly.co: 107.25px/390px=27.5vw, lineHeight 0.80, letterSpacing -0.04em */}
              <div style={{ position: 'absolute', top: '1rem', left: '1.25rem', zIndex: 20 }}>
                <motion.h2
                  layoutId={nameLayoutId}
                  transition={LAYOUT_TRANSITION}
                  style={{
                    fontFamily:    'var(--font-cormorant), Georgia, serif',
                    fontWeight:    300, fontStyle: 'italic',
                    fontSize:      '27.5vw',
                    lineHeight:    0.80, letterSpacing: '-0.04em',
                    color:         '#D8A9AC',
                  }}
                >
                  Jiye<br />Lee
                </motion.h2>
              </div>

              {/* Peony — right-biased, overlaps name bottom and roles (zIndex above roles) */}
              <div style={{
                position: 'absolute',
                top: 0, bottom: '18%',
                left: '40%', right: '-25%',
                zIndex: 10,
              }}>
                <PeonyCanvas />
              </div>

              {/* Career titles — nrly.co: 31.2px/390px=8vw, lineHeight 1.10, letterSpacing -0.035em */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.30, duration: 0.25 }}
                style={{
                  position: 'absolute',
                  top: '28%', left: '1.25rem',
                  zIndex: 5,
                  fontFamily: 'var(--font-inter), system-ui, sans-serif',
                  fontSize: '8vw', letterSpacing: '-0.035em',
                  lineHeight: 1.10, color: '#2E1F1F',
                }}
              >
                <p>① Floral Designer</p>
                <p>② Wedding &amp; Event Specialist</p>
                <p>③ Botanical Installation Artist</p>
              </motion.div>

              {/* Bio — nrly.co: 14.04px/390px=3.6vw, lineHeight 1.10, letterSpacing -0.025em */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.32, duration: 0.25 }}
                style={{
                  position: 'absolute',
                  bottom: '7rem', left: '1.25rem', right: '1.25rem',
                  zIndex: 20,
                  fontFamily: 'var(--font-inter), system-ui, sans-serif',
                  fontSize: '3.6vw', letterSpacing: '-0.025em',
                  lineHeight: 1.10, color: '#7A5C5C', textTransform: 'uppercase',
                }}
              >
                <p>FLORAL ARTIST BASED IN SEOUL, WORKING ACROSS WEDDINGS, EVENTS, AND EDITORIAL PROJECTS.</p>
                <br />
                <p>TRAINED IN KOREA AND EUROPE, WITH A FOCUS ON SEASONAL BOTANICALS AND SPATIAL STORYTELLING.</p>
              </motion.div>

            </div>
          ) : (
            /* ── Desktop layout — visual left / text right, mirrors nrly.co ── */
            <div style={{ position: 'relative', height: '100%', width: '100%' }}>

              {/* Peony: wider than 46vw so rotating petals aren't hard-clipped at the split */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '62vw', zIndex: 5, pointerEvents: 'none' }}>
                <PeonyCanvas />
              </div>

              {/* Name: top-left, overlaid on peony — matches nrly.co left: 5rem, top: 5rem */}
              <div style={{ position: 'absolute', top: '5rem', left: '5rem', zIndex: 10 }}>
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

              {/* Right: career + bio — starts at 46vw from left, 37.5vh from top */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.32, duration: 0.28 }}
                style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: '46vw', right: '4.5rem',
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'flex-start',
                  paddingTop: '37.5vh',
                  zIndex: 10,
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-inter), system-ui, sans-serif',
                  fontSize: '2.083vw', letterSpacing: '-0.035em',
                  lineHeight: 1.1, color: '#2E1F1F', textTransform: 'uppercase',
                }}>
                  <p>① FLORAL DESIGNER</p>
                  <p>② WEDDING &amp; EVENT SPECIALIST</p>
                  <p>③ BOTANICAL INSTALLATION ARTIST</p>
                </div>
                <div style={{
                  marginTop: '2.35rem',
                  fontFamily: 'var(--font-inter), system-ui, sans-serif',
                  fontSize: '0.9375vw', letterSpacing: '-0.025em',
                  lineHeight: 1.1, color: '#7A5C5C', textTransform: 'uppercase',
                  maxWidth: '25rem',
                }}>
                  <p>FLORAL ARTIST BASED IN SEOUL, WORKING ACROSS WEDDINGS, EVENTS, AND EDITORIAL PROJECTS.</p>
                  <br />
                  <p>TRAINED IN KOREA AND EUROPE, WITH A FOCUS ON SEASONAL BOTANICALS AND SPATIAL STORYTELLING.</p>
                </div>
              </motion.div>

            </div>
          )}

          <PillButtons />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
