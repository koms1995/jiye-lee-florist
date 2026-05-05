'use client'

import { memo, Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { peonyParallax } from './peonyParallax'

const MODEL_URL = '/models/tulip.glb'
useGLTF.preload(MODEL_URL)

// ── Tulip ────────────────────────────────────────────────────────────────────
function Tulip() {
  const gltf = useGLTF(MODEL_URL) as unknown as { scene: THREE.Group }
  const groupRef       = useRef<THREE.Group>(null)
  const { size }       = useThree()
  const mSmooth        = useRef({ x: 0, y: 0 })
  const parallaxSmooth = useRef(0)
  const entryT         = useRef(0)
  const scaleVec       = useRef(new THREE.Vector3(1, 1, 1))

  // Clone the scene so subsequent re-mounts don't mutate the cached source.
  // Keep original materials/textures intact.
  const { scene, fitScale } = useMemo(() => {
    const cloned = gltf.scene.clone(true)
    const bb = new THREE.Box3().setFromObject(cloned)
    const center = bb.getCenter(new THREE.Vector3())
    const sz     = bb.getSize(new THREE.Vector3())
    cloned.position.sub(center)
    const fit = 2.4 / Math.max(sz.x, sz.y, sz.z)
    return { scene: cloned, fitScale: fit }
  }, [gltf.scene])

  const BASE_POS = useMemo(() => new THREE.Vector3(0.18, 0.10, 0), [])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()

    entryT.current += (1 - entryT.current) * 0.04
    const entryScale = 0.86 + 0.14 * entryT.current

    const aspect = size.width / size.height
    const aspectScale = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(aspect, 0.40, 1.30, 1.00, 1.18),
      1.00, 1.18,
    )
    const breath = 1 + Math.sin(t * 0.62) * 0.005
    scaleVec.current.setScalar(fitScale * aspectScale * entryScale * breath)
    groupRef.current.scale.lerp(scaleVec.current, 0.08)

    const mGain = entryT.current
    mSmooth.current.x += (peonyParallax.mouseX * 0.45 * mGain - mSmooth.current.x) * 0.085
    mSmooth.current.y += (peonyParallax.mouseY * 0.30 * mGain - mSmooth.current.y) * 0.085

    parallaxSmooth.current += (peonyParallax.progress - parallaxSmooth.current) * 0.08
    const pY = parallaxSmooth.current * 0.10
    const pX = parallaxSmooth.current * 0.040

    const ambientYaw = Math.sin(t * 0.12) * 0.16
    const swayY = Math.sin(t * 0.32) * 0.022 + Math.sin(t * 0.47 + 1.3) * 0.012
    const swayX = Math.cos(t * 0.27 + 0.5) * 0.018
    const bankZ = mSmooth.current.x * -0.32 + Math.sin(t * 0.21) * 0.012

    groupRef.current.rotation.y = mSmooth.current.x + pY + swayY + ambientYaw
    groupRef.current.rotation.x = mSmooth.current.y + pX + swayX
    groupRef.current.rotation.z = bankZ

    const bobY = Math.sin(t * 0.55) * 0.09 + Math.cos(t * 0.33 + 0.7) * 0.04
    const bobX = Math.sin(t * 0.41 + 1.2) * 0.025
    const driftX = mSmooth.current.x * 0.30 * mGain
    const driftY = -mSmooth.current.y * 0.18 * mGain
    groupRef.current.position.x = BASE_POS.x + driftX + bobX
    groupRef.current.position.y = BASE_POS.y + bobY + driftY
    groupRef.current.position.z = BASE_POS.z
  })

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  )
}

// ── Canvas wrapper ───────────────────────────────────────────────────────────
function PeonyCanvasInner() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 0, 4.20], fov: 42 }}
        // Cap pixel ratio to reduce GPU load. Many "context lost" reports on
        // Chrome trace back to oversaturated GPU work on retina displays.
        dpr={[1, 1.75]}
        // Explicit. Default is "always" but being explicit guards against any
        // upstream change to defaults.
        frameloop="always"
        style={{
          position:      'absolute',
          inset:         0,
          background:    'transparent',
          // pointer-events: none so clicks pass through to the grid/UI below.
          // Mouse parallax is sourced from a window-level tracker
          // (peonyParallax.mouseX/Y), not useThree().mouse.
          pointerEvents: 'none',
        }}
        gl={{
          alpha:                          true,
          antialias:                      true,
          toneMapping:                    THREE.ACESFilmicToneMapping,
          toneMappingExposure:            1.15,
          // Use default power preference. "high-performance" can force
          // discrete-GPU usage which is more prone to context loss when
          // the OS switches GPUs (common on Mac laptops).
          powerPreference:                'default',
          // Allow software fallback if hardware accel is unavailable.
          failIfMajorPerformanceCaveat:   false,
          // Don't preserve drawing buffer — saves GPU memory.
          preserveDrawingBuffer:          false,
        }}
        // Register WebGL context lost / restored handlers. If Chrome reaps
        // the context (memory pressure, GPU process restart, tab background),
        // we acknowledge the loss and let three.js restore on next paint.
        onCreated={({ gl }) => {
          const canvas = gl.domElement
          const onLost = (e: Event) => {
            // Required: prevent default so the browser will fire
            // webglcontextrestored later instead of giving up.
            e.preventDefault()
          }
          canvas.addEventListener('webglcontextlost',     onLost,  false)
          canvas.addEventListener('webglcontextrestored', () => { /* three handles re-init */ }, false)
        }}
      >
        {/* Local ambient (was Environment HDRI). The drei Environment preset
            fetches a remote HDR from pmndrs.github.io which can fail on
            restricted networks or stall the WebGL pipeline; a plain ambient
            gives consistent fill light without the network dependency. */}
        <ambientLight intensity={0.55} color="#FFF5EC" />

        <directionalLight intensity={2.0}  position={[-1.6, 4.6, 3.0]} color="#FFF5EC" />
        <directionalLight intensity={1.2}  position={[0.5, 3.2, -4.5]} color="#E8E8FF" />
        <directionalLight intensity={0.55} position={[3.8, 1.0, -2.2]} color="#FFFFFF" />
        <directionalLight intensity={0.45} position={[0.5, 6.5, 1.5]}  color="#FFE8D8" />
        <pointLight       intensity={0.30} position={[-0.5, -1.5, 2.0]} color="#FFD8C0" decay={2} />

        <Suspense fallback={null}>
          <Tulip />
        </Suspense>

        {/* Halved shadow map resolution (1024 → 512) to ease GPU load. */}
        <ContactShadows
          position={[0, -1.40, 0]}
          opacity={0.40}
          scale={3.0}
          blur={2.4}
          far={1.5}
          resolution={512}
          color="#3A2820"
        />
      </Canvas>
      {/* Attribution lives at PortfolioApp level (TulipAttribution) so it can
          be positioned relative to the viewport — the canvas wrapper here
          extends past the viewport edge (right: -18% on mobile) which would
          push an inner-positioned attribution off-screen. */}
    </div>
  )
}

// memo on a no-prop component is technically a no-op, but it documents intent
// and pairs with the parent passing an empty props bag without React thinking
// "props might've changed." Keeps the React tree as static as possible.
const PeonyCanvas = memo(PeonyCanvasInner)
export default PeonyCanvas
