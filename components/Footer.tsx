'use client'

import { motion } from 'framer-motion'
import { EMAIL, INSTAGRAM_URL, INSTAGRAM_HANDLE, KAKAO_LINK } from '@/lib/constants'

const linkClass =
  'text-[10px] tracking-[0.25em] uppercase font-sans text-text-secondary hover:text-text-primary transition-colors duration-300'

export default function Footer() {
  return (
    <motion.footer
      className="px-6 md:px-10 py-10 flex items-center gap-8"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {EMAIL ? (
        <a href={`mailto:${EMAIL}`} className={linkClass}>
          Email ↗
        </a>
      ) : (
        <span className={linkClass + ' opacity-30'}>Email</span>
      )}

      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {INSTAGRAM_HANDLE} ↗
      </a>

      {KAKAO_LINK && (
        <a
          href={KAKAO_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          KakaoTalk ↗
        </a>
      )}
    </motion.footer>
  )
}
