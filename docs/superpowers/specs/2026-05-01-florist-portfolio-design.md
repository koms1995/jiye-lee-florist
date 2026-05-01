# Jiye Lee Florist Portfolio — Design Spec

**Date:** 2026-05-01
**Status:** Approved

---

## Overview

A single-page florist portfolio website for Jiye Lee. English-based UI with Korean descriptions. Premium aesthetic focused on sensibility and taste — not flashy luxury. Inspired by nrly.co: image-forward, extremely minimal chrome, monochromatic palette.

---

## Tech Stack

| Role | Choice |
|------|--------|
| Framework | Next.js 14+ (App Router, SSG) |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Carousel | embla-carousel-react |
| SEO | next-sitemap |
| Analytics | @vercel/analytics |
| Deployment | Vercel |

No CMS (static data in `lib/constants.ts`). No form library (contact via KakaoTalk link only).

---

## Architecture

Single page (`app/page.tsx`) composed of section components. Static build.

```
app/
  page.tsx           — section composition
  layout.tsx         — metadata, font config
components/
  sections/
    Hero.tsx
    Gallery.tsx
    About.tsx
    Services.tsx
    Contact.tsx
    Instagram.tsx
  ui/                — reusable primitives (button, etc.)
lib/
  constants.ts       — static data (services list, about text, Instagram handle)
public/
  images/            — gallery and about images
```

---

## Sections

### Hero
- Full-screen, large floral image background
- "Jiye Lee" in large italic Cormorant Garamond, centered or offset
- Subtle scroll indicator at bottom
- Framer Motion: text fade-in on load

### Gallery
- Asymmetric masonry grid (desktop), swipe carousel (mobile via embla-carousel)
- Images stored in `public/images/gallery/`, served via Next.js `<Image>`
- Hover: smooth scale + dark overlay with no text (pure visual)
- No category filtering (static, simple)

### About
- Two-column layout: image left, Korean text right
- Scroll-triggered fade-in from left/right via Framer Motion
- Text content: florist introduction in Korean

### Services / Pricing
- Card grid showing service types (꽃다발, 꽃바구니, etc.)
- Each card: service name + short description, no price displayed
- CTA: "문의하기" button linking to KakaoTalk open chat
- Price model: inquiry-based ("가격 문의")

### Contact
- KakaoTalk open chat button (URL to be provided later, placeholder in constants.ts)
- Instagram link (@ueeuiue → https://instagram.com/ueeuiue)
- Minimal layout, centered, generous whitespace

### Instagram
- Static section with @ueeuiue handle and Instagram icon
- Link to profile (no API integration)
- Optional: manually curated 6 preview images from `public/images/instagram/`

---

## Design System

| Token | Value |
|-------|-------|
| Background | `#FAFAF8` (near-white, very slightly warm) |
| Text primary | `#1C1C1C` |
| Text secondary | `#6B6B6B` |
| Accent | None — fully monochromatic |
| Display font | Cormorant Garamond, Italic weight (hero name, section titles) |
| Body font | Inter (UI labels, body text) |
| UI text style | Small size, all-caps, wide letter-spacing for labels/nav |

### Typography Scale
- Hero name: `text-[10vw]` italic serif
- Section labels: `text-xs tracking-[0.2em] uppercase` sans-serif
- Body: `text-base` or `text-sm` sans-serif
- Korean body text: same Inter stack (renders well in Korean)

### Animation Principles
- All animations: ease-out, 0.6–0.8s duration
- No bouncy or springy effects — deliberate and calm
- Scroll-triggered fade-ins via Framer Motion `whileInView`
- Image hover: `scale(1.03)` with `transition: 400ms ease`

---

## Data / Content

Managed in `lib/constants.ts`:

```ts
export const SERVICES = [
  { name: "꽃다발", description: "..." },
  { name: "꽃바구니", description: "..." },
  // ...more
]

export const KAKAO_LINK = "" // to be filled in
export const INSTAGRAM_HANDLE = "ueeuiue"
export const ABOUT_TEXT = "..." // Korean text
```

---

## SEO & Performance

- `next-sitemap` for automatic sitemap generation
- OpenGraph meta tags in `layout.tsx` (title: "Jiye Lee — Florist", description in English)
- All images use Next.js `<Image>` with `priority` on hero image
- `@vercel/analytics` added to `layout.tsx`
- Target: Lighthouse performance > 90

---

## Out of Scope

- CMS integration
- Dark/light mode toggle
- Multi-language toggle
- KakaoTalk open chat URL (placeholder until client provides)
- Actual gallery/about images (placeholder images during development)
