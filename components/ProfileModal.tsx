'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useCallback } from 'react'
import PillButtons from './PillButtons'
import { peonyParallax } from './peonyParallax'

const LAYOUT_TRANSITION = { duration: 0.42, ease: [0.76, 0, 0.24, 1] as const }

// ── Career data — newest-first, refined date format ──────────────────────────
type Cert    = { name: string; detail?: string }
type Award   = { title: string; detail?: string; award: string }
type Project = { date: string; title: string; detail?: string }

const CERTIFICATIONS: Cert[] = [
  { name: 'IHK German Florist', detail: '독일 상공회의소 인증 플로리스트' },
]

const AWARDS: Award[] = [
  {
    title:  'Takashimaya × Harijanto Floral Extravagance',
    detail: 'Singapore',
    award:  'Crystal Award',
  },
  {
    title: 'Christmas Floral Fantasy Body Flower Design Contest',
    award: '3rd · Creative',
  },
]

const PROJECTS: Project[] = [
  { date: '2026',                title: '고양국제꽃박람회 콜롬비아관' },
  { date: '2025.12.24',          title: '마시는 米술관' },
  { date: '2025.12.01',          title: '벤처 30주년 기념식' },
  { date: '2025.11.28',          title: 'K-라이스페스타', detail: '농협 주관 · 농림축산식품부 후원' },
  { date: '2025.11.27',          title: '2025 벤처1000억 기업 기념식' },
  { date: '2025.11.15',          title: '에버랜드 × 스노우피크 캠프 필드' },
  { date: '2025.03.26',          title: '삼성물산 홍성 아파트 로제비앙' },
  { date: '2025.02.18 — 03.26',  title: '용인 시대인재 기숙학원' },
  { date: '2024.12.24',          title: "영화 ‘보고타’ VIP 시사회" },
  { date: '2024.11.27',          title: 'Colombia Travel Road Show', detail: 'Marina Park' },
  { date: '2024.11.26',          title: 'EDIYA COFFE LAP × Flowers of Colombia' },
  { date: '2024.11.25',          title: '2024 Flowers of Colombia' },
  { date: '2024.09.26',          title: '서울클럽 120주년 기념식' },
  { date: '2024',                title: "MBC 드라마 ‘바니와 오빠들’" },
  { date: '2023.11.27',          title: '2023 Flowers of Colombia' },
]

interface Props {
  isOpen:         boolean
  onClose:        () => void
  fromBg:         string
  activeStripSi:  number | null
}

// ── Stagger constants — entry animation ─────────────────────────────────────
const STAGGER_BASE = 0.42
const STAGGER_STEP = 0.035

function SectionHeader({ number, title, delay }: { number: string; title: string; delay: number }) {
  return (
    <header className="profile-section__head" style={{ animationDelay: `${delay}s` }}>
      <span className="profile-section__num">{number}</span>
      <h3 className="profile-section__title">{title}</h3>
    </header>
  )
}

