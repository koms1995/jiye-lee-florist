import { SERVICES, INSTAGRAM_HANDLE, INSTAGRAM_URL, ABOUT_TEXT, NAV_LINKS, KAKAO_LINK } from '@/lib/constants'

test('SERVICES has 6 items each with id, name, nameEn, description', () => {
  expect(SERVICES).toHaveLength(6)
  SERVICES.forEach((s) => {
    expect(s).toHaveProperty('id')
    expect(s).toHaveProperty('name')
    expect(s).toHaveProperty('nameEn')
    expect(s).toHaveProperty('description')
    expect(s.name.length).toBeGreaterThan(0)
    expect(s.description.length).toBeGreaterThan(0)
  })
})

test('INSTAGRAM_URL contains INSTAGRAM_HANDLE', () => {
  expect(INSTAGRAM_URL).toContain(INSTAGRAM_HANDLE)
  expect(INSTAGRAM_HANDLE).toBe('ueeuiue')
})

test('ABOUT_TEXT has greeting and body strings', () => {
  expect(typeof ABOUT_TEXT.greeting).toBe('string')
  expect(typeof ABOUT_TEXT.body).toBe('string')
  expect(ABOUT_TEXT.greeting.length).toBeGreaterThan(0)
})

test('NAV_LINKS each have label and hash href', () => {
  expect(NAV_LINKS.length).toBeGreaterThanOrEqual(4)
  NAV_LINKS.forEach((link) => {
    expect(link.label.length).toBeGreaterThan(0)
    expect(link.href).toMatch(/^#/)
  })
})

test('KAKAO_LINK is defined (may be empty string)', () => {
  expect(KAKAO_LINK).toBeDefined()
})
