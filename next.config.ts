import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
    // Next.js 16+ tightened the default Image quality allowlist to [75] only.
    // We use quality={80} on grid cells for better visual fidelity on
    // larger desktop displays — declare it explicitly here so the
    // optimization endpoint accepts requests with q=80.
    qualities: [60, 75, 80, 85],
  },
}

export default nextConfig
