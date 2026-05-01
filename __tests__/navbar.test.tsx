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
