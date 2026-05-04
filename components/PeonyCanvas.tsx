'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

// ── Motion ────────────────────────────────────────────────────────────────────
const BLOOM_SPEED   = 0.18   // rad/s — one full cycle ≈ 35 s
const STAGGER_RANGE = 0.58   // inner layers lag behind outer layers
const N_LAYERS      = 7

// ── Layer definitions ─────────────────────────────────────────────────────────
type LayerDef = {
  count:     number
  bloomR:    number  // radial distance fully open
  budR:      number  // radial distance closed
  bloomTilt: number  // X-rotation open (rad)
  budTilt:   number  // X-rotation closed
  scaleW:    number  // petal half-width
  scaleH:    number  // petal height
  yBase:     number  // layer Y offset
  rotOffset: number  // azimuth phase
  cup:       number  // bowl curvature depth
}

const LAYERS: LayerDef[] = [
  { count:6,  bloomR:0.072, budR:0.010, bloomTilt:0.10, budTilt:0.00, scaleW:0.090, scaleH:0.22, yBase: 0.13, rotOffset:0.00, cup:0.030 },
  { count:7,  bloomR:0.150, budR:0.020, bloomTilt:0.26, budTilt:0.01, scaleW:0.130, scaleH:0.31, yBase: 0.06, rotOffset:0.45, cup:0.050 },
  { count:8,  bloomR:0.255, budR:0.038, bloomTilt:0.48, budTilt:0.02, scaleW:0.180, scaleH:0.42, yBase:-0.02, rotOffset:0.22, cup:0.075 },
  { count:8,  bloomR:0.380, budR:0.065, bloomTilt:0.68, budTilt:0.03, scaleW:0.230, scaleH:0.53, yBase:-0.11, rotOffset:0.70, cup:0.095 },
  { count:9,  bloomR:0.520, budR:0.095, bloomTilt:0.88, budTilt:0.05, scaleW:0.280, scaleH:0.64, yBase:-0.20, rotOffset:0.15, cup:0.115 },
  { count:9,  bloomR:0.670, budR:0.130, bloomTilt:1.06, budTilt:0.07, scaleW:0.330, scaleH:0.74, yBase:-0.29, rotOffset:0.58, cup:0.130 },
  { count:8,  bloomR:0.820, budR:0.170, bloomTilt:1.22, budTilt:0.10, scaleW:0.370, scaleH:0.84, yBase:-0.38, rotOffset:0.35, cup:0.145 },
]

const LAYER_OFFSETS = LAYERS.map((_, li) =>
  LAYERS.slice(0, li).reduce((s, l) => s + l.count, 0)
)
const TOTAL_PETALS = LAYERS.reduce((s, l) => s + l.count, 0)

// ── Helpers ───────────────────────────────────────────────────────────────────
const lerpN = (a: number, b: number, t: number) => a + (b - a) * t

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

