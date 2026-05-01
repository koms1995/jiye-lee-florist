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
