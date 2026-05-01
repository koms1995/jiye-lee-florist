'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import SectionLabel from '@/components/ui/SectionLabel'

const GALLERY_IMAGES = [
  { src: '/images/gallery/01.jpg', alt: 'Floral arrangement 1', rowSpan: 'row-span-2' },
  { src: '/images/gallery/02.jpg', alt: 'Floral arrangement 2', rowSpan: 'row-span-1' },
  { src: '/images/gallery/03.jpg', alt: 'Floral arrangement 3', rowSpan: 'row-span-1' },
  { src: '/images/gallery/04.jpg', alt: 'Floral arrangement 4', rowSpan: 'row-span-2' },
  { src: '/images/gallery/05.jpg', alt: 'Floral arrangement 5', rowSpan: 'row-span-1' },
  { src: '/images/gallery/06.jpg', alt: 'Floral arrangement 6', rowSpan: 'row-span-1' },
  { src: '/images/gallery/07.jpg', alt: 'Floral arrangement 7', rowSpan: 'row-span-2' },
  { src: '/images/gallery/08.jpg', alt: 'Floral arrangement 8', rowSpan: 'row-span-1' },
]

export default function Gallery() {
  const [emblaRef] = useEmblaCarousel({ loop: false })

  return (
    <section id="gallery" className="py-24 px-8">
      <motion.div
        className="mb-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <SectionLabel>Gallery</SectionLabel>
      </motion.div>

      {/* Desktop: asymmetric masonry grid */}
      <div className="hidden md:grid grid-cols-4 auto-rows-[220px] gap-2">
        {GALLERY_IMAGES.map((img, i) => (
          <motion.div
            key={img.src}
            className={`relative overflow-hidden group ${img.rowSpan}`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              sizes="25vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-[400ms]" />
          </motion.div>
        ))}
      </div>

      {/* Mobile: embla swipe carousel */}
      <div className="md:hidden overflow-hidden" ref={emblaRef}>
        <div className="flex gap-2">
          {GALLERY_IMAGES.map((img) => (
            <div
              key={img.src}
              className="relative flex-[0_0_85vw] h-[60vw] overflow-hidden"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="85vw"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
