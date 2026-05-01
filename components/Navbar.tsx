'use client'

import { NAV_LINKS } from '@/lib/constants'

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-6 mix-blend-difference">
      <a href="#hero" className="text-xs tracking-[0.2em] uppercase font-sans text-white">
        Jiye Lee
      </a>
      <ul className="hidden sm:flex gap-8">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="text-xs tracking-[0.2em] uppercase font-sans text-white hover:opacity-60 transition-opacity duration-300"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
