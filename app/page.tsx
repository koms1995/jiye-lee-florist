import Navbar from '@/components/Navbar'
import Gallery from '@/components/sections/Gallery'
import About from '@/components/sections/About'
import Footer from '@/components/Footer'

export default function Page() {
  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <Gallery />
      <About />
      <Footer />
    </main>
  )
}
