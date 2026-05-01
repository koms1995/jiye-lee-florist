'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import SectionLabel from '@/components/ui/SectionLabel'
import { ABOUT_TEXT } from '@/lib/constants'

export default function About() {
  return (
    <section id="about" className="py-24 px-8">
      <motion.div
        className="mb-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <SectionLabel>About</SectionLabel>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center max-w-5xl">
        <motion.div
          className="relative aspect-[3/4] overflow-hidden"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Image
            src="/images/about/portrait.jpg"
            alt="Jiye Lee, Florist"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </motion.div>

        <motion.div
          className="flex flex-col gap-6"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        >
          <h2 className="font-serif italic text-3xl text-text-primary leading-snug">
            {ABOUT_TEXT.greeting}
          </h2>
          <p className="font-sans text-sm leading-relaxed text-text-secondary">
            {ABOUT_TEXT.body}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
