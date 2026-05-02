'use client'

import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import PillButtons from './PillButtons'

const PeonyCanvas = dynamic(() => import('@/components/PeonyCanvas'), {
  ssr: false,
  loading: () => null,
})

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileModal({ isOpen, onClose }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 overflow-hidden"
          style={{ zIndex: 900, backgroundColor: '#EDE0D4' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-8 right-8 flex items-center justify-center"
            style={{
              zIndex: 10,
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              border: '1px solid #D8A9AC',
              background: 'transparent',
              cursor: 'pointer',
              color: '#D8A9AC',
              fontSize: '1.2rem',
              lineHeight: 1,
            }}
            aria-label="Close profile"
          >
            ×
          </button>

          {/* Content */}
          <div className="relative flex h-full w-full items-center">
            {/* Left: Large name */}
            <div
              className="flex-shrink-0 pl-16 z-10"
              style={{ width: '42vw' }}
            >
              <h2
                className="font-serif"
                style={{
                  fontWeight: 300,
                  fontStyle: 'italic',
                  fontSize: '15vw',
                  lineHeight: 0.8,
                  letterSpacing: '-0.04em',
                  color: '#D8A9AC',
                }}
              >
                Jiye
                <br />
                Lee
              </h2>
            </div>

            {/* Center: Career + bio */}
            <div
              className="relative z-10 flex flex-col gap-6"
              style={{ maxWidth: '28rem' }}
            >
              <div
                className="font-sans uppercase"
                style={{
                  fontSize: '20px',
                  letterSpacing: '-0.5px',
                  lineHeight: 1.5,
                  color: '#2E1F1F',
                }}
              >
                <p>① FLORAL DESIGNER</p>
                <p>② WEDDING & EVENT SPECIALIST</p>
                <p>③ BOTANICAL INSTALLATION ARTIST</p>
              </div>

              <div
                className="font-sans uppercase"
                style={{
                  fontSize: '20px',
                  letterSpacing: '-0.5px',
                  lineHeight: 1.6,
                  color: '#7A5C5C',
                  maxWidth: '24rem',
                }}
              >
                <p>
                  FLORAL ARTIST BASED IN SEOUL, WORKING ACROSS
                  WEDDINGS, EVENTS, AND EDITORIAL PROJECTS.
                </p>
                <br />
                <p>
                  TRAINED IN KOREA AND EUROPE, WITH A FOCUS ON
                  SEASONAL BOTANICALS AND SPATIAL STORYTELLING.
                </p>
              </div>
            </div>

            {/* Right: 3D Peony — overflows ~25% off right edge */}
            <div
              className="absolute top-0 bottom-0 hidden md:block"
              style={{
                right: '-20vw',
                width: '60vw',
                overflow: 'hidden',
              }}
            >
              <PeonyCanvas />
            </div>
          </div>

          {/* Pill buttons inside modal */}
          <PillButtons />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
