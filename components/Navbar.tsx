export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-6 mix-blend-difference pointer-events-none">
      <a
        href="#"
        className="pointer-events-auto text-[11px] tracking-[0.25em] uppercase font-sans text-white"
      >
        Jiye Lee
      </a>
      <a
        href="#about"
        className="pointer-events-auto text-[11px] tracking-[0.25em] uppercase font-sans text-white hover:opacity-50 transition-opacity duration-300"
      >
        About ↗
      </a>
    </nav>
  )
}
