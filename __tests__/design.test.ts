import { readFileSync } from 'fs'
import { resolve } from 'path'

const css = readFileSync(resolve(__dirname, '../app/globals.css'), 'utf-8')

test('globals.css defines background color token', () => {
  expect(css).toContain('--color-background: #FAFAF8')
})

test('globals.css defines text-primary color token', () => {
  expect(css).toContain('--color-text-primary: #1C1C1C')
})

test('globals.css defines text-secondary color token', () => {
  expect(css).toContain('--color-text-secondary: #6B6B6B')
})

test('globals.css defines serif font variable', () => {
  expect(css).toContain('--font-serif')
})

test('globals.css defines sans font variable', () => {
  expect(css).toContain('--font-sans')
})
