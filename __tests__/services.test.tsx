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
