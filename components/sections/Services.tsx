'use client'

import { motion } from 'framer-motion'
import SectionLabel from '@/components/ui/SectionLabel'
import { SERVICES, KAKAO_LINK } from '@/lib/constants'

export default function Services() {
  const ctaHref = KAKAO_LINK || '#contact'
  const ctaProps = KAKAO_LINK
    ? { target: '_blank' as const, rel: 'noopener noreferrer' }
    : {}

  return (
    <section id="services" className="py-24 px-8">
      <motion.div
        className="mb-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <SectionLabel>Services</SectionLabel>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#E8E6E3] border border-[#E8E6E3]">
        {SERVICES.map((service, i) => (
          <motion.div
            key={service.id}
            className="bg-background p-8 flex flex-col gap-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
          >
            <span className="text-[10px] tracking-[0.2em] uppercase font-sans text-text-secondary">
              {service.nameEn}
            </span>
            <h3 className="font-serif italic text-2xl text-text-primary">
              {service.name}
            </h3>
            <p className="font-sans text-sm text-text-secondary leading-relaxed">
              {service.description}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="mt-12 flex justify-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <a
          href={ctaHref}
          {...ctaProps}
          className="inline-block border border-[#1C1C1C] px-10 py-3 text-xs tracking-[0.2em] uppercase font-sans text-text-primary hover:bg-text-primary hover:text-background transition-colors duration-300"
        >
          문의하기
        </a>
      </motion.div>
    </section>
  )
}
