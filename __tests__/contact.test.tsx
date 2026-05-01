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
