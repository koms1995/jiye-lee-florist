'use client'

import { motion } from 'framer-motion'
import { ABOUT_TEXT } from '@/lib/constants'

export default function About() {
  return (
    <section id="about" className="py-24 px-6 md:px-10">
      <motion.div
        className="max-w-sm ml-auto"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <p className="font-sans text-xs leading-relaxed text-text-secondary whitespace-pre-line">
          {ABOUT_TEXT}
        </p>
        <motion.a
          href="#gallery"
          className="inline-block mt-6 text-[10px] tracking-[0.25em] uppercase font-sans text-text-primary hover:opacity-50 transition-opacity duration-300"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        >
          Work ↑
        </motion.a>
      </motion.div>
    </section>
  )
}
