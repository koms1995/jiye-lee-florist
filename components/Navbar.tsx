import { NAV_LINKS } from '@/lib/constants'

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-6 mix-blend-difference pointer-events-none">
      <a
        href="#hero"
        className="pointer-events-auto text-[11px] tracking-[0.25em] uppercase font-sans text-white"
      >
        Jiye Lee
      </a>
      <ul className="hidden sm:flex gap-8 pointer-events-auto">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="text-[11px] tracking-[0.25em] uppercase font-sans text-white hover:opacity-50 transition-opacity duration-300"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
