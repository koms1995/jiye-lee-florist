'use client'

import { motion } from 'framer-motion'
import SectionLabel from '@/components/ui/SectionLabel'
import { KAKAO_LINK, INSTAGRAM_URL, INSTAGRAM_HANDLE } from '@/lib/constants'

export default function Contact() {
  return (
    <section id="contact" className="py-32 px-6 md:px-10 text-center">
      <motion.div
        className="mb-12 flex justify-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <SectionLabel>Contact</SectionLabel>
      </motion.div>

      <motion.h2
        className="font-serif italic text-[6vw] md:text-5xl text-text-primary mb-14 leading-tight"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      >
        꽃으로 이야기해요
      </motion.h2>

      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
      >
        <a
          href={KAKAO_LINK || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-text-primary text-background px-12 py-4 text-xs tracking-[0.2em] uppercase font-sans hover:opacity-75 transition-opacity duration-300"
        >
          카카오톡 문의
        </a>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs tracking-[0.2em] font-sans text-text-secondary hover:text-text-primary transition-colors duration-300"
        >
          @{INSTAGRAM_HANDLE}
        </a>
      </motion.div>
    </section>
  )
}
