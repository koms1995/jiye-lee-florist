# Jiye Lee Florist Portfolio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page florist portfolio website for Jiye Lee — image-forward, fully monochromatic, editorial aesthetic deployed to Vercel.

**Architecture:** Next.js 14 App Router with static generation. All sections compose in `app/page.tsx` from independent components in `components/sections/`. Static content lives in `lib/constants.ts`. No CMS, no form submission — contact is a KakaoTalk link.

**Tech Stack:** Next.js 14, Tailwind CSS, Framer Motion, embla-carousel-react, next-sitemap, @vercel/analytics, Vitest + React Testing Library

---

## File Map

| File | Responsibility |
|------|----------------|
| `app/layout.tsx` | Metadata, fonts (Cormorant Garamond + Inter), Analytics |
| `app/page.tsx` | Section composition only — no logic |
| `app/globals.css` | Base reset, scroll-behavior, selection color |
| `tailwind.config.ts` | Design tokens: colors, fontFamily |
| `next.config.ts` | Image config |
| `next-sitemap.config.js` | Sitemap generation |
| `lib/constants.ts` | All static content (services, links, about text, nav) |
| `components/Navbar.tsx` | Fixed minimal nav, mix-blend-difference trick |
| `components/ui/SectionLabel.tsx` | Reusable all-caps label |
| `components/sections/Hero.tsx` | Full-screen image, italic name, scroll indicator |
| `components/sections/Gallery.tsx` | Masonry grid (desktop) / embla swipe (mobile) |
| `components/sections/About.tsx` | Two-column image + Korean text |
| `components/sections/Services.tsx` | Service cards, KakaoTalk CTA |
| `components/sections/Contact.tsx` | KakaoTalk button + Instagram link |
| `__tests__/constants.test.ts` | Data shape tests |
| `__tests__/navbar.test.tsx` | Nav link rendering |
| `__tests__/hero.test.tsx` | Hero smoke test |
| `__tests__/gallery.test.tsx` | Gallery smoke test |
| `__tests__/about.test.tsx` | About smoke test |
| `__tests__/services.test.tsx` | Services rendering + CTA |
| `__tests__/contact.test.tsx` | Contact links |
| `__tests__/page.test.tsx` | Full page section IDs |

---

### Task 1: Project Scaffolding

**Files:** Creates all Next.js boilerplate + installs all dependencies

- [ ] **Step 1: Scaffold Next.js project in existing directory**