function ItemRow({
  meta, title, detail, isLast, delay,
}: {
  meta: string; title: string; detail?: string; isLast: boolean; delay: number
}) {
  return (
    <div
      className={`profile-row${isLast ? ' profile-row--last' : ''}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="profile-row__meta">{meta}</span>
      <div className="profile-row__content">
        <p className="profile-row__title">{title}</p>
        {detail && <p className="profile-row__detail">{detail}</p>}
      </div>
    </div>
  )
}

// ── Bio block — sits below the "Jiye Lee" name ──────────────────────────────
// Numbered roles + brand description. Editorial typography: small caps,
// generous letter-spacing, two-tier color (mauve for roles, taupe for body).
const ROLES = [
  { num: '①', text: 'Floral Designer' },
  { num: '②', text: 'Commercial & Event Specialist' },
  { num: '③', text: 'Botanical Installation Artist' },
]

const DESCRIPTION =
  'FLORAL ARTIST BASED IN SOUTH KOREA, WORKING ACROSS COMMERCIAL, EVENTS, ' +
  'AND EDITORIAL PROJECTS. TRAINED IN KOREA AND EUROPE, WITH A FOCUS ON ' +
  'SEASONAL BOTANICALS AND SPATIAL STORYTELLING.'

function BioBlock({ isMobile }: { isMobile: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{
        opacity: 1, y: 0,
        transition: { delay: 0.36, duration: 0.45, ease: [0.43, 0.13, 0.23, 0.96] },
      }}
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
      style={{
        position:      'absolute',
        pointerEvents: 'none',
        zIndex:        6,
        ...(isMobile
          // Mobile: more breathing room between the name and the roles —
          // 3rem buffer below the name height — for the balanced rhythm
          // (name → space → roles → space → career below the hero).
          ? {
              top:   'calc(1.25rem + 36vw + 3rem)',
              left:  '1.5rem',
              right: '1.5rem',
            }
          : {
              top:      'calc(5rem + 24vw + 2.4rem)',
              left:     '5rem',
              maxWidth: 'min(38vw, 540px)',
            }
        ),
      }}
    >
      {/* Roles — Helvetica Neue grotesque (nrly.co-style), medium weight,
          tight tracking. whiteSpace:nowrap + size tuned so each role fits on
          one line on mobile. Color is a softened warm dark (#3D2828)
          rather than near-black for a less harsh, more refined feel. */}
      <ol style={{
        listStyle:     'none',
        padding:       0,
        margin:        0,
        color:         '#3D2828',
        fontFamily:    '"Helvetica Neue", Helvetica, Arial, system-ui, sans-serif',
        fontWeight:    500,
        fontSize:      isMobile ? '20px' : '26px',
        letterSpacing: '-0.030em',
        lineHeight:    1.45,
      }}>
        {ROLES.map(({ num, text }) => (
          <li key={text} style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '0.45em',
            whiteSpace: 'nowrap',
          }}>
            <span style={{
              fontSize:   isMobile ? '13px' : '17px',
              fontWeight: 400,
              color:      '#3D2828',
              flexShrink: 0,
              opacity:    0.85,
              lineHeight: 1,
            }}>
              {num}
            </span>
            <span>{text}</span>
          </li>
        ))}
      </ol>

      {/* Description — same Inter family, smaller, slightly muted. */}
      <p style={{
        marginTop:     isMobile ? '1.6rem' : '2rem',
        marginBottom:  0,
        color:         '#5A4444',
        fontFamily:    'var(--font-inter), system-ui, sans-serif',
        fontSize:      isMobile ? '12.5px' : '14px',
        letterSpacing: '0.04em',
        lineHeight:    1.7,
        maxWidth:      isMobile ? '24rem' : '100%',
      }}>
        {DESCRIPTION}
      </p>
    </motion.div>
  )
}

function CareerSections() {
  let idx = 0
  const nextDelay = () => STAGGER_BASE + (idx++) * STAGGER_STEP

  return (
    <>
      <section className="profile-section">
        <SectionHeader number="01" title="Certification" delay={nextDelay()} />
        {CERTIFICATIONS.map((c, i) => (
          <ItemRow
            key={c.name}
            meta="CERT"
            title={c.name}
            detail={c.detail}
            isLast={i === CERTIFICATIONS.length - 1}
            delay={nextDelay()}
          />
        ))}
      </section>

      <section className="profile-section">
        <SectionHeader number="02" title="Awards" delay={nextDelay()} />
        {AWARDS.map((a, i) => (
          <ItemRow
            key={a.title}
            meta={a.award}
            title={a.title}
            detail={a.detail}
            isLast={i === AWARDS.length - 1}
            delay={nextDelay()}
          />
        ))}
      </section>

      <section className="profile-section" style={{ marginBottom: '2rem' }}>
        <SectionHeader number="03" title="Selected Projects" delay={nextDelay()} />
        {PROJECTS.map((p, i) => (
          <ItemRow
            key={`${p.date}-${i}`}
            meta={p.date}
            title={p.title}
            detail={p.detail}
            isLast={i === PROJECTS.length - 1}
            delay={nextDelay()}
          />
        ))}
      </section>
    </>
  )
}

// ── Main ────────────────────────────────────────────────────────────────────
// The 3D canvas is NOT rendered here — it lives at PortfolioApp level for
// persistent mounting (see /components/PortfolioApp.tsx). This component
// renders two layers:
//   1. modal-bg (z=900): background motion.div with layoutId for the
//      card→fullscreen FLIP expansion.
//   2. modal-content (z=905): all UI (close button, name, scroll text).
//      Persistent canvas sits at z=902 between these two layers.
export default function ProfileModal({ isOpen, onClose, fromBg, activeStripSi }: Props) {
  const vw       = typeof window !== 'undefined' ? window.innerWidth : 1440
  const isMobile = vw < 768
  const cardLayoutId = activeStripSi !== null ? `card-${activeStripSi}` : undefined

  // Desktop scroll handler — feeds peonyParallax (consumed by PeonyCanvas useFrame)
  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el  = e.currentTarget
    const max = el.scrollHeight - el.clientHeight
    peonyParallax.progress = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0
  }, [])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── BACKGROUND LAYER — handles card→fullscreen layoutId expansion ── */}
          <motion.div
            key="modal-bg"
            layoutId={cardLayoutId}
            style={{
              position: 'fixed',
              inset:    0,
              zIndex:   900,
              overflow: 'hidden',
            }}
            initial={{ backgroundColor: fromBg }}
            animate={{ backgroundColor: '#EDE0D4' }}
            exit={{ backgroundColor: fromBg }}
            transition={LAYOUT_TRANSITION}
          />

          {/* ── CONTENT LAYER — fades in after bg expands. Sits ABOVE the
              persistent 3D canvas (z=902) so text/buttons aren't occluded. ── */}
          <motion.div
            key="modal-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.30, duration: 0.32, ease: 'easeOut' } }}
            exit={{ opacity: 0, transition: { duration: 0.20, ease: 'easeIn' } }}
            style={{
              position:      'fixed',
              inset:         0,
              zIndex:        905,
              pointerEvents: 'none',
            }}
          >
            {/* Close button */}
            <motion.button
              onClick={onClose}
              aria-label="Close profile"
              whileHover={{ scale: 1.06, transition: { duration: 0.18 } }}
              style={{
                position:      'absolute',
                top:           '1.5rem',
                right:         '1.5rem',
                width:         '2.75rem',
                height:        '2.75rem',
                borderRadius:  '50%',
                border:        '1px solid #D8A9AC',
                background:    'transparent',
                cursor:        'pointer',
                color:         '#D8A9AC',
                fontSize:      '1.3rem',
                display:       'flex',
                alignItems:    'center',
                justifyContent:'center',
                pointerEvents: 'auto',
                zIndex:        2,
              }}
            >
              ×
            </motion.button>

            {isMobile ? (
              // ── Mobile — text scrolls; canvas is fixed at the top hero region ──
              <div
                className="profile-scroll"
                style={{
                  position:      'absolute',
                  inset:         0,
                  overflowY:     'auto',
                  pointerEvents: 'auto',
                }}
              >
                {/* Top hero area — shortened from 58vh → 53vh so the career
                    section rides higher and the rhythm feels tighter.
                    Name + bio still sit absolute-positioned within the hero,
                    layered above the fixed PeonyCanvas at z=902. */}
                <div style={{ position: 'relative', height: '53vh' }}>
                  <h2
                    style={{
                      position:      'absolute',
                      top:           '1.25rem',
                      left:          '1.25rem',
                      fontFamily:    'var(--font-cormorant), Georgia, serif',
                      fontWeight:    300,
                      fontStyle:     'italic',
                      fontSize:      '23vw',
                      lineHeight:    0.80,
                      letterSpacing: '-0.04em',
                      color:         '#D8A9AC',
                      margin:        0,
                      pointerEvents: 'none',
                    }}
                  >
                    Jiye<br />Lee
                  </h2>

                  {/* Bio inside hero — absolute-positioned so it overlaps
                      the tulip canvas. Editorial layered composition. */}
                  <BioBlock isMobile />
                </div>

                <div style={{ padding: '1.25rem 1.5rem 7rem' }}>
                  <CareerSections />
                </div>
              </div>
            ) : (
              // ── Desktop — left name + right scroll. Canvas is fixed at right.
              <>
                <h2
                  style={{
                    position:      'absolute',
                    top:           '5rem',
                    left:          '5rem',
                    fontFamily:    'var(--font-cormorant), Georgia, serif',
                    fontWeight:    300,
                    fontStyle:     'italic',
                    fontSize:      '15vw',
                    lineHeight:    0.80,
                    letterSpacing: '-0.04em',
                    color:         '#D8A9AC',
                    margin:        0,
                    pointerEvents: 'none',
                  }}
                >
                  Jiye<br />Lee
                </h2>

                {/* Bio absolute-positioned beneath the name, on the left half. */}
                <BioBlock isMobile={false} />

                <div
                  className="profile-scroll"
                  onScroll={onScroll}
                  style={{
                    position:      'absolute',
                    top:           0,
                    bottom:        0,
                    left:          '50vw',
                    right:         0,
                    overflowY:     'auto',
                    padding:       '7vh 6rem 8vh 2rem',
                    pointerEvents: 'auto',
                  }}
                >
                  <CareerSections />
                </div>
              </>
            )}

            <PillButtons />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
