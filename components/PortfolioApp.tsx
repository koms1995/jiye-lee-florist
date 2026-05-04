'use client'

import { useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import PortfolioGrid from './PortfolioGrid'
import ProfileModal from './ProfileModal'
import PillButtons from './PillButtons'

interface Props { images: string[] }

export default function PortfolioApp({ images }: Props) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [activeStripSi, setActiveStripSi] = useState<number | null>(null)
  const [profileBg, setProfileBg] = useState('#EDE0D4')

  function handleProfileClick(bg: string, si: number) {
    setActiveStripSi(si)
    setProfileBg(bg)
    setIsProfileOpen(true)
  }

  return (
    <LayoutGroup>
      <PortfolioGrid images={images} onProfileClick={handleProfileClick} />

      {/* Grid fade overlay — sits between grid and modal, dims images during transition */}
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
        fromBg={profileBg}
        activeStripSi={activeStripSi}
      />

      <PillButtons />
    </LayoutGroup>
  )
}