```bash
cd /Users/koms/jiye-lee-florist
pnpm create next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

When prompted interactively:
- Would you like to use TypeScript? → **Yes**
- Would you like to use ESLint? → **Yes**
- Would you like to use Tailwind CSS? → **Yes**
- Would you like your code inside a `src/` directory? → **No**
- Would you like to use App Router? → **Yes**
- Would you like to use Turbopack? → **No**
- Customize default import alias? → **No** (keeps `@/*`)

- [ ] **Step 2: Install feature dependencies**

```bash
pnpm add framer-motion embla-carousel-react @vercel/analytics next-sitemap
```

- [ ] **Step 3: Install test dependencies**

```bash
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 4: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 5: Create vitest.setup.ts**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Add scripts to package.json**

In `package.json`, add inside `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Create placeholder image directories**

```bash
mkdir -p public/images/gallery public/images/about
```

- [ ] **Step 8: Verify dev server starts**

```bash
pnpm dev
```

Expected: Server running at http://localhost:3000 with default Next.js page.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with all dependencies"
```

---

### Task 2: Design System

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/design.test.ts`:
```ts
import config from '../tailwind.config'

test('tailwind config has correct background color token', () => {
  expect(config.theme?.extend?.colors?.background).toBe('#FAFAF8')
})

test('tailwind config has correct text-primary color token', () => {
  expect((config.theme?.extend?.colors as Record<string, string>)['text-primary']).toBe('#1C1C1C')
})

test('tailwind config registers serif font family', () => {
  expect(config.theme?.extend?.fontFamily?.serif).toBeDefined()
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test
```

Expected: FAIL — tailwind.config has no custom colors or fontFamily yet

- [ ] **Step 3: Replace tailwind.config.ts**

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAFAF8',
        'text-primary': '#1C1C1C',
        'text-secondary': '#6B6B6B',
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 4: Replace app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    scroll-behavior: smooth;
  }

  body {
    background-color: #FAFAF8;
    color: #1C1C1C;
    -webkit-font-smoothing: antialiased;
  }

  ::selection {
    background-color: #1C1C1C;
    color: #FAFAF8;
  }
}
```

- [ ] **Step 5: Replace app/layout.tsx**

```tsx
import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Jiye Lee — Florist',
  description: 'Floral design by Jiye Lee. Bouquets, arrangements, and wedding flowers.',
  openGraph: {
    title: 'Jiye Lee — Florist',
    description: 'Floral design by Jiye Lee.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
pnpm test
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add tailwind.config.ts app/globals.css app/layout.tsx __tests__/design.test.ts
git commit -m "feat: design system — color tokens, fonts, global styles"
```

---

### Task 3: Static Content Data

**Files:**
- Create: `lib/constants.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/constants.test.ts`:
```ts
import { SERVICES, INSTAGRAM_HANDLE, INSTAGRAM_URL, ABOUT_TEXT, NAV_LINKS, KAKAO_LINK } from '@/lib/constants'

test('SERVICES has 6 items each with id, name, nameEn, description', () => {
  expect(SERVICES).toHaveLength(6)
  SERVICES.forEach((s) => {
    expect(s).toHaveProperty('id')
    expect(s).toHaveProperty('name')
    expect(s).toHaveProperty('nameEn')
    expect(s).toHaveProperty('description')
    expect(s.name.length).toBeGreaterThan(0)
    expect(s.description.length).toBeGreaterThan(0)
  })
})

test('INSTAGRAM_URL contains INSTAGRAM_HANDLE', () => {
  expect(INSTAGRAM_URL).toContain(INSTAGRAM_HANDLE)
  expect(INSTAGRAM_HANDLE).toBe('ueeuiue')
})

test('ABOUT_TEXT has greeting and body strings', () => {
  expect(typeof ABOUT_TEXT.greeting).toBe('string')
  expect(typeof ABOUT_TEXT.body).toBe('string')
  expect(ABOUT_TEXT.greeting.length).toBeGreaterThan(0)
})

test('NAV_LINKS each have label and hash href', () => {
  expect(NAV_LINKS.length).toBeGreaterThanOrEqual(4)
  NAV_LINKS.forEach((link) => {
    expect(link.label.length).toBeGreaterThan(0)
    expect(link.href).toMatch(/^#/)
  })
})

test('KAKAO_LINK is defined (may be empty string)', () => {
  expect(KAKAO_LINK).toBeDefined()
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test
```

Expected: FAIL — `@/lib/constants` not found

- [ ] **Step 3: Create lib/constants.ts**

```bash
mkdir -p lib
```

Create `lib/constants.ts`:
```ts
export const SERVICES = [
  {
    id: 1,
    name: '꽃다발',
    nameEn: 'Bouquet',
    description: '일상의 감정을 담은 꽃다발입니다. 생일, 기념일, 감사의 마음을 전하세요.',
  },
  {
    id: 2,
    name: '꽃바구니',
    nameEn: 'Flower Basket',
    description: '풍성하고 감각적인 꽃바구니. 특별한 날의 선물로 제격입니다.',
  },
  {
    id: 3,
    name: '웨딩 플라워',
    nameEn: 'Wedding Flowers',
    description: '부케부터 테이블 플라워까지, 당신의 소중한 날을 함께합니다.',
  },
  {
    id: 4,
    name: '공간 연출',
    nameEn: 'Space Styling',
    description: '매장, 행사장, 포토존 등 다양한 공간에 꽃을 더합니다.',
  },
  {
    id: 5,
    name: '조화 & 드라이플라워',
    nameEn: 'Preserved & Dried',
    description: '오래도록 곁에 두고 싶은 꽃을 위한 선택입니다.',
  },
  {
    id: 6,
    name: '맞춤 제작',
    nameEn: 'Custom Order',
    description: '원하시는 스타일, 예산에 맞춰 특별한 꽃을 만들어드립니다.',
  },
]

export const KAKAO_LINK = '' // to be provided by client

export const INSTAGRAM_HANDLE = 'ueeuiue'
export const INSTAGRAM_URL = 'https://www.instagram.com/ueeuiue'

export const ABOUT_TEXT = {
  greeting: '안녕하세요, 플로리스트 이지예입니다.',
  body: '꽃이 가진 고유한 형태와 색채에서 영감을 받아, 일상에 자연스럽게 스며드는 꽃을 만들고 있습니다. 화려함보다는 섬세함, 과함보다는 여백을 중요하게 생각합니다. 한 송이의 꽃도 최선을 다해 담습니다.',
}

export const NAV_LINKS = [
  { label: 'Gallery', href: '#gallery' },
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Contact', href: '#contact' },
]
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/constants.ts __tests__/constants.test.ts
git commit -m "feat: static content data in lib/constants.ts"
```

---

### Task 4: SectionLabel + Navbar

**Files:**
- Create: `components/ui/SectionLabel.tsx`
- Create: `components/Navbar.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/navbar.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Navbar from '@/components/Navbar'

test('Navbar renders site name', () => {
  render(<Navbar />)
  expect(screen.getByText('Jiye Lee')).toBeInTheDocument()
})

test('Navbar renders all four nav links', () => {
  render(<Navbar />)
  expect(screen.getByText('Gallery')).toBeInTheDocument()
  expect(screen.getByText('About')).toBeInTheDocument()
  expect(screen.getByText('Services')).toBeInTheDocument()
  expect(screen.getByText('Contact')).toBeInTheDocument()
})

test('Gallery nav link points to #gallery', () => {
  render(<Navbar />)
  expect(screen.getByText('Gallery').closest('a')).toHaveAttribute('href', '#gallery')
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test
```

Expected: FAIL — Navbar not found

- [ ] **Step 3: Create directories**

```bash
mkdir -p components/ui components/sections
```

- [ ] **Step 4: Create components/ui/SectionLabel.tsx**

```tsx
interface SectionLabelProps {
  children: React.ReactNode
  className?: string
}

export default function SectionLabel({ children, className = '' }: SectionLabelProps) {
  return (
    <span
      className={`text-xs tracking-[0.2em] uppercase font-sans text-text-secondary ${className}`}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 5: Create components/Navbar.tsx**

```tsx
'use client'

import { NAV_LINKS } from '@/lib/constants'

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 mix-blend-difference">
      <a href="#hero" className="text-xs tracking-[0.2em] uppercase font-sans text-white">
        Jiye Lee
      </a>
      <ul className="flex gap-8">
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
```

- [ ] **Step 6: Run test to verify it passes**

```bash
pnpm test
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add components/ui/SectionLabel.tsx components/Navbar.tsx __tests__/navbar.test.tsx
git commit -m "feat: SectionLabel component and Navbar"
```

---

### Task 5: Hero Section

**Files:**
- Create: `components/sections/Hero.tsx`
- Add: `public/images/hero.jpg` (placeholder)

- [ ] **Step 1: Write the failing test**

Create `__tests__/hero.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Hero from '@/components/sections/Hero'

test('Hero renders florist name', () => {
  render(<Hero />)
  expect(screen.getByText('Jiye Lee')).toBeInTheDocument()
})

test('Hero renders Florist subtitle', () => {
  render(<Hero />)
  expect(screen.getByText('Florist')).toBeInTheDocument()
})

test('Hero renders scroll indicator', () => {
  render(<Hero />)
  expect(screen.getByText('Scroll')).toBeInTheDocument()
})

test('Hero section has id="hero"', () => {
  render(<Hero />)
  expect(document.getElementById('hero')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test
```

Expected: FAIL — Hero not found

- [ ] **Step 3: Download placeholder hero image**

```bash
curl -L -o public/images/hero.jpg "https://images.unsplash.com/photo-1487530811015-780130f98cc5?w=1920&q=80"
```

If curl fails, copy any landscape JPG to `public/images/hero.jpg`.

- [ ] **Step 4: Create components/sections/Hero.tsx**

```tsx
'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section id="hero" className="relative h-screen w-full overflow-hidden">
      <Image
        src="/images/hero.jpg"
        alt="Floral arrangement by Jiye Lee"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black/25" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center">
        <motion.h1
          className="font-serif italic text-[13vw] leading-none text-white tracking-tight"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          Jiye Lee
        </motion.h1>
        <motion.p
          className="mt-4 text-xs tracking-[0.3em] uppercase font-sans text-white/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
        >
          Florist
        </motion.p>
      </div>

      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1, ease: 'easeOut' }}
      >
        <span className="text-[10px] tracking-[0.3em] uppercase font-sans text-white/50">
          Scroll
        </span>
        <div className="h-8 w-px bg-white/30" />
      </motion.div>
    </section>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm test
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/sections/Hero.tsx public/images/hero.jpg __tests__/hero.test.tsx
git commit -m "feat: Hero section"
```

---

### Task 6: Gallery Section

**Files:**
- Create: `components/sections/Gallery.tsx`
- Add: `public/images/gallery/01.jpg` through `08.jpg` (placeholders)

- [ ] **Step 1: Write the failing test**

Create `__tests__/gallery.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Gallery from '@/components/sections/Gallery'

test('Gallery section has id="gallery"', () => {
  render(<Gallery />)
  expect(document.getElementById('gallery')).toBeInTheDocument()
})

test('Gallery renders "Gallery" section label', () => {
  render(<Gallery />)
  expect(screen.getByText('Gallery')).toBeInTheDocument()
})

test('Gallery renders 8 images', () => {
  render(<Gallery />)
  const images = screen.getAllByRole('img')
  expect(images.length).toBeGreaterThanOrEqual(8)
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test
```

Expected: FAIL — Gallery not found

- [ ] **Step 3: Download placeholder gallery images**

```bash
curl -L -o public/images/gallery/01.jpg "https://images.unsplash.com/photo-1490750967868-88df5691cc55?w=800&q=80"
curl -L -o public/images/gallery/02.jpg "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=800&q=80"
curl -L -o public/images/gallery/03.jpg "https://images.unsplash.com/photo-1457460866886-40ef9d46b549?w=800&q=80"
curl -L -o public/images/gallery/04.jpg "https://images.unsplash.com/photo-1567696153798-9111f9cd3d0d?w=800&q=80"
curl -L -o public/images/gallery/05.jpg "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800&q=80"
curl -L -o public/images/gallery/06.jpg "https://images.unsplash.com/photo-1561128290-1f0bdf9deb0b?w=800&q=80"
curl -L -o public/images/gallery/07.jpg "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=800&q=80"
curl -L -o public/images/gallery/08.jpg "https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?w=800&q=80"
```

- [ ] **Step 4: Create components/sections/Gallery.tsx**

```tsx
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
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm test
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/sections/Gallery.tsx public/images/gallery/ __tests__/gallery.test.tsx
git commit -m "feat: Gallery section — masonry grid and mobile carousel"
```

---

### Task 7: About Section

**Files:**
- Create: `components/sections/About.tsx`
- Add: `public/images/about/portrait.jpg` (placeholder)

- [ ] **Step 1: Write the failing test**

Create `__tests__/about.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import About from '@/components/sections/About'

test('About section has id="about"', () => {
  render(<About />)
  expect(document.getElementById('about')).toBeInTheDocument()
})

test('About renders Korean greeting text', () => {
  render(<About />)
  expect(screen.getByText(/플로리스트 이지예/)).toBeInTheDocument()
})

test('About renders portrait image', () => {
  render(<About />)
  const img = screen.getByAltText('Jiye Lee, Florist')
  expect(img).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test
```

Expected: FAIL — About not found

- [ ] **Step 3: Download placeholder about image**

```bash
curl -L -o public/images/about/portrait.jpg "https://images.unsplash.com/photo-1487530811015-780130f98cc5?w=900&q=80"
```

- [ ] **Step 4: Create components/sections/About.tsx**

```tsx
'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import SectionLabel from '@/components/ui/SectionLabel'
import { ABOUT_TEXT } from '@/lib/constants'

export default function About() {
  return (
    <section id="about" className="py-24 px-8">
      <motion.div
        className="mb-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <SectionLabel>About</SectionLabel>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center max-w-5xl">
        <motion.div
          className="relative aspect-[3/4] overflow-hidden"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Image
            src="/images/about/portrait.jpg"
            alt="Jiye Lee, Florist"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </motion.div>

        <motion.div
          className="flex flex-col gap-6"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        >
          <h2 className="font-serif italic text-3xl text-text-primary leading-snug">
            {ABOUT_TEXT.greeting}
          </h2>
          <p className="font-sans text-sm leading-relaxed text-text-secondary">
            {ABOUT_TEXT.body}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm test
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/sections/About.tsx public/images/about/ __tests__/about.test.tsx
git commit -m "feat: About section"
```

---

### Task 8: Services Section

**Files:**
- Create: `components/sections/Services.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/services.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Services from '@/components/sections/Services'

test('Services section has id="services"', () => {
  render(<Services />)
  expect(document.getElementById('services')).toBeInTheDocument()
})

test('Services renders all 6 service names', () => {
  render(<Services />)
  expect(screen.getByText('꽃다발')).toBeInTheDocument()
  expect(screen.getByText('꽃바구니')).toBeInTheDocument()
  expect(screen.getByText('웨딩 플라워')).toBeInTheDocument()
  expect(screen.getByText('공간 연출')).toBeInTheDocument()
  expect(screen.getByText('조화 & 드라이플라워')).toBeInTheDocument()
  expect(screen.getByText('맞춤 제작')).toBeInTheDocument()
})

test('Services renders 문의하기 CTA', () => {
  render(<Services />)
  expect(screen.getByText('문의하기')).toBeInTheDocument()
})

test('문의하기 link falls back to #contact when KAKAO_LINK is empty', () => {
  render(<Services />)
  expect(screen.getByText('문의하기').closest('a')).toHaveAttribute('href', '#contact')
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test
```

Expected: FAIL — Services not found

- [ ] **Step 3: Create components/sections/Services.tsx**

```tsx
'use client'

import { motion } from 'framer-motion'
import SectionLabel from '@/components/ui/SectionLabel'
import { SERVICES, KAKAO_LINK } from '@/lib/constants'

export default function Services() {
  const ctaHref = KAKAO_LINK || '#contact'
  const ctaProps = KAKAO_LINK
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {}

  return (
    <section id="services" className="py-24 px-8">
      <motion.div
        className="mb-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <SectionLabel>Services</SectionLabel>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#E8E6E3] border border-[#E8E6E3]">
        {SERVICES.map((service, i) => (
          <motion.div
            key={service.id}
            className="bg-background p-8 flex flex-col gap-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
          >
            <span className="text-[10px] tracking-[0.2em] uppercase font-sans text-text-secondary">
              {service.nameEn}
            </span>
            <h3 className="font-serif italic text-2xl text-text-primary">
              {service.name}
            </h3>
            <p className="font-sans text-sm text-text-secondary leading-relaxed">
              {service.description}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="mt-12 flex justify-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <a
          href={ctaHref}
          {...ctaProps}
          className="inline-block border border-text-primary px-10 py-3 text-xs tracking-[0.2em] uppercase font-sans text-text-primary hover:bg-text-primary hover:text-background transition-colors duration-300"
        >
          문의하기
        </a>
      </motion.div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/sections/Services.tsx __tests__/services.test.tsx
git commit -m "feat: Services section with card grid and KakaoTalk CTA"
```

---

### Task 9: Contact Section

**Files:**
- Create: `components/sections/Contact.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/contact.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Contact from '@/components/sections/Contact'

test('Contact section has id="contact"', () => {
  render(<Contact />)
  expect(document.getElementById('contact')).toBeInTheDocument()
})

test('Contact renders KakaoTalk button', () => {
  render(<Contact />)
  expect(screen.getByText('카카오톡 문의')).toBeInTheDocument()
})

test('Contact renders Instagram link with handle', () => {
  render(<Contact />)
  const igLink = screen.getByRole('link', { name: '@ueeuiue' })
  expect(igLink).toHaveAttribute('href', 'https://www.instagram.com/ueeuiue')
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test
```

Expected: FAIL — Contact not found

- [ ] **Step 3: Create components/sections/Contact.tsx**

```tsx
'use client'

import { motion } from 'framer-motion'
import SectionLabel from '@/components/ui/SectionLabel'
import { KAKAO_LINK, INSTAGRAM_URL, INSTAGRAM_HANDLE } from '@/lib/constants'

export default function Contact() {
  return (
    <section id="contact" className="py-32 px-8 text-center">
      <motion.div
        className="mb-12 flex justify-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <SectionLabel>Contact</SectionLabel>
      </motion.div>

      <motion.h2
        className="font-serif italic text-[6vw] md:text-5xl text-text-primary mb-14 leading-tight"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        꽃으로 이야기해요
      </motion.h2>

      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
      >
        <a
          href={KAKAO_LINK || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-text-primary text-background px-12 py-4 text-xs tracking-[0.2em] uppercase font-sans hover:opacity-75 transition-opacity duration-300"
        >
          카카오톡 문의
        </a>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs tracking-[0.2em] font-sans text-text-secondary hover:text-text-primary transition-colors duration-300"
        >
          @{INSTAGRAM_HANDLE}
        </a>
      </motion.div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/sections/Contact.tsx __tests__/contact.test.tsx
git commit -m "feat: Contact section with KakaoTalk and Instagram links"
```

---

### Task 10: Page Composition

**Files:**
- Modify: `app/page.tsx`
- Modify: `next.config.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/page.test.tsx`:
```tsx
import { render } from '@testing-library/react'
import Page from '@/app/page'

test('Page renders all required section ids', () => {
  render(<Page />)
  expect(document.getElementById('hero')).toBeInTheDocument()
  expect(document.getElementById('gallery')).toBeInTheDocument()
  expect(document.getElementById('about')).toBeInTheDocument()
  expect(document.getElementById('services')).toBeInTheDocument()
  expect(document.getElementById('contact')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test
```

Expected: FAIL — existing page.tsx does not contain these sections

- [ ] **Step 3: Replace app/page.tsx**

```tsx
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
```

- [ ] **Step 4: Replace next.config.ts**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
```

- [ ] **Step 5: Run all tests**

```bash
pnpm test
```

Expected: All tests PASS

- [ ] **Step 6: Verify in browser**

```bash
pnpm dev
```

Open http://localhost:3000. Check:
- Hero full-screen with name fades in
- Gallery grid renders (or carousel on narrow window)
- About two-column layout
- Services card grid
- Contact section with buttons
- Navbar links scroll to correct sections

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx next.config.ts __tests__/page.test.tsx
git commit -m "feat: compose full single-page layout"
```

---

### Task 11: SEO — next-sitemap

**Files:**
- Create: `next-sitemap.config.js`
- Modify: `package.json`

- [ ] **Step 1: Create next-sitemap.config.js**

```js
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://jiyelee.vercel.app',
  generateRobotsTxt: true,
}
```

- [ ] **Step 2: Add postbuild to package.json scripts**

In `package.json`, inside `"scripts"`, add:
```json
"postbuild": "next-sitemap"
```

- [ ] **Step 3: Run build to verify sitemap is generated**

```bash
pnpm build
```

Expected: Build succeeds. `public/sitemap.xml` and `public/robots.txt` are created.

- [ ] **Step 4: Commit**

```bash
git add next-sitemap.config.js package.json public/sitemap.xml public/robots.txt
git commit -m "feat: next-sitemap for SEO"
```

---

### Task 12: Responsive Polish + Final Build Check

**Files:**
- Modify: any component with mobile layout issues found during review

- [ ] **Step 1: Open dev server and check at 375px (iPhone SE)**

```bash
pnpm dev
```

In Chrome DevTools → toggle device → set to 375px width. Check each section visually:

- **Navbar:** "Jiye Lee" and nav links visible without overflow. If they collide, add `hidden sm:flex` to the links list and show a minimal version on mobile.
- **Hero:** Name at `text-[13vw]` = ~48px on mobile — should be readable
- **Gallery:** Embla carousel visible (masonry grid hidden via `hidden md:grid`)
- **About:** Single column (grid stacks naturally on mobile)
- **Services:** Single column cards readable
- **Contact:** Buttons centered, not full width

- [ ] **Step 2: Fix Navbar mobile overflow if needed**

If nav links overflow on 375px, update `components/Navbar.tsx` links list:
```tsx
<ul className="hidden sm:flex gap-8">
```

- [ ] **Step 3: Run full test suite**

```bash
pnpm test
```

Expected: All tests PASS

- [ ] **Step 4: Run production build and check bundle size**

```bash
pnpm build
```

Expected: Build succeeds. Check console output — First Load JS for `/` should be under 300kB.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: responsive polish — complete portfolio site"
```

---

## Post-Launch Checklist (after client provides KakaoTalk URL)

1. Set `KAKAO_LINK` in `lib/constants.ts` to the real URL
2. Replace placeholder images in `public/images/` with real photos
3. Update `ABOUT_TEXT.body` with final Korean bio
4. Update `SITE_URL` in `next-sitemap.config.js` to the live domain
5. Deploy to Vercel: `vercel --prod`
