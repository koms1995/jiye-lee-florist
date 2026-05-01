import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IntersectionObserver (needed for framer-motion whileInView)
class MockIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  constructor() {}
}
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver

// Mock embla-carousel-react (DOM-heavy, not compatible with jsdom)
vi.mock('embla-carousel-react', () => ({
  default: () => [() => {}, { scrollTo: vi.fn() }],
}))
