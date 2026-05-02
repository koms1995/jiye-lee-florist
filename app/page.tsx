import fs from 'fs'
import path from 'path'
import PortfolioApp from '@/components/PortfolioApp'

export default function Page() {
  const galleryDir = path.join(process.cwd(), 'public/images/gallery')
  const images = fs
    .readdirSync(galleryDir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort()
    .map((f) => `/images/gallery/${f}`)

  return <PortfolioApp images={images} />
}
