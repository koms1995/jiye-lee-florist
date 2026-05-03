'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ── Motion constants ───────────────────────────────────────────────────────────
const BLOOM_SPEED   = 0.28   // rad/s — full ping-pong cycle ≈ 22 s
const STAGGER_RANGE = 0.44   // inner layers lag by this fraction of bloom range
const N_LAYERS      = 7

// ── Layer definitions (bud → bloom) ───────────────────────────────────────────
type LayerDef = {
  count:     number
  bloomR:    number   // radial distance when fully open
  budR:      number   // radial distance when closed
  bloomTilt: number   // X-rotation when open (rad)
  budTilt:   number   // X-rotation when closed (rad, near vertical)
  scaleW:    number   // petal half-width
  scaleH:    number   // petal height
  yBase:     number   // vertical offset of layer group
  rotOffset: number   // azimuth phase offset for layer
}

const LAYERS: LayerDef[] = [
  // li=0 → innermost,  li=6 → outermost
  { count:5,  bloomR:0.07, budR:0.012, bloomTilt:0.18, budTilt:0.00, scaleW:0.10, scaleH:0.22, yBase: 0.07,  rotOffset:0.00 },
  { count:6,  bloomR:0.14, budR:0.022, bloomTilt:0.34, budTilt:0.01, scaleW:0.14, scaleH:0.30, yBase: 0.02,  rotOffset:0.52 },
  { count:7,  bloomR:0.23, budR:0.040, bloomTilt:0.52, budTilt:0.02, scaleW:0.18, scaleH:0.38, yBase:-0.04,  rotOffset:0.28 },
  { count:7,  bloomR:0.34, budR:0.070, bloomTilt:0.70, budTilt:0.04, scaleW:0.22, scaleH:0.46, yBase:-0.09,  rotOffset:0.78 },
  { count:8,  bloomR:0.46, budR:0.100, bloomTilt:0.88, budTilt:0.06, scaleW:0.26, scaleH:0.54, yBase:-0.15,  rotOffset:0.18 },
  { count:8,  bloomR:0.60, budR:0.140, bloomTilt:1.06, budTilt:0.09, scaleW:0.30, scaleH:0.62, yBase:-0.21,  rotOffset:0.62 },
  { count:7,  bloomR:0.75, budR:0.180, bloomTilt:1.22, budTilt:0.12, scaleW:0.32, scaleH:0.70, yBase:-0.27,  rotOffset:0.38 },
]

// Flat petal-index offsets for ref arrays
const LAYER_OFFSETS = LAYERS.map((_, li) =>
  LAYERS.slice(0, li).reduce((s, l) => s + l.count, 0)
)
const TOTAL_PETALS = LAYERS.reduce((s, l) => s + l.count, 0)

// ── Helpers ────────────────────────────────────────────────────────────────────
const lerpN = (a: number, b: number, t: number) => a + (b - a) * t

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

// Organic petal silhouette (base at y=0, tip at y=h)
function buildPetalShape(w: number, h: number): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.bezierCurveTo( w * 0.90, h * 0.08,  w * 0.88, h * 0.82, 0, h)
  s.bezierCurveTo(-w * 0.88, h * 0.82, -w * 0.90, h * 0.08, 0, 0)
  return s
}

// Coral gradient: inner = #FF7F50, outer = #F88379
const C_INNER = new THREE.Color('#FF7F50')
const C_OUTER = new THREE.Color('#F88379')

