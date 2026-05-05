'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'

const TRANSITION = { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] as const }
const TEXT_DELAY = 0.2          // staggered text appears after image expands

export type LightboxImage = {
  layoutId: string
  src:      string
  title?:   string
  date?:    string
}

interface Props {
  image:   LightboxImage | null
  onClose: () => void
}

export default function ImageLightbox({ image, onClose }: Props) {
  // ESC to close + body scroll lock while open
  useEffect(() => {
    if (!image) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [image, onClose])

  return (
    <AnimatePresence>
      {image && (
        <motion.div
          key="lightbox"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          style={{
            position:        'fixed',
            inset:           0,
            zIndex:          950,
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            backgroundColor: 'rgba(243, 229, 205, 0.72)',
            backdropFilter:        'blur(12px)',
            WebkitBackdropFilter:  'blur(12px)',
            cursor:          'zoom-out',
          }}
        >
          {/* Close button — thin × with rotate-on-hover */}
          <motion.button
            type="button"
            aria-label="Close image"
            onClick={(e) => { e.stopPropagation(); onClose() }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1, transition: { delay: TEXT_DELAY, duration: 0.32, ease: 'easeOut' } }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.18 } }}
            whileHover={{ rotate: 90, scale: 1.08, transition: { duration: 0.32, ease: [0.43, 0.13, 0.23, 0.96] } }}
            style={{
              position:      'fixed',
              top:           '1.75rem',
              right:         '1.75rem',
              width:         '2.5rem',
              height:        '2.5rem',
              borderRadius:  '50%',
              border:        '1px solid rgba(46, 31, 31, 0.55)',
              background:    'transparent',
              color:         '#2E1F1F',
              cursor:        'pointer',
              display:       'flex',
              alignItems:    'center',
              justifyContent:'center',
              fontSize:      '1.25rem',
              fontWeight:    300,
              lineHeight:    1,
              padding:       0,
              zIndex:        2,
            }}
          >
            ×
          </motion.button>

          {/* Image container — stops propagation so clicks on the image don't close */}
          <motion.div
            layoutId={image.layoutId}
            onClick={(e) => e.stopPropagation()}
            transition={TRANSITION}
            style={{
              position:     'relative',
              maxWidth:     '78vw',
              maxHeight:    '78vh',
              borderRadius: 8,
              overflow:     'hidden',
              cursor:       'default',
              boxShadow:    '0 30px 80px rgba(46, 31, 31, 0.18)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.title ?? ''}
              draggable={false}
              style={{
                display:    'block',
                width:      'auto',
                height:     'auto',
                maxWidth:   '78vw',
                maxHeight:  '78vh',
                objectFit:  'contain',
                userSelect: 'none',
              }}
            />
          </motion.div>

          {/* Caption — staggered fade-up after image lands */}
          {(image.title || image.date) && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, transition: { delay: TEXT_DELAY, duration: 0.42, ease: [0.43, 0.13, 0.23, 0.96] } }}
              exit={{ opacity: 0, y: 8, transition: { duration: 0.20 } }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position:      'fixed',
                bottom:        '2.25rem',
                left:          '50%',
                transform:     'translateX(-50%)',
                textAlign:     'center',
                color:         '#2E1F1F',
                pointerEvents: 'none',
                zIndex:        2,
              }}
            >
              {image.title && (
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: TEXT_DELAY + 0.05, duration: 0.42, ease: [0.43, 0.13, 0.23, 0.96] } }}
                  exit={{ opacity: 0, y: 6, transition: { duration: 0.18 } }}
                  style={{
                    fontFamily:    'var(--font-pretendard), var(--font-inter), sans-serif',
                    fontSize:      '0.95rem',
                    fontWeight:    500,
                    letterSpacing: '-0.012em',
                    margin:        0,
                  }}
                >
                  {image.title}
                </motion.p>
              )}
              {image.date && (
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: TEXT_DELAY + 0.13, duration: 0.42, ease: [0.43, 0.13, 0.23, 0.96] } }}
                  exit={{ opacity: 0, y: 6, transition: { duration: 0.18 } }}
                  style={{
                    fontFamily:    'var(--font-inter), system-ui, sans-serif',
                    fontSize:      '0.68rem',
                    fontWeight:    400,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color:         'rgba(46, 31, 31, 0.62)',
                    margin:        '0.42rem 0 0',
                  }}
                >
                  {image.date}
                </motion.p>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
