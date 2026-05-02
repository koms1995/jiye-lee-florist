'use client'

import { useState } from 'react'
import GrainCanvas from './GrainCanvas'
import PortfolioGrid from './PortfolioGrid'
import ProfileModal from './ProfileModal'
import PillButtons from './PillButtons'

interface Props { images: string[] }

export default function PortfolioApp({ images }: Props) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  return (
    <>
      {/* Layer 1: 5×5 draggable image grid */}
      <PortfolioGrid images={images} onProfileClick={() => setIsProfileOpen(true)} />

      {/* Layer 2: Profile fullscreen modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Layer 4: Grain texture overlay */}
      <GrainCanvas />

      {/* Always-on pill buttons */}
      <PillButtons />
    </>
  )
}
