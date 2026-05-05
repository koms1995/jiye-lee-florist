// ── Editorial 4-theme palette ────────────────────────────────────────────────
// Each TextCard and the ProfileModal it expands into are colored by these
// four themes, cycled deterministically by strip index (`si % N_THEMES`).
// Designed for editorial high-contrast: two dark-bg/light-body themes and
// two light-bg/dark-body themes alternate, so scrolling produces a paced
// rhythm of light/dark cards.

export type Theme = {
  /** Card / modal background */
  bg:      string
  /** Display name color ("Jiye Lee") + section/role headlines */
  title:   string
  /** Primary body copy (descriptions, role names, item titles) */
  body:    string
  /** Secondary text — meta labels (CERT, dates, section numbers) */
  meta:    string
  /** Hairline borders, dividers, row separators */
  divider: string
  /** Interactive accent — close-button border, pill borders & wipes */
  point:   string
}

export const THEMES: readonly Theme[] = [
  // ── 1 · Forest / Mustard — high contrast, editorial ────────────────────
  {
    bg:      '#2E4733',
    title:   '#F2B705',
    body:    '#FFFFFF',
    meta:    'rgba(255, 255, 255, 0.55)',
    divider: 'rgba(242, 183, 5, 0.30)',
    point:   '#F2B705',
  },
  // ── 2 · Charcoal / Mauve — high contrast, refined ──────────────────────
  {
    bg:      '#4A4A4A',
    title:   '#D8A9AC',
    body:    '#FFFFFF',
    meta:    'rgba(255, 255, 255, 0.55)',
    divider: 'rgba(216, 169, 172, 0.32)',
    point:   '#D8A9AC',
  },
  // ── 3 · Cream / Terracotta — warm, daylight ────────────────────────────
  {
    bg:      '#E6D5C3',
    title:   '#C24D2C',
    body:    '#2E1F1F',
    meta:    'rgba(46, 31, 31, 0.55)',
    divider: 'rgba(194, 77, 44, 0.32)',
    point:   '#C24D2C',
  },
  // ── 4 · Pink / Ink — soft, blush, ink-on-pink ──────────────────────────
  {
    bg:      '#E4B1B1',
    title:   '#2E1F1F',
    body:    '#2E1F1F',
    meta:    'rgba(46, 31, 31, 0.55)',
    divider: 'rgba(46, 31, 31, 0.28)',
    point:   '#2E1F1F',
  },
] as const

export const N_THEMES = THEMES.length

/** Deterministic theme assignment by strip index. */
export function themeForStrip(si: number): Theme {
  return THEMES[((si % N_THEMES) + N_THEMES) % N_THEMES]
}

// ── Luminance helpers — readability fallback if a custom theme is added
// later without specifying body color. Uses Rec. 601 luma weights.
export function relativeLuminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return 0.5
  const c = parseInt(m[1], 16)
  const r = (c >> 16) & 0xff, g = (c >> 8) & 0xff, b = c & 0xff
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/** Pick a readable body color for an arbitrary background. */
export function bodyForBg(bg: string): string {
  return relativeLuminance(bg) > 0.55 ? '#2E1F1F' : '#FFFFFF'
}

/** Expose the theme as CSS custom properties — set this on the modal root
 *  so descendant CSS classes can reference --theme-* without inline styles. */
export function themeCssVars(t: Theme): React.CSSProperties {
  return {
    '--theme-bg':      t.bg,
    '--theme-title':   t.title,
    '--theme-body':    t.body,
    '--theme-meta':    t.meta,
    '--theme-divider': t.divider,
    '--theme-point':   t.point,
  } as React.CSSProperties
}
