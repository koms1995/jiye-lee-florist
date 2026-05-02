'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

type LayerConfig = {
  count: number
  radius: number
  tilt: number
  scaleW: number
  scaleH: number
  scaleD: number
  color: string
  yBase: number
  rotOffset: number
}

const LAYERS: LayerConfig[] = [
  { count: 5,  radius: 0.04, tilt: 0.12, scaleW: 0.10, scaleH: 0.22, scaleD: 0.035, color: '#F5D4DC', yBase: 0.05,  rotOffset: 0.0 },
  { count: 6,  radius: 0.10, tilt: 0.28, scaleW: 0.14, scaleH: 0.30, scaleD: 0.04,  color: '#F2C8D2', yBase: 0.02,  rotOffset: 0.5 },
  { count: 7,  radius: 0.18, tilt: 0.45, scaleW: 0.18, scaleH: 0.38, scaleD: 0.04,  color: '#EDB8C8', yBase: -0.02, rotOffset: 0.3 },
  { count: 7,  radius: 0.28, tilt: 0.62, scaleW: 0.22, scaleH: 0.46, scaleD: 0.045, color: '#E5A8BA', yBase: -0.06, rotOffset: 0.8 },
  { count: 8,  radius: 0.40, tilt: 0.80, scaleW: 0.26, scaleH: 0.54, scaleD: 0.045, color: '#D896AA', yBase: -0.10, rotOffset: 0.2 },
  { count: 8,  radius: 0.54, tilt: 0.98, scaleW: 0.30, scaleH: 0.62, scaleD: 0.05,  color: '#CC8098', yBase: -0.14, rotOffset: 0.6 },
  { count: 7,  radius: 0.68, tilt: 1.15, scaleW: 0.32, scaleH: 0.70, scaleD: 0.05,  color: '#C87490', yBase: -0.18, rotOffset: 0.4 },
]

function petalShape(w: number, h: number): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.bezierCurveTo(w * 0.85, h * 0.08, w * 0.85, h * 0.82, 0, h)
  s.bezierCurveTo(-w * 0.85, h * 0.82, -w * 0.85, h * 0.08, 0, 0)
  return s
}

function Peony() {
  const groupRef = useRef<THREE.Group>(null)
  const { mouse } = useThree()

  const shapeGeoms = useMemo(() =>
    LAYERS.map(l => new THREE.ShapeGeometry(petalShape(l.scaleW, l.scaleH), 18)),
    []
  )

  const materials = useMemo(() =>
    LAYERS.map(l => new THREE.MeshStandardMaterial({
      color: new THREE.Color(l.color),
      roughness: 0.65,
      metalness: 0,
      side: THREE.DoubleSide,
    })),
    []
  )

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()
    // Slow self-rotation + mouse parallax
    groupRef.current.rotation.y = t * 0.12 + mouse.x * 0.12
    groupRef.current.rotation.x += (-mouse.y * 0.07 - groupRef.current.rotation.x) * 0.04
  })

  return (
    <group ref={groupRef} position={[0, -0.1, 0]}>
      {/* Stamen center */}
      <mesh scale={[0.12, 0.06, 0.12]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#FAE0E8" roughness={0.9} metalness={0} />
      </mesh>

      {/* Petal layers */}
      {LAYERS.map((layer, li) => {
        const step = (Math.PI * 2) / layer.count
        return Array.from({ length: layer.count }, (_, pi) => {
          const az = step * pi + layer.rotOffset
          return (
            <group key={`${li}-${pi}`} rotation={[0, az, 0]}>
              <group position={[0, layer.yBase, layer.radius]}>
                <mesh
                  geometry={shapeGeoms[li]}
                  material={materials[li]}
                  rotation={[layer.tilt, 0, 0]}
                  // Shift pivot to base of petal (ShapeGeometry base is at y=0)
                  position={[0, 0, 0]}
                />
              </group>
            </group>
          )
        })
      })}

      {/* Stem */}
      <mesh position={[0, -1.1, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.022, 1.4, 8]} />
        <meshStandardMaterial color="#5C8A5C" roughness={0.9} metalness={0} />
      </mesh>

      {/* Leaf 1 */}
      <group position={[0.05, -0.7, 0.04]} rotation={[0.3, 0.5, 0.8]}>
        <mesh>
          <planeGeometry args={[0.18, 0.28, 1, 1]} />
          <meshStandardMaterial color="#4A7A4A" side={THREE.DoubleSide} roughness={0.9} />
        </mesh>
      </group>

      {/* Leaf 2 */}
      <group position={[-0.06, -0.9, -0.04]} rotation={[-0.2, -0.6, -0.7]}>
        <mesh>
          <planeGeometry args={[0.15, 0.24, 1, 1]} />
          <meshStandardMaterial color="#4A7A4A" side={THREE.DoubleSide} roughness={0.9} />
        </mesh>
      </group>
    </group>
  )
}

export default function PeonyCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0.6, 3.2], fov: 48 }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight intensity={0.85} position={[3, 5, 3]} castShadow={false} />
      <directionalLight intensity={0.3} position={[-2, 1, -2]} />
      <Peony />
    </Canvas>
  )
}