// ── Peony scene object ─────────────────────────────────────────────────────────
function Peony() {
  const groupRef  = useRef<THREE.Group>(null)
  const stamenRef = useRef<THREE.Mesh>(null)
  const { mouse } = useThree()
  const mSmooth   = useRef({ x: 0, y: 0 })

  // Per-petal mutable refs (flat arrays, indexed by LAYER_OFFSETS[li] + pi)
  const radialRefs = useRef<(THREE.Group | null)[]>(Array(TOTAL_PETALS).fill(null))
  const tiltRefs   = useRef<(THREE.Group | null)[]>(Array(TOTAL_PETALS).fill(null))

  // ── Geometries ───────────────────────────────────────────────────────────────
  const shapeGeoms = useMemo(() =>
    LAYERS.map(l => new THREE.ShapeGeometry(buildPetalShape(l.scaleW, l.scaleH), 22)),
    []
  )

  // ── Materials (MeshPhysicalMaterial with sheen + subtle transmission) ────────
  const petalMats = useMemo(() =>
    LAYERS.map((_, li) => {
      const t = li / (N_LAYERS - 1)
      const color = C_INNER.clone().lerp(C_OUTER, t)
      return new THREE.MeshPhysicalMaterial({
        color,
        roughness:           0.30,
        metalness:           0.00,
        // Slight transmission so backlight warms the petal (SSS approximation)
        transmission:        0.07,
        thickness:           0.55,
        attenuationColor:    new THREE.Color('#FF5C30'),
        attenuationDistance: 1.1,
        // Silky retroreflection
        sheen:               0.60,
        sheenRoughness:      0.50,
        sheenColor:          new THREE.Color('#FFD4A0'),
        side: THREE.DoubleSide,
      })
    }),
    []
  )

  const stamenMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color:        new THREE.Color('#F5C030'),
    roughness:    0.50,
    metalness:    0.12,
    sheen:        0.35,
    sheenColor:   new THREE.Color('#FFE870'),
    sheenRoughness: 0.4,
  }), [])

  // Dispose on unmount
  useEffect(() => () => {
    shapeGeoms.forEach(g => g.dispose())
    petalMats.forEach(m => m.dispose())
    stamenMat.dispose()
  }, [shapeGeoms, petalMats, stamenMat])

  // ── Animation ─────────────────────────────────────────────────────────────────
  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()

    // Smooth mouse parallax tilt
    mSmooth.current.x += (mouse.x * 0.14 - mSmooth.current.x) * 0.04
    mSmooth.current.y += (-mouse.y * 0.09 - mSmooth.current.y) * 0.04
    groupRef.current.rotation.y = t * 0.06 + mSmooth.current.x
    groupRef.current.rotation.x = mSmooth.current.y

    // Global bloom: 0 = bud (t=0), 1 = fully open, ping-pong
    const globalBloom = (Math.sin(t * BLOOM_SPEED - Math.PI / 2) + 1) / 2

    // Stamen fades in only when flower is mostly open
    if (stamenRef.current) {
      const stamenShow = smoothstep(0.55, 0.85, globalBloom)
      stamenRef.current.scale.setScalar(stamenShow)
    }

    // Update each layer's petals
    for (let li = 0; li < N_LAYERS; li++) {
      const layer = LAYERS[li]
      // Outer layers (high li) lead → smaller delay
      const delay    = ((N_LAYERS - 1 - li) / (N_LAYERS - 1)) * STAGGER_RANGE
      const progress = smoothstep(delay, 1.0, globalBloom)

      const radius = lerpN(layer.budR,    layer.bloomR,    progress)
      const tilt   = lerpN(layer.budTilt, layer.bloomTilt, progress)
      const base   = LAYER_OFFSETS[li]

      for (let pi = 0; pi < layer.count; pi++) {
        const rg = radialRefs.current[base + pi]
        const tg = tiltRefs.current[base + pi]
        if (rg) rg.position.z = radius
        if (tg) tg.rotation.x = tilt
      }
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>

      {/* ── Stamen ── */}
      <mesh ref={stamenRef} position={[0, 0.08, 0]} material={stamenMat} scale={0}>
        <sphereGeometry args={[0.095, 20, 20]} />
      </mesh>
      {/* Filaments */}
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2
        const r = 0.058
        return (
          <mesh
            key={`f${i}`}
            position={[Math.cos(a) * r, 0.065, Math.sin(a) * r]}
            material={stamenMat}
          >
            <cylinderGeometry args={[0.0025, 0.0018, 0.092, 5]} />
          </mesh>
        )
      })}

      {/* ── Petal layers ── */}
      {LAYERS.map((layer, li) => {
        const step   = (Math.PI * 2) / layer.count
        const offset = LAYER_OFFSETS[li]
        return Array.from({ length: layer.count }, (_, pi) => {
          const az = step * pi + layer.rotOffset
          return (
            <group key={`${li}-${pi}`} rotation={[0, az, 0]}>
              {/* Vertical offset per layer */}
              <group position={[0, layer.yBase, 0]}>
                {/* Radial group — z = animated radius */}
                <group
                  ref={el => { radialRefs.current[offset + pi] = el as THREE.Group | null }}
                  position={[0, 0, layer.budR]}
                >
                  {/* Tilt group — rotation.x = animated tilt */}
                  <group
                    ref={el => { tiltRefs.current[offset + pi] = el as THREE.Group | null }}
                    rotation={[layer.budTilt, 0, 0]}
                  >
                    <mesh geometry={shapeGeoms[li]} material={petalMats[li]} />
                  </group>
                </group>
              </group>
            </group>
          )
        })
      })}

      {/* ── Stem ── */}
      <mesh position={[0, -1.1, 0]}>
        <cylinderGeometry args={[0.016, 0.021, 1.4, 8]} />
        <meshStandardMaterial color="#5C8A5C" roughness={0.85} metalness={0} />
      </mesh>

      {/* ── Leaves ── */}
      <group position={[0.06, -0.65, 0.04]} rotation={[0.25, 0.45, 0.75]}>
        <mesh>
          <planeGeometry args={[0.20, 0.30]} />
          <meshStandardMaterial color="#4A7A4A" side={THREE.DoubleSide} roughness={0.85} />
        </mesh>
      </group>
      <group position={[-0.07, -0.90, -0.04]} rotation={[-0.18, -0.55, -0.68]}>
        <mesh>
          <planeGeometry args={[0.16, 0.25]} />
          <meshStandardMaterial color="#4A7A4A" side={THREE.DoubleSide} roughness={0.85} />
        </mesh>
      </group>

    </group>
  )
}

// ── Canvas ─────────────────────────────────────────────────────────────────────
export default function PeonyCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 2.6], fov: 52 }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      gl={{ alpha: true, antialias: true }}
    >
      {/* Ambient */}
      <ambientLight intensity={0.40} />
      {/* Key light — warm, upper right */}
      <directionalLight intensity={1.10} position={[3, 5, 3]}  color="#FFF6EE" />
      {/* Fill light — cool, left */}
      <directionalLight intensity={0.22} position={[-3, 1, -2]} color="#EEF2FF" />
      {/* Warm backlight behind flower — simulates SSS coral glow through petals */}
      <pointLight intensity={0.60} position={[0, 1.2, -2.8]} color="#FF7744" />
      <Peony />
    </Canvas>
  )
}
