'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'

// Grid items — 'name' tile is embedded at index 2
type GridItem =
  | { type: 'image'; src: string; alt: string; rowSpan: string }
  | { type: 'name'; rowSpan: string }

const GRID_ITEMS: GridItem[] = [
  { type: 'image', src: '/images/gallery/01.jpg', alt: 'Floral arrangement 1', rowSpan: 'row-span-2' },
  { type: 'image', src: '/images/gallery/02.jpg', alt: 'Floral arrangement 2', rowSpan: 'row-span-1' },
  { type: 'name', rowSpan: 'row-span-2' },
  { type: 'image', src: '/images/gallery/03.jpg', alt: 'Floral arrangement 3', rowSpan: 'row-span-1' },
  { type: 'image', src: '/images/gallery/04.jpg', alt: 'Floral arrangement 4', rowSpan: 'row-span-1' },
  { type: 'image', src: '/images/gallery/05.jpg', alt: 'Floral arrangement 5', rowSpan: 'row-span-1' },
  { type: 'image', src: '/images/gallery/06.jpg', alt: 'Floral arrangement 6', rowSpan: 'row-span-2' },
  { type: 'image', src: '/images/gallery/07.jpg', alt: 'Floral arrangement 7', rowSpan: 'row-span-1' },
  { type: 'image', src: '/images/gallery/08.jpg', alt: 'Floral arrangement 8', rowSpan: 'row-span-1' },
]

const MOBILE_IMAGES = GRID_ITEMS.filter((item) => item.type === 'image') as Extract<GridItem, { type: 'image' }>[]

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
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
    <section id="gallery" className="pt-0">
      {/* Desktop: staggered masonry grid with embedded name tile */}
      <motion.div
        className="hidden md:grid grid-cols-4 auto-rows-[230px]"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {GRID_ITEMS.map((item, i) =>
          item.type === 'name' ? (
            <motion.div
              key="name-tile"
              className={`relative flex items-center justify-center bg-[#EDE8E2] ${item.rowSpan}`}
              variants={itemVariants}
            >
              <h1 className="font-serif italic text-[clamp(2.5rem,4vw,4rem)] text-text-primary leading-none tracking-tight px-6 text-center">
                Jiye Lee
              </h1>
            </motion.div>
          ) : (
            <motion.div
              key={(item as Extract<GridItem, { type: 'image' }>).src}
              className={`relative overflow-hidden group cursor-pointer ${item.rowSpan}`}
              variants={itemVariants}
            >
                <motion.div
                className="absolute inset-0"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <Image
                  src={(item as Extract<GridItem, { type: 'image' }>).src}
                  alt={(item as Extract<GridItem, { type: 'image' }>).alt}
                  fill
                  className="object-cover"
                  sizes="25vw"
                  priority={i < 4}
                />
              </motion.div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
            </motion.div>
          )
        )}
      </motion.div>

      {/* Mobile: embla swipe carousel */}
      <div className="md:hidden pt-20 overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {/* Name tile first on mobile */}
          <div className="relative flex-[0_0_75vw] h-[55vw] flex items-center justify-center bg-[#EDE8E2]">
            <h1 className="font-serif italic text-5xl text-text-primary leading-none">
              Jiye Lee
            </h1>
          </div>
          {MOBILE_IMAGES.map((img) => (
            <div key={img.src} className="relative flex-[0_0_75vw] h-[55vw] overflow-hidden">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="75vw"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