// ── Cupped parametric petal geometry ─────────────────────────────────────────
// Creates a petal that narrows at base, swells in middle, tapers to tip,
// and has a bowl curvature — far more organic than a flat plane.
function buildPetalGeometry(w: number, h: number, cup: number): THREE.BufferGeometry {
  const uSegs = 16
  const vSegs = 22
  const positions: number[] = []
  const indices:   number[] = []

  for (let vi = 0; vi <= vSegs; vi++) {
    const vt = vi / vSegs  // 0 = base, 1 = tip

    // Width envelope: narrow at base, broad in lower-mid, tapers at tip
    const env  = Math.pow(Math.sin(vt * Math.PI * 0.88), 0.65)
    const halfW = w * env

    // Y position along the petal axis
    const y = vt * h

    // Forward arc: petal bends gently toward viewer at tip
    const zArc = 0.09 * h * (vt * vt)

    for (let ui = 0; ui <= uSegs; ui++) {
      const u = (ui / uSegs) * 2 - 1  // −1 … +1

      const x = u * halfW

      // Bowl shape: centre concave, edges flare outward
      const cupZ = cup * (1 - u * u) * Math.sin(vt * Math.PI * 0.95)
      const z = zArc + cupZ

      positions.push(x, y, z)
    }
  }

  for (let vi = 0; vi < vSegs; vi++) {
    for (let ui = 0; ui < uSegs; ui++) {
      const a = vi * (uSegs + 1) + ui
      const b = a + 1
      const c = a + (uSegs + 1)
      const d = c + 1
      indices.push(a, c, b,  b, c, d)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setIndex(indices)
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.computeVertexNormals()
  return geo
}

// ── Palette — high-contrast coral burgundy ────────────────────────────────────
const C_INNER = new THREE.Color('#C03838')  // vivid deep coral
const C_OUTER = new THREE.Color('#641818')  // rich dark burgundy

// ── Peony scene ───────────────────────────────────────────────────────────────
function Peony() {
  const groupRef  = useRef<THREE.Group>(null)
  const stamenRef = useRef<THREE.Mesh>(null)
  const { mouse } = useThree()
  const mSmooth   = useRef({ x: 0, y: 0 })

  const radialRefs = useRef<(THREE.Group | null)[]>(Array(TOTAL_PETALS).fill(null))
  const tiltRefs   = useRef<(THREE.Group | null)[]>(Array(TOTAL_PETALS).fill(null))

  // Cupped parametric geometry per layer
  const petalGeoms = useMemo(() =>
    LAYERS.map(l => buildPetalGeometry(l.scaleW, l.scaleH, l.cup)), [])

  // MeshPhysicalMaterial with SSS + velvet sheen per layer
  const petalMats = useMemo(() =>
    LAYERS.map((_, li) => {
      const t     = li / (N_LAYERS - 1)
      const color = C_INNER.clone().lerp(C_OUTER, t * 0.80)
      return new THREE.MeshPhysicalMaterial({
        color,
        roughness:           0.50,
        metalness:           0.00,
        // Subsurface scattering: light bleeds through thin petal edges
        transmission:        0.08,
        thickness:           1.1,
        attenuationColor:    new THREE.Color('#FF1500'),
        attenuationDistance: 0.50,
        // Velvet-like retroreflection
        sheen:               1.0,
        sheenRoughness:      0.40,
        sheenColor:          new THREE.Color('#FF5A3A'),
        // Subtle petal-surface gloss
        clearcoat:           0.10,
        clearcoatRoughness:  0.68,
        side: THREE.DoubleSide,
        envMapIntensity:     1.8,
      })
    }), [])

  const stamenMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color:          new THREE.Color('#C8980E'),
    roughness:      0.50,
    metalness:      0.22,
    sheen:          0.50,
    sheenColor:     new THREE.Color('#FFE040'),
    sheenRoughness: 0.35,
    envMapIntensity: 1.2,
  }), [])

  const leafMat = useMemo(() => new THREE.MeshStandardMaterial({
    color:    new THREE.Color('#2F5E2F'),
    roughness: 0.78,
    metalness: 0.00,
    side:     THREE.DoubleSide,
    envMapIntensity: 0.6,
  }), [])

  useEffect(() => () => {
    petalGeoms.forEach(g => g.dispose())
    petalMats.forEach(m => m.dispose())
    stamenMat.dispose()
    leafMat.dispose()
  }, [petalGeoms, petalMats, stamenMat, leafMat])

  // ── Animation ─────────────────────────────────────────────────────────────
  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()

    // Weighted, heavy mouse parallax via lerp
    mSmooth.current.x += (mouse.x * 0.20 - mSmooth.current.x) * 0.030
    mSmooth.current.y += (-mouse.y * 0.13 - mSmooth.current.y) * 0.030

    groupRef.current.rotation.y = t * 0.038 + mSmooth.current.x
    groupRef.current.rotation.x = mSmooth.current.y

    // Bloom: sine ping-pong 0→1→0
    const globalBloom = (Math.sin(t * BLOOM_SPEED - Math.PI / 2) + 1) / 2

    // Stamen reveals when nearly full open
    if (stamenRef.current) {
      stamenRef.current.scale.setScalar(smoothstep(0.62, 0.92, globalBloom))
    }

    for (let li = 0; li < N_LAYERS; li++) {
      const layer = LAYERS[li]
      // Inner layers (low li) lag the most — bloom from outside in
      const delay    = ((N_LAYERS - 1 - li) / (N_LAYERS - 1)) * STAGGER_RANGE
      const progress = smoothstep(delay, 1.0, globalBloom)

      const radius = lerpN(layer.budR, layer.bloomR, progress)
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
    <group ref={groupRef}>

      {/* ── Stamen ── */}
      <mesh ref={stamenRef} position={[0, 0.09, 0]} material={stamenMat} scale={0}>
        <sphereGeometry args={[0.078, 20, 20]} />
      </mesh>
      {Array.from({ length: 20 }, (_, i) => {
        const a = (i / 20) * Math.PI * 2
        const r = 0.052
        return (
          <mesh key={`f${i}`} position={[Math.cos(a)*r, 0.056, Math.sin(a)*r]} material={stamenMat}>
            <cylinderGeometry args={[0.0020, 0.0013, 0.088, 5]} />
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
              <group position={[0, layer.yBase, 0]}>
                <group
                  ref={el => { radialRefs.current[offset + pi] = el as THREE.Group | null }}
                  position={[0, 0, layer.budR]}
                >
                  <group
                    ref={el => { tiltRefs.current[offset + pi] = el as THREE.Group | null }}
                    rotation={[layer.budTilt, 0, 0]}
                  >
                    <mesh geometry={petalGeoms[li]} material={petalMats[li]} />
                  </group>
                </group>
              </group>
            </group>
          )
        })
      })}

      {/* ── Stem ── */}
      <mesh position={[0, -1.25, 0]}>
        <cylinderGeometry args={[0.013, 0.019, 1.7, 8]} />
        <primitive object={leafMat} attach="material" />
      </mesh>

      {/* ── Leaves ── */}
      <group position={[0.08, -0.72, 0.05]} rotation={[0.22, 0.42, 0.74]}>
        <mesh material={leafMat}>
          <planeGeometry args={[0.24, 0.34]} />
        </mesh>
      </group>
      <group position={[-0.09, -0.98, -0.05]} rotation={[-0.16, -0.52, -0.66]}>
        <mesh material={leafMat}>
          <planeGeometry args={[0.19, 0.28]} />
        </mesh>
      </group>

    </group>
  )
}

