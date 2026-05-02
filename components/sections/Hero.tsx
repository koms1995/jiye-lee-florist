'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section id="hero" className="relative h-screen w-full overflow-hidden">
      <Image
        src="/images/hero.jpg"
        alt="Floral arrangement by Jiye Lee"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center">
        <motion.h1
          className="font-serif italic text-[13vw] leading-none text-white tracking-tight"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          Jiye Lee
        </motion.h1>
        <motion.p
          className="mt-4 text-[11px] tracking-[0.3em] uppercase font-sans text-white/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
        >
          Florist
        </motion.p>
      </div>

      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1, ease: 'easeOut' }}
      >
        <span className="text-[10px] tracking-[0.3em] uppercase font-sans text-white/50">
          Scroll
        </span>
        <div className="h-8 w-px bg-white/30" />
      </motion.div>
    </section>
  )
}
