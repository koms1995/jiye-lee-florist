'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'

// ── Layer definitions — 12 layers, fixed fully-open position ─────────────────
type LayerDef = {
  count: number; bloomR: number
  bloomTilt: number
  scaleW: number; scaleH: number; yBase: number
  rotOffset: number; cup: number; ruffle: number; tipCurl: number
}

const N_LAYERS = 12
const LAYERS: LayerDef[] = [
  { count:5,  bloomR:0.045, bloomTilt:0.06, scaleW:0.058, scaleH:0.145, yBase: 0.22, rotOffset:0.00, cup:0.018, ruffle:0.005, tipCurl:0.008 },
  { count:7,  bloomR:0.095, bloomTilt:0.14, scaleW:0.082, scaleH:0.195, yBase: 0.19, rotOffset:0.45, cup:0.030, ruffle:0.008, tipCurl:0.016 },
  { count:8,  bloomR:0.162, bloomTilt:0.26, scaleW:0.112, scaleH:0.255, yBase: 0.14, rotOffset:0.22, cup:0.046, ruffle:0.011, tipCurl:0.024 },
  { count:9,  bloomR:0.248, bloomTilt:0.42, scaleW:0.152, scaleH:0.335, yBase: 0.07, rotOffset:0.70, cup:0.065, ruffle:0.015, tipCurl:0.032 },
  { count:10, bloomR:0.350, bloomTilt:0.58, scaleW:0.198, scaleH:0.425, yBase: 0.00, rotOffset:0.15, cup:0.083, ruffle:0.019, tipCurl:0.040 },
  { count:11, bloomR:0.465, bloomTilt:0.74, scaleW:0.248, scaleH:0.525, yBase:-0.08, rotOffset:0.58, cup:0.099, ruffle:0.023, tipCurl:0.048 },
  { count:12, bloomR:0.590, bloomTilt:0.89, scaleW:0.296, scaleH:0.625, yBase:-0.16, rotOffset:0.35, cup:0.113, ruffle:0.026, tipCurl:0.054 },
  { count:12, bloomR:0.722, bloomTilt:1.02, scaleW:0.340, scaleH:0.720, yBase:-0.24, rotOffset:0.80, cup:0.123, ruffle:0.028, tipCurl:0.060 },
  { count:11, bloomR:0.852, bloomTilt:1.14, scaleW:0.380, scaleH:0.810, yBase:-0.32, rotOffset:0.25, cup:0.130, ruffle:0.030, tipCurl:0.065 },
  { count:10, bloomR:0.978, bloomTilt:1.24, scaleW:0.416, scaleH:0.890, yBase:-0.39, rotOffset:0.60, cup:0.135, ruffle:0.031, tipCurl:0.070 },
  { count:9,  bloomR:1.092, bloomTilt:1.31, scaleW:0.448, scaleH:0.960, yBase:-0.46, rotOffset:0.10, cup:0.138, ruffle:0.032, tipCurl:0.074 },
  { count:7,  bloomR:1.198, bloomTilt:1.37, scaleW:0.476, scaleH:1.020, yBase:-0.52, rotOffset:0.40, cup:0.140, ruffle:0.033, tipCurl:0.078 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const lerpN = (a: number, b: number, t: number) => a + (b - a) * t

// ── Organic petal geometry: ruffled edges + tip curl ─────────────────────────
function buildPetalGeometry(
  w: number, h: number, cup: number, ruffle: number, tipCurl: number
): THREE.BufferGeometry {
  const uSegs = 22
  const vSegs = 30
  const positions: number[] = []
  const indices:   number[] = []

  for (let vi = 0; vi <= vSegs; vi++) {
    const vt     = vi / vSegs
    const env    = Math.pow(Math.sin(vt * Math.PI * 0.88), 0.58)
    const halfW  = w * env
    const y      = vt * h
    const zArc   = 0.072 * h * (vt * vt)
    const curlStart = 0.72
    const curlAmt   = vt > curlStart
      ? tipCurl * h * Math.pow((vt - curlStart) / (1 - curlStart), 2.2)
      : 0
    const tipZ   = -curlAmt

    for (let ui = 0; ui <= uSegs; ui++) {
      const u          = (ui / uSegs) * 2 - 1
      const edgeFactor = Math.max(0, Math.abs(u) - 0.38) / 0.62
      const ruffleZ    = ruffle
        * Math.sin(ui * 6.5 + vt * 4.2)
        * edgeFactor
        * Math.sin(vt * Math.PI * 0.95)
      const x    = u * halfW
      const cupZ = cup * (1 - u * u) * Math.sin(vt * Math.PI * 0.93)
      const z    = zArc + tipZ + cupZ + ruffleZ
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

// ── 5-zone coral palette ──────────────────────────────────────────────────────
const PALETTE_COLORS = [
  new THREE.Color('#7C1828'),
  new THREE.Color('#A82840'),
  new THREE.Color('#C84060'),
  new THREE.Color('#DC6070'),
  new THREE.Color('#EC8090'),
]
const SHEEN_COLORS = [
  new THREE.Color('#FF1030'),
  new THREE.Color('#FF3050'),
  new THREE.Color('#FF5070'),
  new THREE.Color('#FF7090'),
  new THREE.Color('#FF90A8'),
]
const ATTN_COLORS = [
  new THREE.Color('#FF0820'),
  new THREE.Color('#FF2040'),
  new THREE.Color('#FF4060'),
  new THREE.Color('#FF5870'),
  new THREE.Color('#FF7088'),
]

// ── Peony scene ───────────────────────────────────────────────────────────────
function Peony() {
  const groupRef = useRef<THREE.Group>(null)
  const { mouse, size } = useThree()
  const mSmooth  = useRef({ x: 0, y: 0 })
  const scaleVec = useRef(new THREE.Vector3(1, 1, 1))

  const petalGeoms = useMemo(() =>
    LAYERS.map(l => buildPetalGeometry(l.scaleW, l.scaleH, l.cup, l.ruffle, l.tipCurl)), [])

  const petalMats = useMemo(() =>
    LAYERS.map((_, li) => {
      const t     = li / (N_LAYERS - 1)
      const zone  = t * 4
      const zLow  = Math.floor(zone)
      const zHigh = Math.min(4, zLow + 1)
      const zT    = zone - zLow

      const color    = PALETTE_COLORS[zLow].clone().lerp(PALETTE_COLORS[zHigh], zT)
      const sheenCol = SHEEN_COLORS[zLow].clone().lerp(SHEEN_COLORS[zHigh], zT)
      const attnCol  = ATTN_COLORS[zLow].clone().lerp(ATTN_COLORS[zHigh], zT)

      return new THREE.MeshPhysicalMaterial({
        color,
        roughness:           0.44,
        metalness:           0.00,
        transmission:        lerpN(0.14, 0.06, t),
        thickness:           lerpN(1.6,  0.9,  t),
        attenuationColor:    attnCol,
        attenuationDistance: 0.38,
        sheen:               1.0,
        sheenRoughness:      0.32,
        sheenColor:          sheenCol,
        clearcoat:           0.10,
        clearcoatRoughness:  0.70,
        side:                THREE.DoubleSide,
        envMapIntensity:     2.2,
      })
    }), [])

  const stamenMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color:           new THREE.Color('#CCA012'),
    roughness:       0.42,
    metalness:       0.28,
    sheen:           0.65,
    sheenColor:      new THREE.Color('#FFE858'),
    sheenRoughness:  0.28,
    envMapIntensity: 1.5,
  }), [])

  const leafMat = useMemo(() => new THREE.MeshStandardMaterial({
    color:           new THREE.Color('#2A5C28'),
    roughness:       0.74,
    metalness:       0.00,
    side:            THREE.DoubleSide,
    envMapIntensity: 0.7,
  }), [])

  useEffect(() => () => {
    petalGeoms.forEach(g => g.dispose())
    petalMats.forEach(m => m.dispose())
    stamenMat.dispose()
    leafMat.dispose()
  }, [petalGeoms, petalMats, stamenMat, leafMat])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()

    // Responsive scale
    const aspect = size.width / size.height
    const targetScale = aspect < 0.70 ? 1.18
                      : aspect < 1.00 ? 1.05
                      : aspect < 1.50 ? 0.95
                      : 0.88
    scaleVec.current.setScalar(targetScale)
    groupRef.current.scale.lerp(scaleVec.current, 0.04)

    // Mouse parallax
    mSmooth.current.x += (mouse.x * 0.20 - mSmooth.current.x) * 0.028
    mSmooth.current.y += (-mouse.y * 0.14 - mSmooth.current.y) * 0.028

    // Slow rotation only — no bloom animation
    groupRef.current.rotation.y = t * 0.032 + mSmooth.current.x
    groupRef.current.rotation.x = mSmooth.current.y
  })

  return (
    <group ref={groupRef} position={[0, 0.12, 0]}>

      {/* Stamen */}
      <mesh position={[0, 0.10, 0]} material={stamenMat}>
        <sphereGeometry args={[0.070, 22, 22]} />
      </mesh>
      {Array.from({ length: 26 }, (_, i) => {
        const a = (i / 26) * Math.PI * 2
        const r = 0.046
        return (
          <mesh key={`f${i}`} position={[Math.cos(a)*r, 0.062, Math.sin(a)*r]} material={stamenMat}>
            <cylinderGeometry args={[0.0016, 0.0010, 0.092, 5]} />
          </mesh>
        )
      })}

      {/* Petal layers — fully open, static positions */}
      {LAYERS.map((layer, li) => {
        const step = (Math.PI * 2) / layer.count
        return Array.from({ length: layer.count }, (_, pi) => {
          const az = step * pi + layer.rotOffset
          return (
            <group key={`${li}-${pi}`} rotation={[0, az, 0]}>
              <group position={[0, layer.yBase, 0]}>
                <group position={[0, 0, layer.bloomR]}>
                  <group rotation={[layer.bloomTilt, 0, 0]}>
                    <mesh geometry={petalGeoms[li]} material={petalMats[li]} />
                  </group>
                </group>
              </group>
            </group>
          )
        })
      })}

      {/* Stem */}
      <mesh position={[0, -1.30, 0]}>
        <cylinderGeometry args={[0.011, 0.017, 1.82, 8]} />
        <primitive object={leafMat} attach="material" />
      </mesh>

      {/* Leaves */}
      <group position={[0.09, -0.74, 0.06]} rotation={[0.20, 0.40, 0.72]}>
        <mesh material={leafMat}>
          <planeGeometry args={[0.26, 0.36]} />
        </mesh>
      </group>
      <group position={[-0.10, -1.00, -0.06]} rotation={[-0.15, -0.50, -0.64]}>
        <mesh material={leafMat}>
          <planeGeometry args={[0.20, 0.30]} />
        </mesh>
      </group>

    </group>
  )
}

// ── Canvas ────────────────────────────────────────────────────────────────────
export default function PeonyCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0.18, 3.2], fov: 50 }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      gl={{
        alpha:               true,
        antialias:           true,
        toneMapping:         THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.70,
      }}
    >
      <Environment preset="studio" />
      <directionalLight intensity={4.2} position={[-2.8, 6.5, 3.0]} color="#FFF0E6" />
      <directionalLight intensity={0.38} position={[4.5, 2.0, -2.0]} color="#E6EEFF" />
      <pointLight intensity={3.2} position={[0.5, 2.0, -3.8]} color="#FF1830" decay={2} />
      <pointLight intensity={0.90} position={[0, -1.6, 2.2]} color="#FFD0B0" decay={2} />
      <directionalLight intensity={0.68} position={[0, 9.5, -2.0]} color="#FFE6D6" />
      <directionalLight intensity={0.22} position={[-5, 1.0, 1.5]} color="#FFE0D8" />
      <Peony />
    </Canvas>
  )
}
