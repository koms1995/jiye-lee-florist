'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import SectionLabel from '@/components/ui/SectionLabel'

type ImageItem = { src: string; alt: string; rowSpan: string }

const GALLERY_IMAGES: ImageItem[] = [
  { src: '/images/gallery/01.jpg', alt: 'Floral arrangement 1', rowSpan: 'row-span-2' },
  { src: '/images/gallery/02.jpg', alt: 'Floral arrangement 2', rowSpan: 'row-span-1' },
  { src: '/images/gallery/03.jpg', alt: 'Floral arrangement 3', rowSpan: 'row-span-1' },
  { src: '/images/gallery/04.jpg', alt: 'Floral arrangement 4', rowSpan: 'row-span-2' },
  { src: '/images/gallery/05.jpg', alt: 'Floral arrangement 5', rowSpan: 'row-span-1' },
  { src: '/images/gallery/06.jpg', alt: 'Floral arrangement 6', rowSpan: 'row-span-2' },
  { src: '/images/gallery/07.jpg', alt: 'Floral arrangement 7', rowSpan: 'row-span-1' },
  { src: '/images/gallery/08.jpg', alt: 'Floral arrangement 8', rowSpan: 'row-span-1' },
]

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
}

export default function Gallery() {
  const [emblaRef] = useEmblaCarousel({ loop: false })

  return (
    <section id="gallery" className="py-16 md:py-20">
      <div className="px-6 md:px-10 mb-8">
        <SectionLabel>Gallery</SectionLabel>
      </div>

      {/* Desktop: asymmetric masonry grid */}
      <motion.div
        className="hidden md:grid grid-cols-4 auto-rows-[230px]"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {GALLERY_IMAGES.map((img) => (
          <motion.div
            key={img.src}
            className={`relative overflow-hidden group cursor-pointer ${img.rowSpan}`}
            variants={itemVariants}
          >
            <motion.div
              className="absolute inset-0"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="25vw"
              />
            </motion.div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
          </motion.div>
        ))}
      </motion.div>

      {/* Mobile: embla swipe carousel */}
      <div className="md:hidden overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {GALLERY_IMAGES.map((img) => (
            <div key={img.src} className="relative flex-[0_0_80vw] h-[60vw] overflow-hidden">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="80vw"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