// ── Canvas ────────────────────────────────────────────────────────────────────
export default function PeonyCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0.30, 2.45], fov: 50 }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      gl={{
        alpha:               true,
        antialias:           true,
        toneMapping:         THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.55,
      }}
    >
      {/* Studio HDR environment — provides realistic reflections & ambient fill */}
      <Environment preset="studio" />

      {/* Key light: warm upper-left, high intensity for drama */}
      <directionalLight intensity={3.2} position={[-2.5, 6, 2.5]} color="#FFF3EC" />
      {/* Fill light: cool right side, prevents total crush */}
      <directionalLight intensity={0.28} position={[4, 1.5, -1.5]} color="#EAF0FF" />
      {/* SSS backlight: punches warm light through petals from behind */}
      <pointLight intensity={2.2} position={[0, 1.8, -3.2]} color="#FF2800" decay={2} />
      {/* Top rim: separates flower from background */}
      <directionalLight intensity={0.55} position={[0, 9, -1]} color="#FFE8D8" />

      <Peony />

      {/* Contact shadow — soft, deep, warm-tinted ground shadow */}
      <ContactShadows
        position={[0, -1.42, 0]}
        opacity={0.60}
        scale={4.5}
        blur={2.8}
        far={3.8}
        color="#1E0606"
      />
    </Canvas>
  )
}
