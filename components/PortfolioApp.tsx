'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import PortfolioGrid from './PortfolioGrid'
import ProfileModal from './ProfileModal'
import PillButtons from './PillButtons'
import ImageLightbox, { type LightboxImage } from './ImageLightbox'
import { peonyParallax } from './peonyParallax'
import { themeForStrip, type Theme } from './themes'

// Dynamic import keeps the WebGL bundle out of the initial payload.
// `ssr: false` prevents server rendering where WebGL is unavailable.
const PeonyCanvas = dynamic(() => import('./PeonyCanvas'), {
  ssr:     false,
  loading: () => null,
})

interface Props { images: string[] }

export default function PortfolioApp({ images }: Props) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [activeStripSi, setActiveStripSi] = useState<number | null>(null)
  const [activeTheme, setActiveTheme]     = useState<Theme | null>(null)
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(null)

  // Hydration gate — render canvas only after first client-side effect runs.
  // Prevents mount-during-SSR / hydration mismatch issues that can corrupt
  // WebGL initialization.
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Window-level mouse tracker (Canvas is pointer-events:none).
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      peonyParallax.mouseX =  (e.clientX / window.innerWidth)  * 2 - 1
      peonyParallax.mouseY = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  function handleProfileClick(si: number) {
    setActiveStripSi(si)
    setActiveTheme(themeForStrip(si))
    setIsProfileOpen(true)
  }

  function handleImageClick(layoutId: string, src: string) {
    setLightboxImage({ layoutId, src })
  }

  return (
    <>
      {/* All the framer-motion shared-layout members live INSIDE LayoutGroup.
          The 3D canvas is INTENTIONALLY rendered as a sibling of LayoutGroup,
          NOT a child — placing it inside means LayoutGroup tracks its layout
          and may force re-measurements during modal/lightbox transitions,
          which in turn can interrupt WebGL frames or trigger context loss. */}
      <LayoutGroup>
        <PortfolioGrid
          images={images}
          onProfileClick={handleProfileClick}
          onImageClick={handleImageClick}
        />

        <AnimatePresence>
          {isProfileOpen && (
            <motion.div
              key="grid-fade"
              style={{ position: 'fixed', inset: 0, zIndex: 895, backgroundColor: '#EDE0D4', pointerEvents: 'none' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.90 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.38, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          theme={activeTheme}
          activeStripSi={activeStripSi}
        />

        <ImageLightbox
          image={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />

        {/* Single source of pill buttons — themed when modal is open, default
            when closed. Color cross-fades smoothly via CSS transitions. */}
        <PillButtons theme={isProfileOpen ? activeTheme : null} />
      </LayoutGroup>

      {/* ── Persistent 3D canvas layer ──────────────────────────────────────
          Outside LayoutGroup. Mount-once after hydration, never re-mount.
          Hidden via translateX (NOT opacity) to keep WebGL context healthy. */}
      {isMobile !== null && (
        <div
          key="persistent-canvas"
          style={{
            position:      'fixed',
            zIndex:        902,
            pointerEvents: 'none',
            overflow:      'visible',
            willChange:    'transform',
            // Plain CSS transform/transition — NOT framer-motion. Per-frame
            // transform writes from motion.div correlate with WebGL context
            // loss on some Chromium builds; a single CSS transition keeps
            // the GPU composite stable.
            transform:     isProfileOpen ? 'translate3d(0,0,0)' : 'translate3d(110%,0,0)',
            transition:    `transform ${isProfileOpen ? '0.50s' : '0.34s'} cubic-bezier(0.43, 0.13, 0.23, 0.96) ${isProfileOpen ? '0.28s' : '0s'}`,
            ...(isMobile
              ? { top: 0, left: '32%', right: '-18%', height: '58vh' }
              : { top: 0, bottom: 0, right: '-8vw', width: '48vw' }),
          }}
        >
          <PeonyCanvas />
        </div>
      )}

      {/* ── Tulip CC-BY attribution (viewport-anchored) ─────────────────────
          Lives at app level so it can pin to viewport edges regardless of
          the canvas wrapper's negative-offset positioning. Only shown when
          the modal is open (canvas is visible). On mobile we tuck it into
          the very top-right corner; on desktop it sits at bottom-right. */}
      {isMobile !== null && (
        <motion.a
          href="https://sketchfab.com/3d-models/tulip-172fa50b49754408b5030ee9b23b2523"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Tulip 3D model by TIS, CC BY 4.0"
          initial={false}
          animate={{ opacity: isProfileOpen ? (isMobile ? 0.32 : 0.45) : 0 }}
          transition={{
            duration: isProfileOpen ? 0.30 : 0.18,
            delay:    isProfileOpen ? 0.55 : 0,
            ease:     'easeOut',
          }}
          style={{
            position:       'fixed',
            zIndex:         906,
            fontFamily:     'var(--font-inter), sans-serif',
            letterSpacing:  '0.12em',
            color:          '#7A5C5C',
            textDecoration: 'none',
            pointerEvents:  isProfileOpen ? 'auto' : 'none',
            ...(isMobile
              ? {
                  top:      '0.5rem',
                  right:    '4.5rem',          // clear the close button (×)
                  fontSize: '0.5rem',
                }
              : {
                  bottom:   '0.6rem',
                  right:    '1rem',
                  fontSize: '0.55rem',
                }
            ),
          }}
        >
          TULIP © TIS · CC BY 4.0
        </motion.a>
      )}
    </>
  )
}
