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
