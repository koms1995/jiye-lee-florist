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
