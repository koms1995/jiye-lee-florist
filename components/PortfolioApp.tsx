'use client'

import { useState } from 'react'
import GrainCanvas from './GrainCanvas'
import PortfolioGrid from './PortfolioGrid'
import ProfileModal from './ProfileModal'
import PillButtons from './PillButtons'

interface Props { images: string[] }

export default function PortfolioApp({ images }: Props) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [profileRect, setProfileRect] = useState<DOMRect | null>(null)
  const [profileBg,   setProfileBg]   = useState('#EDE0D4')

  function handleProfileClick(rect: DOMRect, bg: string) {
    setProfileRect(rect)
    setProfileBg(bg)
    setIsProfileOpen(true)
  }

  return (
    <>
      <PortfolioGrid images={images} onProfileClick={handleProfileClick} />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        fromRect={profileRect}
        fromBg={profileBg}
      />

      <GrainCanvas />
      <PillButtons />
    </>
  )
}
