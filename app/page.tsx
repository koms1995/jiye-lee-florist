import Navbar from '@/components/Navbar'
import Hero from '@/components/sections/Hero'
import Gallery from '@/components/sections/Gallery'
import About from '@/components/sections/About'
import Services from '@/components/sections/Services'
import Contact from '@/components/sections/Contact'

export default function Page() {
  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <Hero />
      <Gallery />
      <About />
      <Services />
      <Contact />
      <footer className="py-12 px-8 border-t border-[#E8E6E3]">
        <p className="text-[10px] tracking-[0.2em] uppercase font-sans text-text-secondary text-center">
          © {new Date().getFullYear()} Jiye Lee
        </p>
      </footer>
    </main>
  )
}
