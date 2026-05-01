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
